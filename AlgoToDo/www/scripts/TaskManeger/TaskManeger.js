(function() {
    'use strict';

    angular
        .module('TaskManeger')
        .controller('TaskManegerCtrl', TaskManegerCtrl);

    TaskManegerCtrl.$inject = [ 
        '$scope', 'logger', '$location', 'cordovaPlugins',
        'appConfig', '$mdMedia', '$mdBottomSheet','$filter',
        '$mdSidenav', '$mdDialog', 'datacontext', 'lodash',
        'socket', '$mdToast', 'moment'
    ];

    function TaskManegerCtrl($scope, logger, $location, cordovaPlugins,
                            appConfig, $mdMedia, $mdBottomSheet,$filter,
                            $mdSidenav, $mdDialog, datacontext, lodash,
                            socket, $mdToast, moment) {

        var vm = this;
        
        vm.selectedIndex = 1;
        vm.isSmallScrean = $mdMedia('sm');
        vm.userConnected = false;
        vm.user = {};
        vm.appDomain = appConfig.appDomain;
        vm.progressActivated = false;
        vm.myTasksCount = 0;

        vm.onGoingActivityies = function () { return datacontext.getTaskList(); };      

        var setMyTaskCount = function () {
            var count = $filter('filter')(datacontext.getTaskList(), { to: vm.user.name, status: 'inProgress' }).length;
            cordovaPlugins.setBadge(count);
            vm.myTasksCount = count;
        };

        var activateProgress = function (toastText) {
            vm.progressActivated = true;
            return logger.info(toastText, null, 10000);
        };

        var deactivateProgress = function (toast) {
            $mdToast.hide(toast);
        };


        var loadTasks = function () {
            var loadingToast = activateProgress("טוען נתונים...");
            datacontext.getAllTasksSync().then(function (response) {
                logger.success("getAllTasks", response.data);
                datacontext.setTaskList(response.data);
                setMyTaskCount();
                vm.progressActivated = false;
                deactivateProgress(loadingToast);
            });
        };

        vm.checkIfUserLogdIn = function () {
            var user = datacontext.getUserFromLocalStorage();
            if (user !== undefined) {
                vm.user = user;
                vm.login();
            }
        };

        vm.signUp = function () {
            vm.user.avatarUrl = '/images/man-' + Math.floor((Math.random() * 8) + 1) + '.svg';            

            if (cordovaPlugins.isMobileDevice()) {
                document.addEventListener("deviceready", function () {
                    cordovaPlugins.initializePushV5().then(function () {
                        cordovaPlugins.registerForPushNotifications().then(function (registrationId) {
                            vm.user.GcmRegistrationId = registrationId;
                            datacontext.registerUser(vm.user).then(function (response) {
                                datacontext.saveUserToLocalStorage(response.data);
                                logger.success('המשתמש נרשם בהצלחה', response.data);
                                vm.login();
                            }, function () { });                       
                         });                    
                    }, function (error) {
                        logger.error("אירעה שגיאה ברישום המשתמש",error);
                       });
                }, false);
            }
            else {
                datacontext.registerUser(vm.user).then(function (response) {
                    datacontext.saveUserToLocalStorage(response.data);
                    logger.success('המשתמש נרשם בהצלחה', response.data);
                    vm.login();
                }, function (error) {
                    logger.error("אירעה שגיאה ברישום המשתמש", error);
                });
            }
            
        };

        vm.login = function () {

            // login 
            socket.emit('join', {
                userName: vm.user.name
            });

            //force get all the users from the server
            //socket.emit('get-users');

            // ask server to send the user tasks
            /*socket.emit('get-tasks', {
                userName: vm.user.name
            });*/
            loadTasks();
            vm.userConnected = true;           
            
            logger.info("אתה עכשיו מחובר!", null, 1000);
        };

        vm.logOff = function () {
            datacontext.deleteUserFromLocalStorage();
            vm.userConnected = false;
            vm.toggleSidenav('left');
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
        });*/

        // when the server response the users tasks
        socket.on('users-tasks', function(data) {
            datacontext.tasksList = data;
        });

        // when new task received from the server
        socket.on('new-task', function(data) {
            
            var newTask = data;
            
            //logger.info("Got new task", newTask);


            if (newTask.from !== vm.user.name) {
                datacontext.addTaskToTaskList(newTask);
                setMyTaskCount();
                //cordovaPlugins.setLocalNotification();
            }
        });

        // when the server response the users tasks
        socket.on('updated-task', function (data) {
            logger.success('משימה עודכנה', data.value);
            datacontext.replaceTask(data.value);
            setMyTaskCount();
        });

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
            }).then(function (answer) {
                    if (answer === 'ok') {
                        vm.alert = 'You said the information was "' + answer + '".';
                    }
                }, function() {
                    vm.alert = 'You cancelled the dialog.';
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
                setMyTaskCount();
            }, function () { });
        };

        vm.checkIfUserLogdIn();

        vm.reloadTasks = function () {
            loadTasks();
        };

        vm.getTotalTaskTime = function (task) {
            var end = new Date(task.doneTime);
            var start = new Date(task.createTime);
            var totalInMillisconds = end.getTime() - start.getTime();
            var totalTime = moment.duration(totalInMillisconds);
            return moment.duration(totalInMillisconds).humanize();
        };

        document.addEventListener("resume", function () {         
            vm.selectedIndex = 1;
        }, false);

        vm.searchKeypress = function (event) {
            if (event.keyCode === 13) {
                vm.showSearch = !vm.showSearch;
            }
        };

    }

})();