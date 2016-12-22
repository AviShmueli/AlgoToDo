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
    signUpCtrl.$inject = ['$scope', 'datacontext', 'logger', 'cordovaPlugins', '$q', 'pushNotifications'];

    function signUpCtrl($scope, datacontext, logger, cordovaPlugins, $q, pushNotifications) {
            var vm = this;

            vm.inProgress = false;
            vm.user = {};

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
                        if((cordovaPlugins.isMobileDevice() && cordovaPlugins.getDeviceDetails().platform === 'Android' &&
                         (user.GcmRegistrationId === '' || user.GcmRegistrationId === undefined)) ||
                         (cordovaPlugins.isMobileDevice() && cordovaPlugins.getDeviceDetails().platform === 'iOS' &&
                         (user.ApnRegistrationId === '' || user.ApnRegistrationId === undefined))) {
                            registerUserForPushService().then(function (registrationId) {
                                datacontext.saveUsersNewRegistrationId(registrationId, user);
                                datacontext.saveUserToLocalStorage(user);
                                window.location = '#/';
                            });
                        }
                        else {
                            datacontext.saveUserToLocalStorage(user);
                            window.location = '#/';
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
            

                if (cordovaPlugins.isMobileDevice()) {

                    document.addEventListener("deviceready", function () {

                        vm.user.device = cordovaPlugins.getDeviceDetails();
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
                                    datacontext.saveUserToLocalStorage(response.data);
                                    logger.success('user signUp successfuly', response.data);
                                    window.location = '#/';
                                }, function () { });
                            });
                        }, function (error) {
                            logger.error("error while trying to register user to app", error);
                        });
                    }, false);
                }
                else {
                    datacontext.registerUser(vm.user).then(function (response) {
                        datacontext.saveUserToLocalStorage(response.data);
                        logger.success('user signUp successfuly', response.data);
                        window.location = '#/';
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
 
 document.getElementById('canvas_loadder').style.display = "none";
 document.getElementById('Cube_loadder').style.display = "none";
 
        }

})();
