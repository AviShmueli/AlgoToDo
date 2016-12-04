(function() {
    'use strict';

    angular
        .module('app.tasks')
        .controller('TasksListCtrl', TasksListCtrl);

    TasksListCtrl.$inject = [ 
        '$rootScope', '$scope', 'logger', '$location', 'cordovaPlugins',
        '$mdMedia', '$mdBottomSheet','$filter',
        '$mdSidenav', '$mdDialog', 'datacontext', 'lodash',
        'socket', '$mdToast', 'moment', '$q', 'CMRESLogger'
    ];

    function TasksListCtrl($rootScope, $scope, logger, $location, cordovaPlugins,
                            $mdMedia, $mdBottomSheet,$filter,
                            $mdSidenav, $mdDialog, datacontext, lodash,
                            socket, $mdToast, moment, $q, CMRESLogger) {

        var vm = this;

        if ($rootScope.selectedIndex === undefined) {
            $rootScope.selectedIndex = 1;
        }    
        vm.isSmallScrean = $mdMedia('sm');
        vm.userConnected = false;
        vm.user = {};
        vm.imagesPath = cordovaPlugins.getImagesPath();
        vm.progressActivated = false;
        $rootScope.taskcount = 0;
        vm.signUpInProggress = true;

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

        var checkIfUserSignIn = function () {
            var user = datacontext.getUserFromLocalStorage();
            if (user !== undefined) {
                vm.user = user;
                vm.login();
            }
            else {
                window.location = '#/signUp';
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
            if (cordovaPlugins.isMobileDevice()) {
                document.addEventListener("deviceready", function () {
                    cordovaPlugins.startListening();
                    cordovaPlugins.onNotificationReceived();
                    if (angular.equals({}, datacontext.getDeviceDetailes())) {
                        datacontext.setDeviceDetailes(cordovaPlugins.getDeviceDetails());
                    }
                }, false);
            }

            logger.info("user is now connected", vm.user);
            //logger.toast("אתה עכשיו מחובר!", null, 1000);           
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

        vm.showAdd = function (ev) {           
            $mdDialog.show({
                controller: 'AddTaskDialogController',
                controllerAs: 'vm',
                templateUrl: 'scripts/widgets/AddTaskDialog.html',
                targetEvent: ev,
                fullscreen: true
            });      
        };

        vm.setTaskStatus = function (task, newStatus) {
            task.status = newStatus;
            if (task.status === 'done') {
                task.doneTime = new Date();
            }
            if (task.status === 'seen') {
                task.seenTime = new Date();
            }

            datacontext.updateTask(task).then(function (response) {
                logger.success('המשימה עודכנה בהצלחה!', response.data);
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

        checkIfUserSignIn();        
    }

})();