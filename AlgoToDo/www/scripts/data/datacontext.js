(function() {
    'use strict';

    angular
        .module('TaskManeger.data')
        .service('datacontext', datacontext);

    datacontext.$inject = ['$http', 'logger', 'socket', 'lodash', 'appConfig', '$localStorage', '$mdToast'];

    function datacontext($http, logger, socket, lodash, appConfig, $localStorage, $mdToast) {

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
                logger.info('המשימה נשלחה בהצלחה!', response.data, 2000);
                self.tasksList.push(response.data);

                // clean the form
                self.newTask = {};
            }, function () { });
        };

        var getAllTasks = function () {
            var simpleToast = logger.info("טוען נתונים...", null, 10000);
            var req = {
                method: 'GET',
                url: appConfig.appDomain + '/TaskManeger/getTasks',
                params: {
                    user: self.$storage.user.name
                }
            };

            $http(req).then(function (response) {
                logger.success("getAllTasks", response.data);
                self.tasksList = response.data;
                $mdToast.hide(simpleToast);
            });
        };

        var getAllTasksSync = function () {
            var req = {
                method: 'GET',
                url: appConfig.appDomain + '/TaskManeger/getTasks',
                params: {
                    user: self.$storage.user.name
                }
            };

            return $http(req);
        };
        
        var updateTask = function (task) {
            
            var req = {
                method: 'POST',
                url: appConfig.appDomain + '/TaskManeger/updateTaskStatus',
                data: {
                    task: task
                }
            };

            return $http(req);

            // send the new task to the server
            /*socket.emit('update-task', {
                task: task
            });*/
        };

        var getTaskList = function () {
            return self.tasksList;
        };

        var setTaskList = function (newList) {
            self.tasksList = newList;
        };
        
        var addTaskToTaskList = function (task) {
            self.tasksList.push(task);
        };

        var replaceTask = function (task) {
            var foundIndex = self.tasksList.findIndex(x => x._id === task._id);
            self.tasksList[foundIndex] = task;
        };

        var getNewTask = function () {
            return self.newTask;
        };

        var saveUserToLocalStorage = function (user) {
            self.$storage.user = user;
        };

        var getUserFromLocalStorage = function () {
            return self.$storage !== undefined ? self.$storage.user : undefined;
        };

        var deleteUserFromLocalStorage = function () {
            delete self.$storage.user;
        };

        var resetNewTask = function () {
            // clean the form
            self.newTask = {};
        };

        var registerUser = function (user) {
            var req = {
                method: 'POST',
                url: appConfig.appDomain + '/TaskManeger/registerUser',
                data: {
                    user: user
                }
            };

            return $http(req);
        };

        var searchUsers = function (string) {
            var req = {
                method: 'GET',
                url: appConfig.appDomain + '/TaskManeger/searchUsers',
                params: {
                    queryString: string
                }
            };

            return $http(req);
        };

        var service = {
            user: self.user,
            getTaskList: getTaskList,
            setTaskList: setTaskList,
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
            registerUser: registerUser,
            getAllTasksSync: getAllTasksSync,
            searchUsers: searchUsers
        };

        return service;
    }
})();