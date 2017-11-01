(function () {
    'use strict';

    angular
        .module('app.cordova')
        .service('device', device);

    device.$inject = ['$rootScope', 'datacontext', '$cordovaDevice', '$log', '$q',
                              '$cordovaNetwork', '$cordovaAppVersion', '$cordovaVibration'/*,
                               '$cordovaStatusbar'*/, '$cordovaContacts', '$cordovaKeyboard',
                               '$timeout'];

    function device($rootScope, datacontext, $cordovaDevice, $log, $q,
                            $cordovaNetwork, $cordovaAppVersion, $cordovaVibration/*,
                            $cordovaStatusbar*/, $cordovaContacts, $cordovaKeyboard,
                            $timeout) {

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

        var setStatusBarStyleBlackTranslucent = function () {
            //$cordovaStatusbar.styleBlackTranslucent();
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
            var deferred = $q.defer();

            var opts = {
                filter: searchTerm,
                multiple: true,
                hasPhoneNumber : true,
                fields: ['displayName', 'name']
            };

            document.addEventListener("deviceready", function () {
                $cordovaContacts.find(opts).then(function (allContacts) { 
                    deferred.resolve(allContacts);
                });
            }, false);

            return deferred.promise;
        }

        var pickContactUsingNativeUI = function () {
            if (isMobileDevice()) {            
                return $cordovaContacts.pickContact();
            }
        }

        var recordAudio = function () {
            var deferred = $q.defer();

            document.addEventListener("deviceready", function () {

                window.plugins.audioRecorderAPI.record(function (savedFilePath) {
                    deferred.resolve(savedFilePath);                  
                }, function (msg) {
                    deferred.reject(msg);
                }, 10);

            }, false);
            
            return deferred.promise;
        }

        var vibrate = function (duration) {
            $cordovaVibration.vibrate(duration);
        }

        var getIOStempDirectory = function () {
            return cordova.file.tempDirectory;
        }

        var openKeyBoard = function(){
            if(isMobileDevice()){
                document.addEventListener("deviceready", function () {
                    $timeout(function () {
                        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                            cordova.plugins.Keyboard.show(); //open keyboard manually
                        }
                    }, 350);
                }, false);
            }
        }

        var service = {
            getDeviceDetails: getDeviceDetails,
            isMobileDevice: isMobileDevice,
            networkStatus: networkStatus,
            getImagesPath: getImagesPath,
            getAppVersion: getAppVersion,
            setStatusbarOverlays: setStatusbarOverlays,
            getContacts: getContacts,
            recordAudio: recordAudio,
            vibrate: vibrate,
            setStatusBarStyleBlackTranslucent: setStatusBarStyleBlackTranslucent,
            getIOStempDirectory: getIOStempDirectory,
            pickContactUsingNativeUI: pickContactUsingNativeUI,
            openKeyBoard: openKeyBoard
        };

        return service;
    }
})();

