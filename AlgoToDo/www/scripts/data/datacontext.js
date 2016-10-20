(function() {
    'use strict';

    angular
        .module('TaskManeger.data')
        .service('datacontext', datacontext);

    datacontext.$inject = ['$http', 'logger', 'socket', 'lodash', 'appConfig', '$localStorage'];

    function datacontext($http, logger, socket, lodash, appConfig, $localStorage) {

        var self = this;
        self.tasksList = [];
        self.newTask = {};
        self.$storage = $localStorage;
        //self.users = [];
        
        var saveNewTask = function(task) {

            var req = {
                method: 'POST',
                url: appConfig.appDomain + '/TaskManeger/newTask',
                data: {
                    task: task
                }
            };

            $http(req).then(function (response) {
                logger.success('המשימה נשלחה בהצלחה!', response.data);
                self.tasksList.push(response.data);

                // clean the form
                self.newTask = {};
            }, function () { });
        };

        var getAllTasks = function() {
            var req = {
                method: 'GET',
                url: appConfig.appDomain + '/TaskManeger/getTasks',
                data: {
                    user: self.$storage.user.name
                }
            };

            $http(req).then(function (response) {
                logger.success("getAllTasks", response.data);
                self.tasksList = response.data;
            });
        };
        
        var updateTask = function (task) {
            
            var req = {
                method: 'POST',
                url: appConfig.appDomain + '/TaskManeger/updateTaskStatus',
                data: {
                    task: task
                }
            };

            $http(req).then(function (response) {
                logger.success('המשימה עודכנה בהצלחה!', response.data);
            }, function () { });

            // send the new task to the server
            /*socket.emit('update-task', {
                task: task
            });*/
        };

        var getTaskList = function () {
            return self.tasksList;
        }
        
        var addTaskToTaskList = function (task) {
            self.tasksList.push(task);
        }

        var replaceTask = function (task) {
            var foundIndex = self.tasksList.findIndex(x => x._id === task._id);
            self.tasksList[foundIndex] = task;
        }

        var getNewTask = function () {
            return self.newTask;
        }

        var saveUserToLocalStorage = function (user) {           
            self.$storage.user = user;
        }

        var getUserFromLocalStorage = function () {
            return self.$storage !== undefined ? self.$storage.user: undefined;
        }

        var deleteUserFromLocalStorage = function () {
            delete self.$storage.user;
        }

        var resetNewTask = function () {
            // clean the form
            self.newTask = {};
        }

        var sendRegistrationIdToServer = function (registrationId) {
            var req = {
                method: 'POST',
                url: appConfig.appDomain + '/TaskManeger/sendRegistrationId',
                data: {
                    registrationId: registrationId,
                    user: self.$storage.user
                }
            };

            $http(req).then(function (response) {
                self.$storage.user.registrationId = registrationId;
                logger.success('מזהה רישום נשלח לשרת בהצלחה', response.data);
            }, function () { });
        }

        var service = {
            /*users: self.users,*/
            user: self.user,
            getTaskList: getTaskList,
            addTaskToTaskList: addTaskToTaskList,
            getNewTask: getNewTask,
            saveNewTask: saveNewTask,
            resetNewTask: resetNewTask,
            getAllTasks: getAllTasks,
            updateTask: updateTask,
            replaceTask: replaceTask,
            saveUserToLocalStorage: saveUserToLocalStorage,
            getUserFromLocalStorage: getUserFromLocalStorage,
            deleteUserFromLocalStorage: deleteUserFromLocalStorage,
            sendRegistrationIdToServer: sendRegistrationIdToServer
        };

        return service;
    }
})();