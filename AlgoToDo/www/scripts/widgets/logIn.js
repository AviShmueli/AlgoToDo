(function () {
    'use strict';

    angular
        .module('app.widgets')
        .controller('logInCtrl', logInCtrl);

    logInCtrl.$inject = ['$rootScope', '$scope', 'datacontext', 'logger', 'cordovaPlugins', '$q', 'pushNotifications',
                          'device', '$mdDialog', 'DAL', '$location', 'contactsSync', '$timeout', '$interval', 'storage'];

    function logInCtrl($rootScope, $scope, datacontext, logger, cordovaPlugins, $q, pushNotifications,
                        device, $mdDialog, DAL, $location, contactsSync, $timeout, $interval, storage) {

        angular.element(document.querySelectorAll('html')).addClass("hight-auto");
        angular.element(document.getElementsByTagName('body')).removeClass('background-white');

        var vm = this;
        vm.showCube = false;
        vm.imagesPath = device.getImagesPath();
        vm.inProgress = false;
        vm.user = {};
        vm.loadingMode = 'syncing';
        vm.progress = 10;

        vm.user = datacontext.getUserFromLocalStorage();
        if (vm.user !== undefined) {
            datacontext.reloadAllTasks();
            $location.path('/tasksList');
        }

        vm.signupWizardSteps = {
            1: {
                stepNum: 1,
                stepName: 'name&phone',
                uiMessage: 'רושם את המשתמש ...'
            },
            2: {
                stepNum: 2,
                stepName: 'pushNotification_registration',
                uiMessage: 'רושם את המכשיר ...'
            },
            3: {
                stepNum: 3,
                stepName: 'contacts_autorization',
                uiMessage: 'מסנכרן את אנשי הקשר שלך ...'
            },
            4: {
                stepNum: 4,
                stepName: 'storage_autorization',
                uiMessage: 'מקבל הרשאה לגלריה ...'
            },
            5: {
                stepNum: 5,
                stepName: 'compleate',
                uiMessage: 'טוען נתונים ... '
            }
        };

        vm.currentStep = vm.signupWizardSteps[1];
        var interval_step2, interval_step3, interval_step4, interval_step5;

        vm.goToSignUp = function () {
            if (device.isMobileDevice()) {
                $location.path('/signUp');
            }
            else {
                showDowlandAppAlert();
            }
        }

        vm.submitOnEnter = function (ev) {
            if (ev.keyCode == 13) {
                vm.signMeUp();
            }
        }

        vm.signMeUp = function () {
            if (vm.inProgress === false) {
                vm.inProgress = true;
                signUp();
            }
        };

        var signUp = function () {
            DAL.checkIfUserExist(vm.userPhone).then(function (response) {
                if (response.data !== null && response.data !== '') {
                    vm.user = response.data;                       
                    verifyUser();                 
                }
                else {
                    showUserNotExistAlert();
                    vm.inProgress = false;
                    angular.element(document.getElementsByTagName('body')).removeClass('background-white');
                }

            }, function (error) {
                vm.inProgress = false;
                angular.element(document.getElementsByTagName('body')).removeClass('background-white');
                logger.error("error while trying to check If User Exist", error);
                showRegistrationFailedAlert();
            });

        };

        var verifyUser = function () {
            // check here if reg-code recived by sms match reg-code in server
            showVerificationCodePrompt(vm.user._id).then(function (verificationCode) {

                DAL.checkIfVerificationCodeMatch(vm.user, verificationCode).then(function (result) {
                    if (result.data === 'ok') {

                        datacontext.saveUserToLocalStorage(vm.user);

                        showCube();

                        if (device.isMobileDevice()) {
                            step2_register_for_push();
                        }
                        else {
                            step3_contact_sync();
                        }
                    } else {
                        showVerificationFailedAlert();
                        vm.inProgress = false;
                        angular.element(document.getElementsByTagName('body')).removeClass('background-white');
                    }
                }, function (error) {
                    vm.inProgress = false;
                    angular.element(document.getElementsByTagName('body')).removeClass('background-white');
                    logger.error("error while trying to check If VerificationCode Match", error);
                    showRegistrationFailedAlert();
                });
            }, function () {
                DAL.reSendVerificationCodeToUser(vm.user._id);
            });
        }

        var step2_register_for_push = function () {

            vm.progress = 5;
            vm.currentStep = vm.signupWizardSteps[2];
            interval_step2 = $interval(function () {
                if (vm.progress < 30) {
                    vm.progress = vm.progress + 5;
                }
            }, 1500);

            registerUserForPushService().then(function (registrationId) {

                var fieldToUpdate = '';

                if (vm.user.device.platform === 'iOS') {
                    vm.user.ApnRegistrationId = registrationId;
                    fieldToUpdate = 'ApnRegistrationId';
                }
                if (vm.user.device.platform === 'Android') {
                    vm.user.GcmRegistrationId = registrationId;
                    fieldToUpdate = 'GcmRegistrationId';
                }

                DAL.updateUserDetails(vm.user._id, fieldToUpdate, registrationId).then(function () {
                    pushNotifications.testPushRegistration([vm.user._id])
                        .then(function (response) {
                            if (response.data.status === 'ok') {
                                step3_contact_sync();
                            }
                            else {
                                logger.error("New user canot get push notification", { user: vm.user, message: response.data.message });
                                showRegistrationFailedAlert();
                            }
                        }
                        , function (error) {
                            logger.error("Error while try to test user for push notification", error);
                        }
                    );
                });
            });
        }

        var step3_contact_sync = function () {

            $interval.cancel(interval_step2);
            vm.progress = 30;
            vm.currentStep = vm.signupWizardSteps[3];
            interval_step3 = $interval(function () {
                if (vm.progress < 60) {
                    vm.progress = vm.progress + 5;
                }
            }, 1500);

            contactsSync.syncPhoneContactsWithServer().then(function () {
                step4_storage_autorization();
            }, function (error) {
                logger.error("Error in contacts sync process", error);
                step4_storage_autorization();
            });
        }

        var step4_storage_autorization = function () {

            $interval.cancel(interval_step3);
            vm.progress = 60;
            vm.currentStep = vm.signupWizardSteps[4];
            interval_step4 = $interval(function () {
                if (vm.progress < 75) {
                    vm.progress = vm.progress + 5;
                }
                
            }, 1500);

            if (device.isMobileDevice()) {
                storage.getAutorizationFromUser().then(function () {
                    step5_compleate();
                }, function () {
                    step5_compleate();
                });
            }
            else {
                step5_compleate();
            }
            
        }

        var step5_compleate = function () {

            $interval.cancel(interval_step4);

            vm.currentStep = vm.signupWizardSteps[5];

            datacontext.reloadAllTasks().then(function () {

                vm.progress = 75;
                interval_step5 = $interval(function () {
                    if (vm.progress < 100) {
                        vm.progress = vm.progress + 5;
                    } else {
                        $interval.cancel(interval_step5);
                        $location.path('/tasksList');
                        //angular.element(document.getElementsByTagName('body')).removeClass('background-white');
                    }
                }, 500);

            });
        }

        var registerUserForPushService = function () {
            var deferred = $q.defer();

            pushNotifications.initializePushV5().then(function () {
                pushNotifications.registerForPushNotifications().then(function (registrationId) {
                    deferred.resolve(registrationId);
                });
            }, function (error) {
                logger.error("error while trying to register user to app", error);
            });

            return deferred.promise;
        };

        var showVerificationFailedAlert = function () {
            $mdDialog.show(
              $mdDialog.alert()
                .parent(angular.element(document.querySelector('#VerificationFailedAlertContainer')))
                .clickOutsideToClose(true)
                .title('שגיאה')
                .textContent('תהליך הזיהוי נכשל, הקוד שהוכנס לא תואם למספר הטלפון שהוקש, אנא נסה שנית.')
                .ariaLabel('Alert Dialog Demo')
                .ok('המשך')
            );
        };

        var showUserNotExistAlert = function () {
            $mdDialog.show(
              $mdDialog.alert()
                .parent(angular.element(document.querySelector('#VerificationFailedAlertContainer')))
                .clickOutsideToClose(true)
                .title('שגיאה')
                .textContent('לא הצלחנו למצוא את מספר הטלפון שלך, אם עוד לא נרשמת הירשם עכשיו.')
                .ariaLabel('Alert Dialog Demo')
                .ok('המשך')
            );
        };

        var showRegistrationFailedAlert = function () {
            $mdDialog.show(
              $mdDialog.alert()
                .parent(angular.element(document.querySelector('#RegistrationFailedAlertContainer')))
                .clickOutsideToClose(true)
                .title('שגיאה')
                .textContent('מצטערים!   תהליך ההתחברות נכשל , תנו לנו עוד הזדמנות ונסו שוב להיתחבר. אם הבעיה נמשכת נשמח אם תפנו אלינו במייל או בטלפון.')
                .ariaLabel('Alert Dialog Demo')
                .ok('המשך')
            );
        };

        var showVerificationCodePrompt = function (userId) {
            return $mdDialog.show({
                controller: 'verificationCodeCtrl',
                templateUrl: 'scripts/widgets/verificationCodeDialog.tmpl.html',
                parent: angular.element(document.querySelector('#VerificationCodePromptContainer')),
                clickOutsideToClose: false,
                locals: {
                    userId: userId
                }
            });
        };
        
        var showCube = function () {
            vm.showCube = true;
            vm.loadingMode = 'syncing';
            angular.element(document.querySelectorAll('html')).removeClass("hight-auto");
            angular.element(document.getElementsByTagName('body')).addClass('background-white');
        };

        vm.exitApp = false;

        var backbuttonClick_allways_Callback = function (e) {

            if ($location.path() === '/logIn') {
                e.preventDefault();
                if (!vm.exitApp) {
                    vm.exitApp = true;
                    cordovaPlugins.showToast("הקש שוב ליציאה", 1000);
                    $timeout(function () { vm.exitApp = false; }, 1000);
                } else {
                    window.plugins.toast.hide();
                    navigator.app.exitApp();
                }
            }
        };

        document.addEventListener("deviceready", function () {
            document.addEventListener("backbutton", backbuttonClick_allways_Callback, false);
        }, false);

        var showDowlandAppAlert = function () {
            $mdDialog.show(
              $mdDialog.confirm()
                .parent(angular.element(document.querySelector('#RegistrationFailedAlertContainer')))
                .clickOutsideToClose(true)
                .title('מצטערים!')
                .textContent('הרשמה ניתנת רק באמצעאות האפליקציה, ניתן להוריד אותה בחינם מהחנות.')
                .ariaLabel('Alert Dialog Demo')
                .ok('הורד עכשיו')
                .cancel('לא עכשיו')
            ).then(function () {
                window.open('http://www.asiti.net/download-asiti', '_blank');
            });
        }

    }

})();
