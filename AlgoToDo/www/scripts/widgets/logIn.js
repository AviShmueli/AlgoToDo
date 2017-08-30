(function () {
    'use strict';

    angular
        .module('app.widgets')
        .controller('logInCtrl', logInCtrl);

    logInCtrl.$inject = ['$rootScope', '$scope', 'datacontext', 'logger', 'cordovaPlugins', '$q', 'pushNotifications',
                          'device', '$mdDialog', 'DAL', '$location', 'contactsSync', '$timeout'];

    function logInCtrl($rootScope, $scope, datacontext, logger, cordovaPlugins, $q, pushNotifications,
                        device, $mdDialog, DAL, $location, contactsSync, $timeout) {

        angular.element(document.querySelectorAll('html')).addClass("hight-auto");

        var vm = this;
        vm.showCube = false;
        vm.imagesPath = device.getImagesPath();
        vm.inProgress = false;
        vm.user = {};
        vm.loadingMode = 'syncing';

        vm.user = datacontext.getUserFromLocalStorage();
        if (vm.user !== undefined) {
            datacontext.reloadAllTasks();
            $location.path('/tasksList');
        }

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

                    if (device.isMobileDevice()) {
                        DAL.saveUsersNewRegistrationId('', vm.user);
                        registerUserForPushService().then(function (registrationId) {
                            DAL.saveUsersNewRegistrationId(registrationId, vm.user);
                            
                            verifyUser();
                        });
                    }
                    else {
                        verifyUser();
                    }
                }
                else {
                    showUserNotExistAlert();
                    vm.inProgress = false;
                }

            }, function (error) {
                vm.inProgress = false;
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
                        contactsSync.syncPhoneContactsWithServer().then(function () {
                            vm.loadingMode = 'loading';
                            datacontext.reloadAllTasks().then(function () {
                                $location.path('/tasksList');
                            });
                        }, function () {
                            vm.loadingMode = 'loading';
                            datacontext.reloadAllTasks().then(function () {
                                $location.path('/tasksList');
                            });
                        });
                    }
                    else {
                        showVerificationFailedAlert();
                        vm.inProgress = false;
                    }
                }, function (error) {
                    vm.inProgress = false;
                    logger.error("error while trying to check If VerificationCode Match", error);
                    showRegistrationFailedAlert();
                });
            }, function () {
                DAL.reSendVerificationCodeToUser(vm.user._id);
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
