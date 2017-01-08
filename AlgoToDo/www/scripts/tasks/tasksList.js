(function() {
    'use strict';

    angular
        .module('app.tasks')
        .controller('TasksListCtrl', TasksListCtrl);

    TasksListCtrl.$inject = [ 
        '$rootScope', '$scope', 'logger', '$location', 'cordovaPlugins',
        '$mdMedia', '$mdBottomSheet','$filter', '$timeout',
        '$mdSidenav', '$mdDialog', 'datacontext', 'lodash',
        'socket', '$mdToast', 'moment', '$q', 'CMRESLogger',
        'pushNotifications', 'localNotifications', 'device'
    ];

    function TasksListCtrl($rootScope, $scope, logger, $location, cordovaPlugins,
                            $mdMedia, $mdBottomSheet,$filter, $timeout,
                            $mdSidenav, $mdDialog, datacontext, lodash,
                            socket, $mdToast, moment, $q, CMRESLogger,
                            pushNotifications, localNotifications, device) {

        var vm = this;

        if ($rootScope.selectedIndex === undefined) {
            $rootScope.selectedIndex = 1;
        }    
        vm.isSmallScrean = $mdMedia('sm');
        vm.userConnected = false;
        vm.user = {};
        vm.imagesPath = device.getImagesPath();
        vm.progressActivated = false;
        $rootScope.taskcount = 0;
        vm.signUpInProggress = true;
        vm.doneTasks = [];
        vm.descriptionTextLength = function () { return Math.floor((window.innerWidth - 70 - 16 - 40 - 16 - 8 ) / 4) };

        //CMRESLogger.info('hello world');

        vm.onGoingActivityies = function () { return datacontext.getTaskList(); };      

        var activateProgress = function (toastText) {
            vm.progressActivated = true;
            return logger.toast(toastText, null, 10000);
        };

        var deactivateProgress = function (toast) {
            $mdToast.hide(toast);
        };

        var loadTasks = function () {
            
            if (datacontext.getTaskList().length === 0) {
                var loadingToast = activateProgress("טוען נתונים...");
                datacontext.getAllTasks().then(function (response) {
                    datacontext.setTaskList(response.data);
                    var count = datacontext.setMyTaskCount();
                    cordovaPlugins.setBadge(count);
                    vm.progressActivated = false;
                    deactivateProgress(loadingToast);
                });
            }
            else {
                var count = datacontext.setMyTaskCount();
                cordovaPlugins.setBadge(count);
            }
        };       

        vm.login = function () {
            // a css fix
            angular.element(document.querySelectorAll('html')).removeClass("hight-auto");

            // login to socket.io
            /*socket.emit('join', {
                userId: vm.user._id
            });*/

            loadTasks();
            vm.userConnected = true;           
            
            // register for push notifications
            if (device.isMobileDevice()) {
                document.addEventListener("deviceready", function () {
                    pushNotifications.startListening();
                    pushNotifications.onNotificationReceived();
                    if (angular.equals({}, datacontext.getDeviceDetailes())) {
                        datacontext.setDeviceDetailes(device.getDeviceDetails(), cordova.file.applicationDirectory);
                    }

                    // set applicationDirectory
                    var a = datacontext.getDeviceDetailes().applicationDirectory;
                    var b = cordova.file.applicationDirectory;
                    if(a !== b){
                        datacontext.setDeviceDetailes(device.getDeviceDetails(), cordova.file.applicationDirectory);
                    }

                    device.getAppVersion().then(function (version) {
                        if (version !== vm.user.versionInstalled) {
                            datacontext.updateUserDetails(vm.user._id, 'versionInstalled', version);
                            vm.user.versionInstalled = version;
                            datacontext.saveUserToLocalStorage(vm.user);
                        } 
                    });
                }, false);
            }

            logger.info("user is now connected", vm.user);
            //logger.toast("אתה עכשיו מחובר!", null, 1000); 
            document.getElementById('canvas_loadder').style.display = "none";
            document.getElementById('Cube_loadder').style.display = "none";
        };

        vm.logOff = function () {
            angular.element(document.querySelectorAll('html')).addClass("hight-auto");
            datacontext.saveUsersNewRegistrationId('', vm.user);
            datacontext.deleteUserFromLocalStorage();
            datacontext.deleteTaskListFromLocalStorage();           
            vm.userConnected = false;
            vm.toggleSidenav('left');
            cordovaPlugins.clearAppBadge();
            window.location = '#/signUp';
        };

        // the response to the all-usersr from the server
        // get from the server the list of users that are connected
        /*socket.on('all-users', function(data) {

            var users = {};
            angular.forEach(data, function(value, key) {
                if (value.userName !== vm.userName) {
                    users[value.userName] = value;
                }
            });
            datacontext.users = users;
        });

        // when the server response the users tasks
        socket.on('users-tasks', function(data) {
            datacontext.tasksList = data;
        });*/

        // when new task received from the server
        /*socket.on('new-task', function(data) {           
            var newTask = data;
            if (newTask.from._id !== vm.user._id) {
                //datacontext.addTaskToTaskList(newTask);
                //setMyTaskCount();
            }
        });*/

        // when the server response the users tasks
        /*socket.on('updated-task', function (data) {
            //logger.success('משימה עודכנה', data.value);
            datacontext.replaceTask(data.value);
            var count = datacontext.setMyTaskCount();
            cordovaPlugins.setBadge(count);
        });*/

        vm.toggleSidenav = function(menuId) {
            $mdSidenav(menuId).toggle();
        };

        vm.showListBottomSheet = function($event) {
            vm.alert = '';
            $mdBottomSheet.show({
                templateUrl: 'scripts/widgets/ListBottomSheet.html',
                controller: 'ListBottomSheetCtrl',
                controllrAs: 'vm',
                targetEvent: $event
            }).then(function(clickedItem) {
                vm.alert = clickedItem.name + ' clicked!';
            });
        };

        vm.isDialogOpen = false;

        vm.showAdd = function (ev) {           
            vm.isDialogOpen = true;
            $mdDialog.show({
                controller: 'AddTaskDialogController',
                controllerAs: 'vm',
                templateUrl: 'scripts/widgets/AddTaskDialog.html',
                targetEvent: ev,
                fullscreen: true
            }).then(function () {
                vm.isDialogOpen = false;
            });

            document.addEventListener("deviceready", function () {
                document.addEventListener("backbutton", backbuttonClick_FromAddTask_Callback, false);
            }, false);
        };

        var backbuttonClick_FromAddTask_Callback = function (e) {
            e.preventDefault();
            $mdDialog.cancel();
            vm.isDialogOpen = false;
            document.removeEventListener("backbutton", backbuttonClick_FromAddTask_Callback, false);
        }

        vm.exitApp = false;

        var backbuttonClick_allways_Callback = function (e) {
            if (vm.isDialogOpen) {
                e.preventDefault();
                return;
                // do nothing - dialog will be closed
            }
            if (window.location.hash === '#/') {
                e.preventDefault();
                if (!vm.exitApp) {
                    vm.exitApp = true;
                    cordovaPlugins.showToast("הקש שוב ליציאה", 1000);
                    $timeout(function () { vm.exitApp = false }, 1000);
                } else {
                    navigator.app.exitApp();
                }
            }
            else {
                window.history.back();
            }
        }

        document.addEventListener("deviceready", function () {
            document.addEventListener("backbutton", backbuttonClick_allways_Callback, false);
        }, false);

        vm.setTaskStatus = function (task, newStatus) {
            task.status = newStatus;
            if (task.status === 'done') {
                task.doneTime = new Date();
                localNotifications.cancelNotification(task._id);
            }
            if (task.status === 'seen') {
                task.seenTime = new Date();
            }

            datacontext.updateTask(task).then(function (response) {
                var count = datacontext.setMyTaskCount();
                cordovaPlugins.setBadge(count);
            }, function (error) {
                logger.error('Error while tring to update task ', error);
            });
        };

        vm.reloadTasks = function () {
            var deferred = $q.defer();
            datacontext.getAllTasks().then(function (response) {
                datacontext.setTaskList(response.data);
                var count = datacontext.setMyTaskCount();
                cordovaPlugins.setBadge(count);
                deferred.resolve();
            });
            return deferred.promise;
        };

        vm.getTotalTaskTime = function (task) {
            var end = new Date(task.doneTime);
            var start = new Date(task.createTime);
            var totalInMillisconds = end.getTime() - start.getTime();
            var totalTime = moment.duration(totalInMillisconds);
            return moment.duration(totalInMillisconds).humanize();
        };

        vm.searchKeypress = function (event) {
            if (event.keyCode === 13) {
                vm.showSearch = !vm.showSearch;
            }
        };

        vm.navigateToTaskPage = function (taskId) {
            window.location = '#/task/' + taskId;
        }
 
        $rootScope.redirectToTaskPage = function (taskId, toast) {
            window.location = '#/task/' + taskId;
            var toastElement = angular.element(document.querySelectorAll('#message-toast'));
            $mdToast.hide(toastElement);
        }

        $rootScope.hideToast = function (toastId) {
            var toastElement = angular.element(document.querySelectorAll('#' + toastId));
            $mdToast.hide(toastElement);
        }
        
        var setDoneTasks = function () {
            vm.doneTasks = $filter('doneTasks')(datacontext.getTaskList(), vm.user._id);
        }();

        var checkIfUserSignIn = function () {
            var user = datacontext.getUserFromLocalStorage();
            if (user !== undefined) {

                // todo: remove this if in the next releas
                if (user.cliqot === undefined) {
                    datacontext.checkIfUserExist(user).then(function (response) {
                        var newUser = response.data;

                        datacontext.saveUserToLocalStorage(newUser);
                        vm.user = newUser;
                        vm.login();
                    }, function (error) {
                        logger.error("error while trying to check If User Exist", error);
                    });
                }
                else {
                    vm.user = user;
                    vm.login();
                }
            }
            else {
                window.location = '#/signUp';
            }
        }();

        vm.cancelAllNotifications = function (ev) {
            var confirm = $mdDialog.confirm()
                .title('למחוק את כל ההתראות הקיימות?')
                .textContent('פעולה זו תגרום למחיקת כל ההתראות הקיימות, ולא יהיה ניתן לשחזר אותן.')
                .ariaLabel('Lucky day')
                .targetEvent(ev)
                .ok('מחק')
                .cancel('בטל');

            $mdDialog.show(confirm).then(function () {
                cordovaPlugins.cancelAllNotifications();
            }, function () {
                
            });
            
        }

        vm.taskHasAttachment = function (task) {
            if(task.comments === undefined || task.comments.length === 0){
                return false;
            }
            for (var i = 0; i < task.comments.length; i++) {
                if (task.comments[i].fileName !== undefined && task.comments[i].fileName !== '') {
                    return true;
                }
            }
            return false;
        }
    }

})();
