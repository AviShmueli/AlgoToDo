(function () {
    'use strict';
    
    angular
        .module('app.widgets')
        .controller('signUpCtrl', signUpCtrl)
        /*.directive('tmSignUp', signUp);

    function signUp() {
        var directive = {
            controller: signUpCtrl,
            controllerAs: 'vm',
            templateUrl: 'scripts/widgets/signUp.html',
            restrict: 'A',
            scope: {
                'user': '=',
                'signUp': '&'
            }
        };
*/
    signUpCtrl.$inject = ['$scope', 'datacontext', 'logger', 'cordovaPlugins', '$q', 'pushNotifications',
                          'device', '$mdDialog'];

    function signUpCtrl($scope, datacontext, logger, cordovaPlugins, $q, pushNotifications,
                        device, $mdDialog) {
            var vm = this;

            vm.inProgress = false;
            vm.user = {};
            vm.AllCliqot = [];

            datacontext.getAllCliqot().then(function (allCliqot){
                vm.AllCliqot = allCliqot;
            });
            

            vm.signMeUp = function () {
                if (vm.inProgress === false) {
                    vm.inProgress = true;
                    signUp();
                }
            }

            var user = datacontext.getUserFromLocalStorage();
            if (user !== undefined) {
                window.location = '#/';
            }

            var signUp = function () {
                datacontext.checkIfUserExist(vm.user).then(function (response) {
                    if (response.data !== null && response.data !== '') {
                        
                        var user = response.data;
                        
                        // if this is mobile and the user not registerd to GCM or APN
                        if ((device.isMobileDevice() && device.getDeviceDetails().platform === 'Android' &&
                         (user.GcmRegistrationId === '' || user.GcmRegistrationId === undefined)) ||
                         (device.isMobileDevice() && device.getDeviceDetails().platform === 'iOS' &&
                         (user.ApnRegistrationId === '' || user.ApnRegistrationId === undefined))) {
                            registerUserForPushService().then(function (registrationId) {
                                datacontext.saveUsersNewRegistrationId(registrationId, user);
                                // check here if reg-code recived by sms match reg-code in server
                                showVerificationCodePrompt().then(function (verificationCode) {

                                    datacontext.checkIfVerificationCodeMatch(user, verificationCode).then(function (result) {
                                        if (result.data === 'ok') {
                                            datacontext.saveUserToLocalStorage(response.data);
                                            window.location = '#/';
                                        }
                                        else {
                                            showVerificationFailedAlert();
                                            vm.inProgress = false;
                                        }
                                    }, function (error) {
                                        logger.error("error while trying to check If VerificationCode Match", error);
                                    });
                                });
                            });
                        }
                        else {
                            // check here if reg-code recived by sms match reg-code in server
                            showVerificationCodePrompt().then(function (verificationCode) {

                                datacontext.checkIfVerificationCodeMatch(user, verificationCode).then(function (result) {
                                    if (result.data === 'ok') {
                                        datacontext.saveUserToLocalStorage(response.data);
                                        window.location = '#/';
                                    }
                                    else {
                                        showVerificationFailedAlert();
                                        vm.inProgress = false;
                                    }
                                }, function (error) {
                                    logger.error("error while trying to check If VerificationCode Match", error);
                                });
                            }); 
                        }
                    }
                    else {
                        registerUser();
                    }

                }, function (error) {
                    logger.error("error while trying to check If User Exist", error);
                });

            };

            var registerUser = function () {

                if (vm.user.sex === 'woman') {
                    vm.user.avatarUrl = '/images/woman-' + Math.floor((Math.random() * 15) + 1) + '.svg';
                }
                else{
                    vm.user.avatarUrl = '/images/man-' + Math.floor((Math.random() * 9) + 1) + '.svg';
                }
            

                if (device.isMobileDevice()) {

                    document.addEventListener("deviceready", function () {

                        vm.user.device = device.getDeviceDetails();
                        datacontext.setDeviceDetailes(vm.user.device, cordova.file.applicationDirectory);

                        pushNotifications.initializePushV5().then(function () {
                            pushNotifications.registerForPushNotifications().then(function (registrationId) {

                                if (vm.user.device.platform === 'iOS') {
                                    vm.user.ApnRegistrationId = registrationId;
                                }
                                if (vm.user.device.platform === 'Android') {
                                    vm.user.GcmRegistrationId = registrationId;
                                }
                                datacontext.registerUser(vm.user).then(function (response) {

                                    // check here if reg-code recived by sms match reg-code in server
                                    showVerificationCodePrompt().then(function (verificationCode) {
                                        var user = response.data;
                                        datacontext.checkIfVerificationCodeMatch(user, verificationCode).then(function (result) {
                                            if (result.data === 'ok') {
                                                datacontext.saveUserToLocalStorage(user);
                                                window.location = '#/';
                                            }
                                            else {
                                                showVerificationFailedAlert();
                                                vm.inProgress = false;
                                            }
                                        }, function (error) {
                                            logger.error("error while trying to check If VerificationCode Match", error);
                                        });
                                    });                                   
                                }, function () { });
                            });
                        }, function (error) {
                            logger.error("error while trying to register user to app", error);
                        });
                    }, false);
                }
                else {
                    datacontext.registerUser(vm.user).then(function (response) {

                        // check here if reg-code recived by sms match reg-code in server
                        showVerificationCodePrompt().then(function (verificationCode) {
                            var user = response.data;
                            datacontext.checkIfVerificationCodeMatch(user, verificationCode).then(function (result) {
                                if (result.data === 'ok') {
                                    datacontext.saveUserToLocalStorage(response.data);
                                    logger.success('user signUp successfuly', response.data);
                                    window.location = '#/';
                                }
                                else {
                                    showVerificationFailedAlert();
                                    vm.inProgress = false;
                                }
                            }, function (error) {
                                logger.error("error while trying to check If VerificationCode Match", error);
                            });
                        });                       
                    }, function (error) {
                        logger.error("error while trying to register user to app", error);
                    });
                }
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
            }

            vm.showCliqaAlert = function (ev) {
                $mdDialog.show(
                  $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .title('קליקה')
                    .textContent('קליקה היא קבוצת האנשים (הארגון) איתו אתה עובד ומקבל משימות.'+ '\n'+
                            'בעתיד הקמת קליקות תהיה באופן חופשי ועצמאי,'+ '\n' +
                            'כרגע חובה לבחור קליקה מתוך הרשימה.'+ '\n\n' +
                            'אם אתה נסיין של המערכת אנא בחר "נסייני מערכת" מתוך הרשימה')
                    .ariaLabel('Alert Dialog Demo')
                    .ok('הבנתי!')
                    .targetEvent(ev)
                );
            };
 
            vm.showTermsOfServiceAlert = function myfunction(ev) {
                $mdDialog.show(
                  $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .title('תנאי השירות')
                    .textContent('האפליקציה פועלת בתחום המשימות, במטרה לסייע לכל אחד לבצע את המשימות האישיות והחברתיות שלו.ניתן לנהל משימות אישיות, לשלוח לנמענים, לעקוב אחר ביצוע ולנהל שיחה על כל משימה ומשימה.האפליקציה מיועדת לאנשים פרטיים, חברות וארגונים, בתי ספר, משפחות וכל אחד שרוצה לבצע את המשימות שלו בצורה קלה ונוחה** האפליקציה נמצאת בגרסת אלפא. לא מיועדת עדיין לשימוש. בנוסף, בשלב הרצת האפליקציה כלל האפשרויות המוצעות באפליקציה הינם חינם לשימוש לאנשים פרטייים וכן לאירגונים, משתהפוך האפליקציה לרישמית ייתכן ואפשרויות מסוימות באפליקציה יעלו כסף.')
                    .ariaLabel('TermsOfServiceAlert')
                    .ok('סגור')
                    .targetEvent(ev)
                );
            }
            
            var showVerificationCodePrompt = function () {
                // Appending dialog to document.body to cover sidenav in docs app
                var confirm = $mdDialog.prompt()
                  .title('קוד אימות')
                  .htmlContent('<div>אנא הכנס את קוד האימות שנלשח למכשירך</div>' +
                               '<br/>'
                               /*'<a class="href-class" ng-click="vm.sendAgain()">' +
                                    'שלח שוב'+
                               '</a>'*/)
                  .placeholder('קוד אימות')
                  .ariaLabel('verificationCode')
                  .ok('המשך');

                return $mdDialog.show(confirm);

            };

            var showVerificationFailedAlert = function () {
                $mdDialog.show(
                  $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#popupContainer')))
                    .clickOutsideToClose(true)
                    .title('שגיאה')
                    .textContent('תהליך הזיהוי נכשל, הקוד שהוכנס לא תואם למספר הטלפון שהוקש, אנא נסה שנית.')
                    .ariaLabel('Alert Dialog Demo')
                    .ok('המשך')
                );
            }

            document.getElementById('canvas_loadder').style.display = "none";
            document.getElementById('Cube_loadder').style.display = "none";
 
        }

})();
