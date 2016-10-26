(function () {
    'use strict';

    angular
        .module('TaskManeger.cordova')
        .service('cordovaPlugins', cordovaPlugins);

    cordovaPlugins.$inject = ['$rootScope', 'datacontext', 'appConfig', '$mdDialog', '$cordovaLocalNotification', '$cordovaSms', '$window', '$cordovaDialogs', '$cordovaToast', '$cordovaPushV5'];

    function cordovaPlugins($rootScope, datacontext, appConfig, $mdDialog, $cordovaLocalNotification, $cordovaSms, $window, $cordovaDialogs, $cordovaToast, $cordovaPushV5) {

        var self = this;

        var isMobileDevice = function () {
            return $window.cordova !== undefined;
        }

        var setLocalNotification = function () {
            if (!isMobileDevice()) return;
            var alarmTime = new Date();
            alarmTime.setMinutes(alarmTime.getSeconds() + 1);

            document.addEventListener("deviceready", function () {
                $cordovaLocalNotification.add({
                    id: "1234",
                    date: alarmTime,
                    message: "יש לך משימה אחת חדשה",
                    title: "משימה חדשה",
                    autoCancel: true,
                    sound: 'res://platform_default',
                    icon: 'res://icon'
                }).then(function () {
                    //logger.info("The notification has been set");
                });
            }, false);

            
        }

        var beep = function () {
            // beep 3 times
            document.addEventListener("deviceready", function () {
                $cordovaDialogs.beep(3);
            }, false);
        }

        var showToast = function (info) {
            document.addEventListener("deviceready", function () {
                $cordovaToast.show(info, 'long', 'center')
                .then(function (success) {});
            }, false);
            
        }

        var registerForPushNotifications = function () {
            var options = {
                android: {
                    senderID: "874351794059",
                    sound: "true",
                    vibration: "true"
                },
                ios: {
                    alert: "true",
                    badge: "true",
                    sound: "true"
                },
                windows: {}
            };
            
            $cordovaPushV5.initialize(options).then(function (result) {
                // start listening for new notifications
                $cordovaPushV5.onNotification();
                // start listening for errors
                $cordovaPushV5.onError();

                // register to get registrationId
                $cordovaPushV5.register().then(function (registrationId) {
                    appConfig.setRegistrationId(registrationId);
                    datacontext.sendRegistrationIdToServer(registrationId);
                }, function (error) {
                    showToast(error);
                    $cordovaDialogs.alert("שגיאה", registrationId, 'OK');
                })
            });
            
        }

        // triggered every time notification received
        $rootScope.$on('$cordovaPushV5:notificationReceived', function (event, data) {
            console.log("notificationReceived:", event, data);
            //$cordovaDialogs.alert("הודעת מערכת notificationReceived", data, 'OK');
            //showToast(data);
            if (event.event == registered) {
                showToast(data);
            }

            // data.message,
            // data.title,
            // data.count,
            // data.sound,
            // data.image,
            // data.additionalData
        });

        // triggered every time error occurs
        $rootScope.$on('$cordovaPushV5:errorOcurred', function (event, e) {
            console.log("errorOcurred:", event, e);
            $cordovaDialogs.alert("שגיאה", e, 'OK');
            showToast("error");
            // e.message
        });

        var sendSmS = function (to) {
            //CONFIGURATION
            var options = {
                replaceLineBreaks: false, // true to replace \n by a new line, false by default
                android: {
                    //intent: 'INTENT'  // send SMS with the native android SMS messaging
                    intent: '' // send SMS without open any other app
                }
            };

            document.addEventListener("deviceready", function () {
                $cordovaSms
                  .send('+972542240608', 'אבי התותח', options)
                  .then(function () {
                      showToast("SMS was sent");
                  }, function (error) {
                      showToast("SMS wasent sent...");
                  });
            }, false);
        }

        var service = {
            setLocalNotification: setLocalNotification,
            beep: beep,
            showToast: showToast,
            registerForPushNotifications: registerForPushNotifications,
            sendSmS: sendSmS
        };

        return service;
    }
})();



/*
// use to schedule notifications to the user about tasks that not been get atention yet
$cordovaLocalNotification.schedule({
    id: 1,
    title: 'Title here',
    text: 'Text here',
    data: {
        customProperty: 'custom value'
    }
}).then(function (result) {
    // ...
});*/
