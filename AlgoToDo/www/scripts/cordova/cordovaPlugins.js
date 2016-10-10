(function () {
    'use strict';

    angular
        .module('TaskManeger.cordova')
        .service('cordovaPlugins', cordovaPlugins);

    cordovaPlugins.$inject = ['logger', 'appConfig', '$cordovaLocalNotification', '$cordovaSms', '$window'];

    function cordovaPlugins(logger, appConfig, $cordovaLocalNotification, $cordovaSms, $window) {

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

        var service = {
            setLocalNotification: setLocalNotification
        };

        return service;
    }
})();