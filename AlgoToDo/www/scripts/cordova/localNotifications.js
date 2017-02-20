(function () {
    'use strict';

    angular
        .module('app.cordova')
        .service('localNotifications', localNotifications);

    localNotifications.$inject = ['$rootScope', 'datacontext', '$cordovaLocalNotification',
                                  '$log', '$q', 'cordovaPlugins', 'device', '$location'];

    function localNotifications($rootScope, datacontext, $cordovaLocalNotification,
                                $log, $q, cordovaPlugins, device, $location) {

        var self = this;

        var setLocalNotification = function (task, date) {
            if (!device.isMobileDevice()) return;

            var notificationId = new Date(task.createTime).getTime();

            document.addEventListener("deviceready", function () {

                $cordovaLocalNotification.schedule({
                    id: notificationId,
                    title: "תזכורת לביצוע משימה",
                    at: date,
                    text: task.from.name + ': ' + task.description,
                    icon: 'res://icon',
                    smallIcon: 'res://ic_popup_reminder',
                    data: task,
                    headsup: true,
                    actions: [
                        /*{
                            text: "קבע נודניק",
                            icon: "res://ic_popup_reminder",
                            val: 1
                        },*/                        
                        {
                            text: "עבור למשימה",
                            icon: "res://ic_menu_set_as",
                            val: 3
                        }
                    ]
                });
            });
        };

        /*
        var setSnoozeNotification = function (task, notificationId) {
            document.addEventListener("deviceready", function () {

                var now = new Date().getTime();
                var _10MinutsFromNow = new Date(now + 100 * 1000 * 10);

                $cordovaLocalNotification.cancel(notificationId).
                    then(function (s) {
                        $cordovaLocalNotification.schedule({
                            id: notificationId,
                            title: "תזכורת לביצוע משימה",
                            text: task.from.name + ': ' + task.description,
                            icon: 'res://icon',
                            smallIcon: 'res://ic_popup_reminder',
                            data: task,
                            headsup: true,
                            at: _10MinutsFromNow,
                            every: 10,
                            actions: [
                                {
                                    text: "הפסק נודניק",
                                    icon: "res://ic_popup_reminder",
                                    val: 4
                                },
                                
                                {
                                    text: "עבור למשימה",
                                    icon: "res://ic_menu_set_as",
                                    val: 3
                                }
                            ]
                        });
                    }).catch(function (e) {
                        var _e = e;
                    });
            });
        }
        */

        var cancelNotification = function (notificationId) {
            document.addEventListener("deviceready", function () {
                $cordovaLocalNotification.cancel(notificationId).
                    then(function (s) {
                        var a = s;

                    }).catch(function (e) {
                        var _e = e;
                    });
            });
        };

        document.addEventListener("deviceready", function (e) {
            cordova.plugins.notification.local.on('click', function (notification) {
                var task = JSON.parse(notification.data);
                /*if (notification.actionClicked !== undefined && notification.actionClicked.val !== undefined) {
                    if (notification.actionClicked.val === 1) {
                        setSnoozeNotification(task, notification.id);
                        showToast("נודניק נקבע בהצלחה!", 2000);
                        window.location = '#/task/' + task._id;
                        return;
                    }
                    if (notification.actionClicked.val === 3) {
                        window.location = '#/task/' + task._id;
                    }
                    if (notification.actionClicked.val === 4) {
                        cancelNotification(notification.id);
                        showToast("הנודניק בוטל!", 2000);
                        window.location = '#/task/' + task._id;
                        return;
                    }
                }*/
                if (task !== undefined && task._id !== undefined) {
                    //window.location = '#/task/' + task._id;
                    $location.path('/task/' + task._id);
                }
            });
        }, false);

        var cancelAllNotifications = function () {
            document.addEventListener("deviceready", function (e) {
                $cordovaLocalNotification.cancelAll().then(function (result) {
                    var a = result;
                });
            }, false);
        };

        var service = {
            setLocalNotification: setLocalNotification,
            cancelNotification: cancelNotification,            
            cancelAllNotifications: cancelAllNotifications
        };

        return service;
    }
})();

