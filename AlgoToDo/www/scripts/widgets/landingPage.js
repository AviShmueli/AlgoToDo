(function () {
    'use strict';

    angular
        .module('app.widgets')
        .controller('landingPageCtrl', landingPageCtrl);

    landingPageCtrl.$inject = ['$scope', 'datacontext', 'logger', 'pushNotifications',
                          'device', 'DAL', '$location', '$timeout', '$q'];

    function landingPageCtrl($scope, datacontext, logger, pushNotifications,
                        device, DAL, $location, $timeout, $q) {
        var vm = this;

        vm.screenHeight = window.innerHeight;

        var login = function () {

            if (datacontext.getTaskList().length === 0 || !device.isMobileDevice()) {
                DAL.reloadAllTasks();
            }

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

            var deferred = $q.defer();
            
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
                    deferred.resolve();
                });
            }
            else {
                deferred.resolve();
            }

            return deferred.promise;
        };

        var checkIfUserSignIn = function () {
                     
            var user = datacontext.getUserFromLocalStorage();
            if (user !== undefined) {

                $timeout(function () {
                    setApplicationDirectory();
                }, 0);

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

                $timeout(function () {
                    setApplicationDirectory().then(function () {
                        $location.path('/logIn');
                    });
                }, 0);
            }
        };

        $timeout(function () {
            checkIfUserSignIn();
        }, 0);

    }
})();