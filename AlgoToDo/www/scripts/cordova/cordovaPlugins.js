(function () {
    'use strict';

    angular
        .module('app.cordova')
        .service('cordovaPlugins', cordovaPlugins);

    cordovaPlugins.$inject = ['$rootScope', 'datacontext', 'appConfig', '$mdDialog',
                              '$window','$cordovaToast',
                              '$cordovaBadge', '$cordovaDevice', '$log', '$mdToast',
                              '$cordovaVibration', '$cordovaNetwork', '$q', '$cordovaCamera',
                              '$cordovaAppVersion', 'dropbox', 'storage', '$cordovaDatePicker'];

    function cordovaPlugins($rootScope, datacontext, appConfig, $mdDialog,
                            $window, $cordovaToast,
                            $cordovaBadge, $cordovaDevice, $log, $mdToast,
                            $cordovaVibration, $cordovaNetwork, $q, $cordovaCamera,
                            $cordovaAppVersion, dropbox, storage, $cordovaDatePicker) {

        var self = this;
        self.appState = 'foreground';

        var isMobileDevice = function () {
            return document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
        };

        var getDeviceDetails = function () {
            return $cordovaDevice.getDevice();
        };

        var getAppVersion = function () {
            return $cordovaAppVersion.getVersionNumber();
        }

        var setStatusbarOverlays = function(){
            //$cordovaStatusbar.overlaysWebView(false);
        }

        var showToast = function (info, duration) {
            document.addEventListener("deviceready", function () {
                $cordovaToast.show(info, duration ? duration : 'short', 'center')
                .then(function (success) { });
            }, false);

        };

        var showDatePicker = function () {
            var deferred = $q.defer();
            var options = {
                date: new Date(),
                minDate: new Date(),
                mode: 'datetime',
                allowOldDates: false,
                allowFutureDates: true,
                doneButtonLabel: 'אישור',
                doneButtonColor: '#000000',
                cancelButtonLabel: 'ביטול',
                titleText: 'בחר תאריך ושעה',
                cancelButtonColor: '#000000',
                is24Hour: true
            };

            document.addEventListener("deviceready", function () {

                $cordovaDatePicker.show(options).then(function (date) {
                    deferred.resolve(date);
                }, function (error) {
                    //alert(error);
                });

            }, false);

            return deferred.promise;
        }

        /* ----- Badge ------ */

        var clearAppBadge = function () {
            document.addEventListener("deviceready", function () {
                $cordovaBadge.clear().then(function () {
                    // You have permission, badge cleared.
                }, function (err) {
                    // You do not have permission.
                });
            }, false);

        };

        var setBadge = function (num) {
            document.addEventListener("deviceready", function () {
                $cordovaBadge.set(num).then(function () {
                    //showToast(" You have permission, badge set.");
                }, function (err) {
                    //showToast(" You do not have permission");
                });
            }, false);
        }

        /* ---- App State ----- */

        document.addEventListener("deviceready", function () {
            document.addEventListener( 'pause', onPause.bind( this ), false );
            document.addEventListener('resume', onResume.bind(this), false);
        }, false);

        function onPause() {
            self.appState = 'background';
        };

        function onResume() {
            self.appState = 'foreground';
        };
        
        /* ----- Camera -----*/

        var getImagesPath = function () {

            if (!isMobileDevice()) {
                return '';
            }

            var device = datacontext.getDeviceDetailes();
            return device.applicationDirectory + 'www';
        }

        var takePicture = function (sourceType) {
            var _sourceType = sourceType === 'camera' ? Camera.PictureSourceType.CAMERA : Camera.PictureSourceType.PHOTOLIBRARY;
            var isSamsungDevice = datacontext.getDeviceDetailes() !== undefined && datacontext.getDeviceDetailes().manufacturer === "samsung";

            var options = {
                quality: 100,
                destinationType: Camera.DestinationType.FILE_URI,
                sourceType: _sourceType,
                allowEdit: isSamsungDevice,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: isSamsungDevice ? 1500 : window.innerWidth,
                targetHeight: isSamsungDevice ? 1500 : window.innerHeight,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: true,
                correctOrientation: true
            };

            return $cordovaCamera.getPicture(options);         
        }

        var cleanupAfterPictureTaken = function () {
            $cordovaCamera.cleanup();
        }

        /* ---- Not In Use ----- */

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

        var sendSmS = function (to) {
            //CONFIGURATION
            var options = {
                replaceLineBreaks: false, // true to replace \n by a new line, false by default
                android: {
                    //intent: 'INTENT'  // send SMS with the native android SMS messaging
                    intent: '' // send SMS without open any other app
                }
            };
            /*
            document.addEventListener("deviceready", function () {
                $cordovaSms
                  .send('+972542240608', 'אבי התותח', options)
                  .then(function () {
                      showToast("SMS was sent");
                  }, function (error) {
                      showToast("SMS wasent sent...");
                  });
            }, false);*/
        };

        var service = {
            showToast: showToast,
            sendSmS: sendSmS,
            clearAppBadge: clearAppBadge,
            getDeviceDetails: getDeviceDetails,
            setBadge: setBadge,
            isMobileDevice: isMobileDevice,
            networkStatus: networkStatus,
            getImagesPath: getImagesPath,
            takePicture: takePicture,
            cleanupAfterPictureTaken: cleanupAfterPictureTaken,
            getAppVersion: getAppVersion,
            showDatePicker: showDatePicker,
            setStatusbarOverlays: setStatusbarOverlays
        };

        return service;
    }
})();

