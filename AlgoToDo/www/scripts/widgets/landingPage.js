(function () {
    'use strict';

    angular
        .module('app.widgets')
        .controller('landingPageCtrl', landingPageCtrl);

    landingPageCtrl.$inject = ['$scope', 'datacontext', 'logger', 'pushNotifications',
                          'device', 'DAL', '$location', '$timeout'];

    function landingPageCtrl($scope, datacontext, logger, pushNotifications,
                        device, DAL, $location, $timeout) {
        var vm = this;

        vm.screenHeight = window.innerHeight;

        var login = function () {

            /*if (datacontext.getTaskList().length === 0) {
                DAL.reloadAllTasks();
            }*/

            // register for push notifications
            if (device.isMobileDevice()) {
                document.addEventListener("deviceready", function () {
                    pushNotifications.startListening();
                    pushNotifications.onNotificationReceived();

                    device.getAppVersion().then(function (version) {
                        if (version !== vm.user.versionInstalled) {
                            DAL.updateUserDetails(vm.user._id, 'versionInstalled', version);
                            vm.user.versionInstalled = version;
                            datacontext.saveUserToLocalStorage(vm.user);
                        }
                    });
                }, false);
            }

            $location.path('/tasksList');

            logger.info("user is now connected", vm.user);
        };

        var setApplicationDirectory = function () {
            if (device.isMobileDevice()) {
                document.addEventListener("deviceready", function () {

                    if (angular.equals({}, datacontext.getDeviceDetailes())) {
                        datacontext.setDeviceDetailes(device.getDeviceDetails(), cordova.file.applicationDirectory);
                    }

                    // set applicationDirectory
                    var a = datacontext.getDeviceDetailes().applicationDirectory;
                    var b = cordova.file.applicationDirectory;
                    if (a !== b) {
                        datacontext.setDeviceDetailes(device.getDeviceDetails(), cordova.file.applicationDirectory);
                    }
                });
            }
        };

        var checkIfUserSignIn = function () {
            $timeout(function () {
                setApplicationDirectory();
            }, 0);
            
            var user = datacontext.getUserFromLocalStorage();
            if (user !== undefined) {

                // todo: remove this if in the next releas
                /*if (user.cliqot === undefined) {
                    DAL.checkIfUserExist(user).then(function (response) {
                        var newUser = response.data;

                        datacontext.saveUserToLocalStorage(newUser);
                        vm.user = newUser;
                        vm.login();
                    }, function (error) {
                        logger.error("error while trying to check If User Exist", error);
                    });
                }*/
                //else {
                vm.user = user;
                login();
                //}
            }
            else {
                $location.path('/signUp');
            }
        };

        $timeout(function () {
            checkIfUserSignIn();
        }, 0);

    }
})();