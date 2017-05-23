(function () {
    'use strict';

    angular
        .module('app.cordova')
        .service('cordovaPlugins', cordovaPlugins);

    cordovaPlugins.$inject = ['$rootScope', '$cordovaToast', '$cordovaBadge', '$log',
                              '$q', '$cordovaDatePicker', '$cordovaSocialSharing',
                              '$cordovaAppRate', '$cordovaActionSheet'];

    function cordovaPlugins($rootScope, $cordovaToast, $cordovaBadge, $log,
                            $q, $cordovaDatePicker, $cordovaSocialSharing,
                            $cordovaAppRate, $cordovaActionSheet) {

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

            document.addEventListener("deviceready", function () {
                cordova.plugins.DateTimePicker.show({
                    mode: "datetime",
                    date: new Date(),
                    allowOldDates: false,
                    allowFutureDates: true,
                    minuteInterval: 15,
                    locale: "IL",
                    okText: "אישור",
                    cancelText: "ביטול"
                }, function(newDate) {
                    deferred.resolve(newDate);
                }, function (err) {
                    // Handle error.
                    console.error(err);
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
            
                                                                                    
            document.addEventListener("deviceready", function () {
                var platformName = cordova.platformId === 'android' ? 'Android' : 'iPhone';
                var message = 'היי,\n\n'+
                'הורדתי את Asiti למכשיר ה-' + platformName + ' שלי.\n' +
                'זו תוכנת מסרים מידיים לטלפונים חכמים שמוכוונת לניהול משימות אישיות וחברתיות.  \n\n'+
                'עם Asiti קל לנהל את המשימות שלך ולשתף משימות עם חברים, מכרים, ועמיתים בצורה מהירה ופשוטה, ולעקוב אחר סטטוס ביצוע המשימה.\n\n'+
                'האפליקציה Asiti זמינה למכשירי Android, iPhone  ובדפדפן במחשב שלך.\n\n'+
                'אפשר להוריד את Asiti מהאתר \n',
                subject = '',
                file = [],
                link = 'http://www.asiti.net/download-asiti';

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

        /* ----- Action Sheet ------*/

        var showActionSheet = function () {
            var options = {
                title: 'What do you want with this image?',
                buttonLabels: ['Share via Facebook', 'Share via Twitter'],
                addCancelButtonWithLabel: 'Cancel',
                androidEnableCancelButton: true,
                winphoneEnableCancelButton: true,
                addDestructiveButtonWithLabel: 'Delete it'
            };


            document.addEventListener("deviceready", function () {

                $cordovaActionSheet.show(options)
                  .then(function (btnIndex) {
                      var index = btnIndex;
                  });
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
            navigateToAppStore: navigateToAppStore,
            showActionSheet: showActionSheet
        };

        return service;
    }
})();

