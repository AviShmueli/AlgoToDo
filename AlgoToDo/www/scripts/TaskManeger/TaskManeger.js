(function() {
    'use strict';

    angular
        .module('TaskManeger')
        .controller('TaskManegerCtrl', TaskManegerCtrl);

    TaskManegerCtrl.$inject = [ 
        '$scope', 'logger', '$location', 'cordovaPlugins',
        'appConfig', '$mdMedia', '$mdBottomSheet',
        '$mdSidenav', '$mdDialog', 'datacontext', 'lodash',
        'socket'
    ];

    function TaskManegerCtrl($scope, logger, $location, cordovaPlugins,
                            appConfig, $mdMedia, $mdBottomSheet,
                            $mdSidenav, $mdDialog, datacontext, lodash,
                            socket) {

        var vm = this;
        
        vm.onGoingActivityies = function () { return datacontext.getTaskList(); }
        vm.isSmallScrean = $mdMedia('sm');
        vm.userConnected = false;
        vm.userName = ''; //'אבי שמואלי';
        vm.userlogin = {};
        vm.userlogin.name = 'אבי';

        vm.login = function () {

            // login 
            socket.emit('join', {
                userName: vm.userlogin.name
            });

            //force get all the users from the server
            socket.emit('get-users');

            // ask server to send the user tasks
            /*socket.emit('get-tasks', {
                userName: vm.userlogin.name
            });*/
            datacontext.getAllTasks();
            vm.userlogin.avatarUrl = appConfig.appDomain + '/images/man-' + Math.floor((Math.random() * 8) + 1) + '.svg';
            datacontext.user = vm.userlogin;
            vm.userName = vm.userlogin.name;
            vm.userConnected = true;

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
            
            logger.info("Got new task", newTask);


            if (newTask.from !== vm.userlogin.name) {
                datacontext.addTaskToTaskList(newTask);
                cordovaPlugins.setLocalNotification();
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
            link: 'showListBottomSheet($event)',
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

        vm.showAdd = function(ev) {
            $mdDialog.show({
                controller: 'AddTaskDialogController',
                controllerAs: 'vm',
                templateUrl: 'scripts/widgets/AddTaskDialog.html',
                targetEvent: ev
            }).then(function(answer) {
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

    }

})();