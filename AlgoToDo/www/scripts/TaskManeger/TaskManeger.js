(function() {
    'use strict';

    angular
        .module('TaskManeger')
        .controller('TaskManegerCtrl', TaskManegerCtrl);

    TaskManegerCtrl.$inject = [ 
        '$scope', '$location', '$mdBottomSheet', '$mdSidenav', '$mdDialog', 'datacontext', 'lodash', 'socket', '$cordovaLocalNotification', '$cordovaSms'
    ];

    function TaskManegerCtrl($scope, $location, $mdBottomSheet, $mdSidenav, $mdDialog, datacontext, lodash, socket, $cordovaLocalNotification, $cordovaSms) {

        var vm = this;
        
        vm.userConnected = false;
        vm.userName = ''; //'אבי שמואלי';
        vm.userlogin = {};

        vm.login = function() {
            // login 
            socket.emit('join', {
                userName: vm.userlogin.name
            });

            //force get all the users from the server
            socket.emit('get-users');

            // ask server to send the user tasks
            socket.emit('get-tasks', {
                userName: vm.userlogin.name
            });
            
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
        socket.on('all-users', function(data) {
            console.log('all-tasks' + data);

            var users = {};
            angular.forEach(data, function(value, key) {
                if (value.userName !== vm.userName) {
                    users[value.userName] = value;
                }
            });
            vm.users = users;
        });

        // when the server response the users tasks
        socket.on('users-tasks', function(data) {
            console.log('users-tasks' + data);
            vm.onGoingActivityies = data;
        });

        // when new task received from the server
        socket.on('new-task', function(data) {
            vm.onGoingActivityies.push(data);

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
                console.log("The notification has been set");
            });
        });

        

        vm.toggleSidenav = function(menuId) {
            $mdSidenav(menuId).toggle();
        };

        vm.users = [];

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

         /*datacontext.getAllTasks().then(function(response) {
             vm.onGoingActivityies = response.data;
         }, function() {});*/

        vm.doneActivities = [{
            name: 'ניקיון מקרר',
            employee: 'רמי רוננכן',
            startDate: '3:08PM',
            description: " נא לסדר את כל הקופסאות שזרוקות על הריצפה במחסן"
        }, {
            name: 'החלפת מקרר במחלקת קפואים',
            employee: 'רוני אלישיבוף',
            startDate: '3:08PM',
            description: "יש 3 מנורות שרופות ואחת מהבהבת, נא להחליפם"
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
                })
                .then(function(answer) {
                    if (answer === 'ok') {
                        vm.alert = 'You said the information was "' + answer + '".';
                        vm.addNewTask(datacontext.newTask);
                    }
                }, function() {
                    vm.alert = 'You cancelled the dialog.';
                });
        };

        vm.addNewTask = function(task) {
            vm.onGoingActivityies.push(task);
            
            // add the employee id to the task
            var id = lodash.get(vm.users[task.employee], 'socketid');

            
            // send the new task to the server
            socket.emit('create-task', {
                task: task,
                to: id
            });
            

            // using regular http to insert task
            //datacontext.saveNewTask(task);

            // clean the form
            datacontext.newTask = {};

            //add to log (toaster)
        };
    }

})();