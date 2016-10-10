(function() {
    'use strict';

    angular
        .module('TaskManeger.data')
        .service('datacontext', datacontext);

    datacontext.$inject = ['$http', 'logger', 'socket', 'lodash', 'appConfig'];

    function datacontext($http, logger, socket, lodash, appConfig) {

        var self = this;
        self.tasksList = [];
        self.newTask = {};
        //self.users = [];
        self.user = {};
        
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
                url: appConfig.appDomain + '/TaskManeger/getTasks'
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

        var service = {
            /*users: self.users,*/
            user: self.user,
            getTaskList: getTaskList,
            addTaskToTaskList: addTaskToTaskList,
            getNewTask: getNewTask,
            saveNewTask: saveNewTask,
            getAllTasks: getAllTasks,
            updateTask: updateTask,
            replaceTask: replaceTask
        };

        return service;
    }
})();