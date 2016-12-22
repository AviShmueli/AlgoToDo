﻿(function () {
    'use strict';

    angular
        .module('app.cordova')
        .service('device', device);

    device.$inject = ['$rootScope', 'datacontext', '$cordovaDevice', '$log',
                              '$cordovaNetwork', '$cordovaAppVersion'];

    function device($rootScope, datacontext, $cordovaDevice, $log,
                            $cordovaNetwork, $cordovaAppVersion ) {

        var self = this;
        self.appState = 'foreground';

        var isMobileDevice = function () {
            return document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
        };

        var getDeviceDetails = function () {
            return $cordovaDevice.getDevice();
        };

        var getAppVersion = function () {
            return $cordovaAppVersion.getVersionNumber();
        }

        var setStatusbarOverlays = function () {
            //$cordovaStatusbar.overlaysWebView(false);
        }

        var getImagesPath = function () {

            if (!isMobileDevice()) {
                return '';
            }

            var device = datacontext.getDeviceDetailes();
            return device.applicationDirectory + 'www';
        }

        var networkStatus = function () {
            document.addEventListener("deviceready", function () {

                //var type = $cordovaNetwork.getNetwork()

                //self.isOnline = $cordovaNetwork.isOnline()

                //self.isOffline = $cordovaNetwork.isOffline()


                /*// listen for Online event
                $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
                    var onlineState = networkState;
                })

                // listen for Offline event
                $rootScope.$on('$cordovaNetwork:offline', function (event, networkState) {
                    var offlineState = networkState;
                })*/

            }, false);
        }

        var service = {
            getDeviceDetails: getDeviceDetails,
            isMobileDevice: isMobileDevice,
            networkStatus: networkStatus,
            getImagesPath: getImagesPath,
            getAppVersion: getAppVersion,
            setStatusbarOverlays: setStatusbarOverlays
        };

        return service;
    }
})();

