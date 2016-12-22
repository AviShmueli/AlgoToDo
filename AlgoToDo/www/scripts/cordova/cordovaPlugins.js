(function () {
    'use strict';

    angular
        .module('app.cordova')
        .service('cordovaPlugins', cordovaPlugins);

    cordovaPlugins.$inject = ['$rootScope', '$cordovaToast', '$cordovaBadge', '$log',
                              '$q', '$cordovaDatePicker'];

    function cordovaPlugins($rootScope, $cordovaToast, $cordovaBadge, $log,
                            $q, $cordovaDatePicker) {

        var self = this;
        self.appState = 'foreground';

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
            setBadge: setBadge,
            showDatePicker: showDatePicker,
        };

        return service;
    }
})();

