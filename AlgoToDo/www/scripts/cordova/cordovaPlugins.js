(function () {
    'use strict';

    angular
        .module('app.cordova')
        .service('cordovaPlugins', cordovaPlugins);

    cordovaPlugins.$inject = ['$rootScope', 'datacontext', 'appConfig', '$mdDialog',
                              '$cordovaLocalNotification'/*, '$cordovaSms'*/, '$window',
                              /*'$cordovaDialogs',*/ '$cordovaToast', '$cordovaPushV5',
                              '$cordovaBadge', '$cordovaDevice', '$log', '$mdToast',
                              '$cordovaVibration', '$cordovaNetwork', '$q', '$cordovaCamera',
                              '$cordovaAppVersion', 'dropbox', 'storage', '$cordovaDatePicker'];

    function cordovaPlugins($rootScope, datacontext, appConfig, $mdDialog,
                            $cordovaLocalNotification, /*$cordovaSms,*/ $window,
                            /*$cordovaDialogs,*/ $cordovaToast, $cordovaPushV5,
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

        /* ----- Local Notifications ------*/

        var setLocalNotification = function (task, date) {
            if (!isMobileDevice()) return;

            /*var now = new Date().getTime();
            var _10SecondsFromNow = new Date(now + 1 * 1000);*/

            document.addEventListener("deviceready", function () {
                
                cordova.plugins.notification.local.schedule({
                    id: Math.floor((Math.random() * 10000) + 1),
                    title: "תזכורת לביצוע משימה",
                    at: date,
                    text: task.from.name + ': ' + task.description,
                    icon: 'res://icon',
                    smallIcon: 'res://ic_popup_reminder',
                    data: task,
                    headsup: true,
                    actions: [
                        {
                            text: "קבע נודניק",
                            icon: "res://ic_popup_reminder",
                            val: 1
                        },
                        /*{
                            text: "סמן כבוצע",
                            /*icon: "res://btn_check_on",*/
                           /* val: 2
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

        var setSnoozeNotification = function (task, notificationId) {
            document.addEventListener("deviceready", function () {

                var now = new Date().getTime();
                var _10MinutsFromNow = new Date(now + 100 * 1000 * 10);

                cordova.plugins.notification.local.update({
                    id: notificationId,
                    firstAt: _10MinutsFromNow,
                    every: "10",
                    actions: [
                        {
                            text: "הפסק נודניק",
                            icon: "res://ic_popup_reminder",
                            val: 4
                        },
                        /*{
                            text: "סמן כבוצע",
                            /*icon: "res://btn_check_on",*/
                            /*val: 2
                        },*/
                        {
                            text: "עבור למשימה",
                            icon: "res://ic_menu_set_as",
                            val: 3
                        }
                    ]
                });
            });
        }

        var stopSnoozeNotification = function (notificationId) {
            document.addEventListener("deviceready", function () {
                cordova.plugins.notification.local.cancel(notificationId);
            });
        }

        document.addEventListener("deviceready", function () {
            cordova.plugins.notification.local.on("click", function (notification) {
                var task = JSON.parse(notification.data);
                if (notification.actionClicked.val === 1) {
                    setSnoozeNotification(task, notification.id);
                    return;
                }
                /*if (notification.actionClicked.val === 2) {
                    
                }*/
                if (notification.actionClicked.val === 3) {
                    window.location = '#/task/' + task._id;
                }
                if (notification.actionClicked.val === 4) {
                    stopSnoozeNotification(notification.id);
                    return;
                }
                if (task !== undefined && task._id !== undefined) {
                    window.location = '#/task/' + task._id;
                }
            });
        }, false);

        /* ----- Push Notifications ----- */

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
            var taskId = dataFromServer.taskId;

            if (dataFromServer.type === "task") {
                handelNewTaskRecived(dataFromServer.object, data.count);
            }
            if (dataFromServer.type === "task-update") {
                datacontext.replaceTask(dataFromServer.object);
                $rootScope.$apply();
            }
            if (dataFromServer.type === "comment") {
                handelNewCommentRecived(taskId, dataFromServer.object);              
            }
        };

        var handelNewTaskRecived = function (task, taskCount) {
            if (task.comments.length > 0) {
                var comment = task.comments[0];
                dropbox.downloadFile(comment.fileName).then(function (response) {
                    storage.saveFileToStorage(task._id, comment.fileName, response.url).then(function (storageFilePath) {
                        comment.fileLocalPath = storageFilePath;

                        datacontext.addTaskToTaskList(task);
                        $rootScope.taskcount = taskCount;
                        $rootScope.$apply();

                        showNewTaskToast(task._id, task.from.name);
                    });
                })
                .catch(function (error) {
                    $log.error("error while trying to download file from dropbox", error);
                });
            }
            else {
                datacontext.addTaskToTaskList(task);
                $rootScope.taskcount = taskCount;
                $rootScope.$apply();

                showNewTaskToast(task._id, task.from.name);
            }    
        }

        var handelNewCommentRecived = function (taskId, comment) {
            if (comment.fileName !== undefined) {
                dropbox.downloadFile(comment.fileName).then(function (response) {
                    storage.saveFileToStorage(taskId, comment.fileName, response.url).then(function (storageFilePath) {
                        comment.fileLocalPath = storageFilePath;
                        datacontext.addCommentToTask(taskId, comment);
                        $log.info("before nevigate", comment);
                        navigateToTaskPage(taskId, comment);
                        $log.info("after nevigate", comment);
                    });
                })
                .catch(function (error) {
                    $log.error("error while trying to download file from dropbox", error);
                });
            }
            else {
                datacontext.addCommentToTask(taskId, comment);
                navigateToTaskPage(taskId, comment);
            }
        }

        var navigateToTaskPage = function (taskId, task) {
            $log.info("nevigate 1", self.appState);
            if (self.appState === 'background') {
                $log.info("nevigate 2", window.location.hash);
                window.location = '#/task/' + taskId;
            }
            else {
                $log.info("nevigate 3", window.location.hash);
                if (window.location.hash.indexOf(taskId) === -1) {
                    $log.info("nevigate 4", task.from.name);
                    showNewCommentToast(taskId, task.from.name);
                }
                $log.info("nevigate 5");
                document.addEventListener("deviceready", function () {
                    $cordovaVibration.vibrate(300);
                }, false);
            }
        }

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

            document.addEventListener("deviceready", function () {
                $cordovaVibration.vibrate(300);
            }, false);

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
        };

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
            getImagesPath: getImagesPath,
            takePicture: takePicture,
            cleanupAfterPictureTaken: cleanupAfterPictureTaken,
            getAppVersion: getAppVersion,
            showDatePicker: showDatePicker
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
