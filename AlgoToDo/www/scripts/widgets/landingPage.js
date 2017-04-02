﻿(function () {
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
                            contactsSync.syncPhoneContactsWithServer().then(function () {
                                datacontext.reloadAllTasks();
                                $location.path('/tasksList');
                            }, function () {
                                datacontext.reloadAllTasks();
                                $location.path('/tasksList');
                            });
                        }
                        else {
                            $timeout(function () {
                                datacontext.reloadAllTasks();
                            }, 100);
                            $location.path('/tasksList');
                        }
                    });
                }, false);
            }
            else {
                $timeout(function () {
                    datacontext.reloadAllTasks();
                }, 100);
                $location.path('/tasksList');
            }           

            logger.info("user is now connected", vm.user);
        };

        var setApplicationDirectory = function () {

            var deferred = $q.defer();
            
            if (device.isMobileDevice()) {
                document.addEventListener("deviceready", function () {

                    var deviceDetailes = datacontext.getDeviceDetailes();
                    var appDirectory = cordova.file.applicationDirectory;

                    if (angular.equals({}, deviceDetailes)) {
                        datacontext.setDeviceDetailes(deviceDetailes, appDirectory);
                    }

                    // set applicationDirectory               
                    if (deviceDetailes.applicationDirectory !== appDirectory) {
                        datacontext.setDeviceDetailes(deviceDetailes, appDirectory);
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

                vm.user = user;
                login();
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
            if (!device.isMobileDevice() && window.location.hostname.indexOf("algotodo.herokuapp.com") !== -1) {
                window.location = "http://app.asiti.net";
            }
        }, 0);

    }
})();