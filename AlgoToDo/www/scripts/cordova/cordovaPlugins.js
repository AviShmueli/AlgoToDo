(function () {
    'use strict';

    angular
        .module('app.cordova')
        .service('cordovaPlugins', cordovaPlugins);

    cordovaPlugins.$inject = ['$rootScope', '$cordovaToast', '$cordovaBadge', '$log',
                              '$q', '$cordovaDatePicker', '$cordovaSocialSharing',
                              '$cordovaAppRate'];

    function cordovaPlugins($rootScope, $cordovaToast, $cordovaBadge, $log,
                            $q, $cordovaDatePicker, $cordovaSocialSharing,
                            $cordovaAppRate) {

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
            $rootScope.$apply();
        };

        function minimizeApp() {
            window.plugins.appMinimize.minimize();
        };

        /* ----- Social Sharing -----*/
        
        var shareApp = function () {
            var message = 'קישור להורדת האפליקציה Asiti, אפליקצית מסרים מידית מוכוונת משימות אישיות וחברתיות.',
                subject = '',
                file = [],
                link = 'http://www.asiti.net/link-to-app-store';
                                                                                    
            document.addEventListener("deviceready", function () {
                $cordovaSocialSharing
                   .share(message, subject, file, link) // Share via native share sheet
                   .then(function (result) {
                       showToast('תודה ששיתפת את האפילקציה 😄', 2000);
                   }, function (err) {
                       // An error occured. Show a message to the user
                   });
            }, false);
        }

        var rateApp = function () {
            document.addEventListener("deviceready", function () {
                $cordovaAppRate.promptForRating(true).then(function (result) {
                });
            }, false);
        }

        var navigateToAppStore = function () {
            document.addEventListener("deviceready", function () {
                $cordovaAppRate.navigateToAppStore();
            }, false);
        }

        var service = {
            showToast: showToast,
            clearAppBadge: clearAppBadge,
            setBadge: setBadge,
            showDatePicker: showDatePicker,
            shareApp: shareApp,
            rateApp: rateApp,
            minimizeApp: minimizeApp,
            navigateToAppStore: navigateToAppStore
        };

        return service;
    }
})();

