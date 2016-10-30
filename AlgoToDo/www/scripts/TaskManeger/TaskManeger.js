(function() {
    'use strict';

    angular
        .module('TaskManeger')
        .controller('TaskManegerCtrl', TaskManegerCtrl);

    TaskManegerCtrl.$inject = [ 
        '$scope', 'logger', '$location', 'cordovaPlugins',
        'appConfig', '$mdMedia', '$mdBottomSheet','$filter',
        '$mdSidenav', '$mdDialog', 'datacontext', 'lodash',
        'socket', '$mdToast'
    ];

    function TaskManegerCtrl($scope, logger, $location, cordovaPlugins,
                            appConfig, $mdMedia, $mdBottomSheet,$filter,
                            $mdSidenav, $mdDialog, datacontext, lodash,
                            socket, $mdToast) {

        var vm = this;
        
        vm.selectedIndex = 1;
        vm.isSmallScrean = $mdMedia('sm');
        vm.userConnected = false;
        vm.user = {};
        vm.appDomain = appConfig.appDomain;
        vm.registrationId = appConfig.getRegistrationId();
        vm.progressActivated = false;

        vm.onGoingActivityies = function () { return datacontext.getTaskList(); };
        vm.myTasksCount = function () {
            return $filter('filter')(vm.onGoingActivityies(), { to: vm.user.name, status: 'inProgress' }).length;
        };

        vm.checkIfUserLogdIn = function () {
            var user = datacontext.getUserFromLocalStorage();
            if (user !== undefined) {
                vm.user = user;
                vm.login();
            }
        };

        vm.signIn = function () {
            vm.user.avatarUrl = '/images/man-' + Math.floor((Math.random() * 8) + 1) + '.svg';
            datacontext.saveUserToLocalStorage(vm.user);
            vm.login();
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
            datacontext.getAllTasks();            
            vm.userConnected = true;
            
            if (vm.registrationId === '') {
                document.addEventListener("deviceready", function () {
                    cordovaPlugins.registerForPushNotifications();
                }, false);
            }
            
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
                //cordovaPlugins.setLocalNotification();
            }
        });

        // when the server response the users tasks
        socket.on('updated-task', function (data) {
            logger.success('משימה עודכנה', data.value);
            datacontext.replaceTask(data.value);
        });

        vm.toggleSidenav = function(menuId) {
            $mdSidenav(menuId).toggle();
        };

        vm.menu = [{
            link: '',
            title: 'דוחות',
            icon: 'dashboard'
        }, {
            link: '',
            title: 'עובדים',
            icon: 'group'
        }, {
            link: '',
            title: 'הודעות',
            icon: 'message'
        }];

        vm.admin = [{
            link: '',
            title: 'רוקן משימות',
            icon: 'delete'
        }, {
            link: 'vm.showListBottomSheet($event)',
            title: 'הגדרות',
            icon: 'settings'
        }];

        vm.alert = '';

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
                vm.registrationId = appConfig.getRegistrationId();
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

            datacontext.updateTask(task);
        };

        vm.checkIfUserLogdIn();

        vm.reloadTasks = function () {
            vm.progressActivated = true;
            var simpleToast = logger.info("טוען נתונים...", null, 10000);
            datacontext.getAllTasksSync().then(function (response) {
                logger.success("getAllTasks", response.data);
                datacontext.setTaskList(response.data);
                vm.progressActivated = false;
                $mdToast.hide(simpleToast);
            });
        };
    }

})();