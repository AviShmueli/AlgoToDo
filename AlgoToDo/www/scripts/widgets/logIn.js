(function () {
    'use strict';
    
    angular
        .module('app.widgets')
        .controller('logInCtrl', logInCtrl);

    logInCtrl.$inject = ['$scope', 'datacontext', 'logger', 'cordovaPlugins', '$q', 'pushNotifications',
                          'device', '$mdDialog', 'DAL', '$location'];

    function logInCtrl($scope, datacontext, logger, cordovaPlugins, $q, pushNotifications,
                        device, $mdDialog, DAL, $location) {
            
        var vm = this;

            vm.imagesPath = device.getImagesPath();
            vm.inProgress = false;
            vm.user = {};

            var user = datacontext.getUserFromLocalStorage();
            if (user !== undefined) {
                DAL.reloadAllTasks();
                $location.path('/tasksList');
            }
            
            vm.goToSignUp = function () {
                $location.path('/signUp');
            }

            vm.signMeUp = function () {
                if (vm.inProgress === false) {
                    vm.inProgress = true;
                    signUp();
                }
            };

            var signUp = function () {
                DAL.checkIfUserExist(vm.user).then(function (response) {
                    if (response.data !== null && response.data !== '') {
                        
                        var user = response.data;
                        
                        // if this is mobile and the user not registerd to GCM or APN
                        if ((device.isMobileDevice() && device.getDeviceDetails().platform === 'Android' &&
                         (user.GcmRegistrationId === '' || user.GcmRegistrationId === undefined)) ||
                         (device.isMobileDevice() && device.getDeviceDetails().platform === 'iOS' &&
                         (user.ApnRegistrationId === '' || user.ApnRegistrationId === undefined))) {
                            registerUserForPushService().then(function (registrationId) {
                                DAL.saveUsersNewRegistrationId(registrationId, user);
                                // check here if reg-code recived by sms match reg-code in server
                                showVerificationCodePrompt().then(function (verificationCode) {

                                    DAL.checkIfVerificationCodeMatch(user, verificationCode).then(function (result) {
                                        if (result.data === 'ok') {
                                            datacontext.saveUserToLocalStorage(response.data);
                                            DAL.reloadAllTasks();
                                            $location.path('/tasksList');
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
                                });
                            });
                        }
                        else {
                            // check here if reg-code recived by sms match reg-code in server
                            showVerificationCodePrompt().then(function (verificationCode) {

                                DAL.checkIfVerificationCodeMatch(user, verificationCode).then(function (result) {
                                    if (result.data === 'ok') {
                                        datacontext.saveUserToLocalStorage(response.data);
                                        DAL.reloadAllTasks();
                                        $location.path('/tasksList');
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
                            }); 
                        }
                    }
                    else {
                        showUserNotExistAlert();
                    }

                }, function (error) {
                    vm.inProgress = false;
                    logger.error("error while trying to check If User Exist", error);
                    showRegistrationFailedAlert();
                });

            };

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

            var showVerificationCodePrompt = function () {
                var confirm = $mdDialog.prompt()
                  .parent(angular.element(document.querySelector('#VerificationCodePromptContainer')))
                  .title('קוד אימות')
                  .htmlContent('<div>אנא הכנס את קוד האימות שנלשח למכשירך</div>' +
                               '<br/>')
                  .placeholder('קוד אימות')
                  .ariaLabel('verificationCode')
                  .ok('המשך');

                return $mdDialog.show(confirm);

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
 
        }

})();
