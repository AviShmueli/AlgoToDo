(function () {
    'use strict';

    angular
        .module('app.cordova')
        .service('cordovaPlugins', cordovaPlugins);

    cordovaPlugins.$inject = ['$rootScope', 'datacontext', 'appConfig', '$mdDialog'/*,
                              '$cordovaLocalNotification'*//*, '$cordovaSms'*/, '$window',
                              /*'$cordovaDialogs',*/ '$cordovaToast', '$cordovaPushV5',
                              '$cordovaBadge', '$cordovaDevice', '$log', '$mdToast',
                              '$cordovaVibration', '$cordovaNetwork', '$q'];

    function cordovaPlugins($rootScope, datacontext, appConfig, $mdDialog,
                            /*$cordovaLocalNotification, *//*$cordovaSms,*/ $window,
                            /*$cordovaDialogs,*/ $cordovaToast, $cordovaPushV5,
                            $cordovaBadge, $cordovaDevice, $log, $mdToast,
                            $cordovaVibration, $cordovaNetwork, $q) {

        var self = this;
        self.appState = 'foreground';

        var PushOptions = {
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

        var isMobileDevice = function () {
            return document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
        };

        var setLocalNotification = function () {
            /*if (!isMobileDevice()) return;
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
            */

        };

        var showToast = function (info, duration) {
            document.addEventListener("deviceready", function () {
                $cordovaToast.show(info, duration ? duration : 'short', 'center')
                .then(function (success) { });
            }, false);

        };

        var initializePushV5 = function () {            
            return $cordovaPushV5.initialize(PushOptions);
        };

        var registerForPushNotifications = function () {

            // start listening for new notifications
            $cordovaPushV5.onNotification();

            // start listening for errors
            $cordovaPushV5.onError();

            // register to get registrationId
            return $cordovaPushV5.register();
        }

        var startListening = function () {
            initializePushV5().then(function () {
                // start listening for new notifications
                $cordovaPushV5.onNotification();

                // start listening for errors
                $cordovaPushV5.onError();
            });            
        }

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

        var getDeviceDetails = function () {
           return $cordovaDevice.getDevice();
        };

        var cancelEventListner_notificationReceived = null;
        var cancelEventListner_errorOcurred = null;
 
        var onNotificationReceived = function () {

            document.addEventListener("deviceready", function () {
                // triggered every time notification received
                if(cancelEventListner_notificationReceived !== null){
                   cancelEventListner_notificationReceived();
                }
                cancelEventListner_notificationReceived = $rootScope.$on('$cordovaPushV5:notificationReceived', handleNotificationRecive);

                // triggered every time error occurs
                if(cancelEventListner_errorOcurred !== null){
                   cancelEventListner_errorOcurred();
                }
                cancelEventListner_errorOcurred = $rootScope.$on('$cordovaPushV5:errorOcurred', handleErrorOcurred);

            }, false);
        }

        onNotificationReceived();

        var handleNotificationRecive = function (event, data) {
            $log.info('notificationReceived: ' + event, data);
            var dataFromServer = data.additionalData.additionalData;
            if (dataFromServer.type === "task") {
                datacontext.addTaskToTaskList(dataFromServer.object);
                $rootScope.taskcount = data.count;
                $rootScope.$apply();

                document.addEventListener("deviceready", function () {
                    $cordovaVibration.vibrate(300);
                }, false);
                showNewTaskToast(dataFromServer.taskId, dataFromServer.object.from.name);
            }
            if (dataFromServer.type === "task-update") {
                datacontext.replaceTask(dataFromServer.object);
                $rootScope.$apply();
            }
            if (dataFromServer.type === "comment") {
                datacontext.addCommentToTask(dataFromServer.taskId, dataFromServer.object);
                if (self.appState === 'background') {
                    window.location = '#/task/' + dataFromServer.taskId;
                }
                else {
                    if (window.location.hash.indexOf(dataFromServer.taskId) === -1) {
                        document.addEventListener("deviceready", function () {
                            $cordovaVibration.vibrate(300);
                        }, false);
                        showNewCommentToast(dataFromServer.taskId, dataFromServer.object.from.name);
                    }
                }
            }
        };

        var showNewCommentToast = function (taskId, name) {
            var NewCommentToast = $mdToast.build({
                hideDelay: 5000,
                position: 'top',
                template: '<md-toast class="md-capsule" id="message-toast" md-swipe-left="$root.hideToast(\'message-toast\')" md-swipe-right="$root.hideToast(\'message-toast\')">' +
                             '<div layout="row" class="md-toast-content message-toast" dir="rtl" ng-click="$root.redirectToTaskPage(\'' + taskId + '\')"> ' +
                                '<span flex="66" layout-padding>' +
                                    'תגובה חדשה מ' + name +
                                    '<br/>הקש/י כדי לראות את התגובה' +
                                '</span>' +
                                '<span layout="row" flex="33" layout-align="center center">' +
                                    '<ng-md-icon icon="new_releases" size="48" style="fill:rgb(3, 87, 95)"></ng-md-icon>' +
                                '</span>' +
                             '</div>' +
                          '</md-toast>'
            });
            $mdToast.show(NewCommentToast);
        };

        var showNewTaskToast = function (taskId, name) {
            var NewCommentToast = $mdToast.build({
                hideDelay: 5000,
                position: 'top',
                template: '<md-toast class="md-capsule" id="message-toast" md-swipe-left="$root.hideToast(\'message-toast\')" md-swipe-right="$root.hideToast(\'message-toast\')">' +
                             '<div layout="row" class="md-toast-content message-toast" dir="rtl" ng-click="$root.redirectToTaskPage(\'' + taskId + '\')"> ' +
                                '<span flex="66" layout-padding>' +
                                    'משימה חדשה מ' + name +
                                    '<br/>הקש/י כדי לראות את המשימה' +
                                '</span>' +
                                '<span layout="row" flex="33" layout-align="center center">' +
                                    '<ng-md-icon icon="new_releases" size="48" style="fill:rgb(3, 87, 95)"></ng-md-icon>' +
                                '</span>' +
                             '</div>' +
                          '</md-toast>'
            });
            $mdToast.show(NewCommentToast);
        };

        var handleErrorOcurred = function (event, e) {
            $log.error('errorOcurred: ' + event, e);
            // e.message
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
        
        var getImagesPath = function () {

            if (!isMobileDevice()) {
                return '';
            }

            var device = datacontext.getDeviceDetailes();
            if (device.platform === 'Android') {
                return 'file:///android_asset/www';
            }
            if (device.platform === 'iOS') {
                return 'algotodo.app';
            }
        }

        var service = {
            setLocalNotification: setLocalNotification,
            showToast: showToast,
            registerForPushNotifications: registerForPushNotifications,
            sendSmS: sendSmS,
            clearAppBadge: clearAppBadge,
            getDeviceDetails: getDeviceDetails,
            setBadge: setBadge,
            isMobileDevice: isMobileDevice,
            initializePushV5: initializePushV5,
            onNotificationReceived: onNotificationReceived,
            startListening: startListening,
            networkStatus: networkStatus,
            getImagesPath: getImagesPath
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
