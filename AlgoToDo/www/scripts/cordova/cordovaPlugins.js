(function () {
    'use strict';

    angular
        .module('TaskManeger.cordova')
        .service('cordovaPlugins', cordovaPlugins);

    cordovaPlugins.$inject = ['logger', 'appConfig', '$cordovaLocalNotification', '$cordovaSms', '$window', '$cordovaDialogs'];

    function cordovaPlugins(logger, appConfig, $cordovaLocalNotification, $cordovaSms, $window, $cordovaDialogs) {

        var self = this;

        var isMobileDevice = function () {
            return $window.cordova !== undefined;
        }

        var setLocalNotification = function () {
            if (!isMobileDevice()) return;
            var alarmTime = new Date();
            alarmTime.setMinutes(alarmTime.getSeconds() + 1);

            $cordovaLocalNotification.add({
                id: "1234",
                date: alarmTime,
                message: "יש לך משימה אחת חדשה",
                title: "משימה חדשה",
                autoCancel: true,
                sound: 'res://platform_default',
                icon: 'res://icon'
            }).then(function () {
                logger.info("The notification has been set");
            });
        }

        var beep = function () {
            // beep 3 times
            $cordovaDialogs.beep(3);
        }


        /*
        $cordovaSms
          .send('+972542240608', 'אבי התותח', options)
          .then(function () {
              // Success! SMS was sent
          }, function (error) {
              // An error occurred
          });
          */

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

        var service = {
            setLocalNotification: setLocalNotification,
            beep: beep
        };

        return service;
    }
})();