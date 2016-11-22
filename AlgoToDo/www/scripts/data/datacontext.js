(function() {
    'use strict';

    angular
        .module('app.data')
        .service('datacontext', datacontext);

    datacontext.$inject = ['$http', 'logger', 'lodash', 'appConfig', '$localStorage', '$mdToast'];

    function datacontext($http, logger, lodash, appConfig, $localStorage, $mdToast) {

        var self = this;
        self.tasksList = [];
        self.$storage = $localStorage;
        self.$storage.usersCache = new Map();
        //self.socket = io.connect(appConfig.appDomain);

        var saveNewTask = function(task) {

            var req = {
                method: 'POST',
                url: appConfig.appDomain + '/TaskManeger/newTask',
                data: {
                    task: task
                }
            };

            return $http(req);
        };

        var getAllTasks = function () {
            var req = {
                method: 'GET',
                url: appConfig.appDomain + '/TaskManeger/getTasks',
                params: {
                    userId: self.$storage.user._id
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
            return self.$storage.tasksList !== undefined ? self.$storage.tasksList: [];
        };

        var setTaskList = function (newList) {
            self.$storage.tasksList = newList;
        };
        
        var addTaskToTaskList = function (task) {
            var count = self.$storage.tasksList.filter(function (t) { return t._id === task._id });
            // prevent pushing the same task
            if (count.length === 0) {
                self.$storage.tasksList.push(task);
            }            
        };

        var replaceTask = function (task) {
            var foundIndex = self.$storage.tasksList.findIndex(x => x._id === task._id);
            self.$storage.tasksList[foundIndex] = task;
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

        var addUsersToUsersCache = function (usersList) {
            _.each(usersList, function (user) {
                if (!self.$storage.usersCache.has(user._id)) {
                    self.$storage.usersCache.set(user._id, user);
                }
            })
        }
        
        var getAllCachedUsers = function () {
            return self.$storage.usersCache;
        }

        var checkIfUserExist = function (user) {
            var req = {
                method: 'GET',
                url: appConfig.appDomain + '/TaskManeger/isUserExist',
                params: {
                    userEmail: user.email,
                    userPhone: user.phone
                }
            };

            return $http(req);
        }

        var getTaskByTaskId = function (taskId) {
            var result = getTaskList().filter(function (t) { return t._id === taskId });
            if (result.length === 1) {
                return result[0];
            }
            return {};
        }

        var newComment = function (taskId, comment) {
            var req = {
                method: 'POST',
                url: appConfig.appDomain + '/TaskManeger/newComment',
                data: {
                    taskId: taskId,
                    comment: comment
                }
            };

            return $http(req);
        }

        var getSocket = function () {
            //return self.socket;
        }

        var service = {
            user: self.user,
            getTaskList: getTaskList,
            setTaskList: setTaskList,
            addTaskToTaskList: addTaskToTaskList,
            saveNewTask: saveNewTask,
            updateTask: updateTask,
            replaceTask: replaceTask,
            saveUserToLocalStorage: saveUserToLocalStorage,
            getUserFromLocalStorage: getUserFromLocalStorage,
            deleteUserFromLocalStorage: deleteUserFromLocalStorage,
            registerUser: registerUser,
            getAllTasks: getAllTasks,
            searchUsers: searchUsers,
            addUsersToUsersCache: addUsersToUsersCache,
            getAllCachedUsers: getAllCachedUsers,
            checkIfUserExist: checkIfUserExist,
            getTaskByTaskId: getTaskByTaskId,
            newComment: newComment,
            getSocket: getSocket
        };

        return service;
    }
})();