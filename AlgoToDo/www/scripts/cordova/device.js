(function () {
    'use strict';

    angular
        .module('app.cordova')
        .service('device', device);

    device.$inject = ['$rootScope', 'datacontext', '$cordovaDevice', '$log', '$q',
                              '$cordovaNetwork', '$cordovaAppVersion'/*, '$cordovaContacts'*/];

    function device($rootScope, datacontext, $cordovaDevice, $log, $q,
                            $cordovaNetwork, $cordovaAppVersion/*, $cordovaContacts*/) {

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

        var getContacts = function (searchTerm) {
            /*var deferred = $q.defer();

            var opts = {
                filter: searchTerm,
                multiple: true,
                fields: ['displayName', 'photos']
            };

            document.addEventListener("deviceready", function () {
                $cordovaContacts.find(opts).then(function (allContacts) { 
                    deferred.resolve(allContacts);
                });
            }, false);

            return deferred.promise;*/
        }

        var service = {
            getDeviceDetails: getDeviceDetails,
            isMobileDevice: isMobileDevice,
            networkStatus: networkStatus,
            getImagesPath: getImagesPath,
            getAppVersion: getAppVersion,
            setStatusbarOverlays: setStatusbarOverlays,
            getContacts: getContacts
        };

        return service;
    }
})();

