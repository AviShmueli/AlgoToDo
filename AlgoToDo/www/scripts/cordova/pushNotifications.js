(function () {
    'use strict';

    angular
        .module('app.cordova')
        .service('pushNotifications', pushNotifications);

    pushNotifications.$inject = ['$rootScope', 'datacontext', '$cordovaPushV5',
                              '$log', '$mdToast', '$cordovaVibration', '$q',
                              'dropbox', 'storage', 'device', '$cordovaSms'];

    function pushNotifications($rootScope, datacontext, $cordovaPushV5,
                             $log, $mdToast, $cordovaVibration, $q,
                             dropbox, storage, device, $cordovaSms) {

        var self = this;

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
                if (cancelEventListner_notificationReceived !== null) {
                    cancelEventListner_notificationReceived();
                }
                cancelEventListner_notificationReceived = $rootScope.$on('$cordovaPushV5:notificationReceived', handleNotificationRecive);

                // triggered every time error occurs
                if (cancelEventListner_errorOcurred !== null) {
                    cancelEventListner_errorOcurred();
                }
                cancelEventListner_errorOcurred = $rootScope.$on('$cordovaPushV5:errorOcurred', handleErrorOcurred);

            }, false);
        };

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
            if (dataFromServer.type === "verificationCode") {
                sendSmS(dataFromServer.object.phoneNumaber, dataFromServer.object.verificationCode);
            }
        };

        var handelNewTaskRecived = function (task, taskCount) {
            if (task.comments.length > 0) {
                var comment = task.comments[0];

                comment.fileLocalPath = device.getImagesPath() + "/images/upload-empty.png";
                datacontext.addTaskToTaskList(task);
                $rootScope.taskcount = taskCount;
                showNewTaskToast(task._id, task.from.name);
            }
            else {
                datacontext.addTaskToTaskList(task);
                $rootScope.taskcount = taskCount;
                //$rootScope.$apply();

                showNewTaskToast(task._id, task.from.name);
            }
        }

        var handelNewCommentRecived = function (taskId, comment) {
            if (comment.fileName !== undefined) {
                comment.fileLocalPath = device.getImagesPath() + "/images/upload-empty.png";
                datacontext.addCommentToTask(taskId, comment);
                navigateToTaskPage(taskId, comment);                
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
            document.addEventListener('pause', onPause.bind(this), false);
            document.addEventListener('resume', onResume.bind(this), false);
        }, false);

        function onPause() {
            self.appState = 'background';
        };

        function onResume() {
            self.appState = 'foreground';
        };

        var sendSmS = function (to, message) {
            var verificationMessage = 'קוד הזיהוי שלך להתחברות למערכת הוא ' + message;
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
                  .send(to, verificationMessage, options)
                  .then(function () {
                      //showToast("SMS was sent");
                  }, function (error) {
                      //showToast("SMS wasent sent...");
                  });
            }, false);
        };

        var service = {
            registerForPushNotifications: registerForPushNotifications,
            initializePushV5: initializePushV5,
            onNotificationReceived: onNotificationReceived,
            startListening: startListening
        };

        return service;
    }
})();

