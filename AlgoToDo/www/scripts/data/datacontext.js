(function() {
    'use strict';

    angular
        .module('app.data')
        .service('datacontext', datacontext);

    datacontext.$inject = ['$http', 'logger', 'lodash', 'appConfig', '$rootScope',
                           '$localStorage', '$mdToast', 'socket', '$filter', 'dropbox',
                           '$q', '$location', '$timeout'];

    function datacontext($http, logger, lodash, appConfig, $rootScope,
                         $localStorage, $mdToast, socket, $filter, dropbox,
                         $q, $location, $timeout) {

        
        var self = this;
        self.$storage = $localStorage;
        self.$storage.usersCache = self.$storage.usersCache === undefined ? [] : self.$storage.usersCache;//new Map();

        var getTaskList = function () {
            return self.$storage.tasksList !== undefined ? self.$storage.tasksList: [];
        };

        var deleteTaskListFromLocalStorage = function () {
            delete self.$storage.tasksList;
        };
        
        var addTaskToTaskList = function (task) {
            var count = self.$storage.tasksList.filter(function (t) { return t._id === task._id; });
            // prevent pushing the same task
            if (count.length === 0) {
                replaceUsersWithPhoneContact([task]);
                self.$storage.tasksList.push(task);
            }            
        };

        var setTaskList = function (newList) {
            replaceUsersWithPhoneContact(newList);
            self.$storage.tasksList = newList;
        };

        var pushTasksToTasksList = function (tasks) {
            replaceUsersWithPhoneContact(tasks);
            self.$storage.tasksList = getTaskList().concat(tasks);
        };
        
        var replaceTask = function (task) {
            replaceUsersWithPhoneContact([task]);
            var index = arrayObjectIndexOf(getTaskList(), '_id', task._id);
            if (index !== -1) {
                self.$storage.tasksList[index] = task;
            }
            else {
                addTaskToTaskList(task);
            }
        };      
        
        var replaceUsersWithPhoneContact = function (tasks) {
            var allCachedUsers = getAllCachedUsers();
            if (allCachedUsers.length === 0 ) {
                return;
            }
            for (var i = 0; i < tasks.length; i++) {
                var task = tasks[i];
                var f_index = arrayObjectIndexOf(allCachedUsers, '_id', task.from._id);
                if (f_index !== -1) {
                    task.from = allCachedUsers[f_index];
                }

                if (task.from._id !== task.to._id) {
                    var t_index = arrayObjectIndexOf(allCachedUsers, '_id', task.to._id);
                    if (t_index !== -1) {
                        task.to = allCachedUsers[t_index];
                    }
                }
                else {
                    task.to = allCachedUsers[f_index];
                }
            }
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

        var addUsersToUsersCache = function (usersList, replace) {

            //self.$storage.usersCache = self.$storage.usersCache.concat(usersList);

            var usersCache = getAllCachedUsers(), index;
            for (var i = 0; i < usersList.length; i++) {
                index = arrayObjectIndexOf(usersCache, '_id', usersList[i]._id);
                if (index === -1) {
                    usersCache.push(usersList[i]);
                }
                else {
                    if (replace) {
                        usersCache[index] = usersList[i];
                    }
                }
            }
        };
        
        var getAllCachedUsers = function () {
            if (self.$storage.usersCache === undefined) {
                self.$storage.usersCache = [];
            }
            return self.$storage.usersCache;
        };

        var deleteAllCachedUsers = function () {
            delete self.$storage.usersCache;
        };
        
        var addCommentToTask = function (taskId, comment) {
            var foundIndex = arrayObjectIndexOf(self.$storage.tasksList, '_id', taskId);
            var task;
            if (foundIndex !== -1) {
                task = self.$storage.tasksList[foundIndex];
            }

            if (task.comments === undefined) {
                task.comments = [comment];
                updateUnSeenResponse(task);
            }
            else {
                var newCommentIndex_IfExist = arrayObjectIndexOf(task.comments, '_id', comment._id);
                if (newCommentIndex_IfExist === -1) {
                    task.comments.push(comment);
                    updateUnSeenResponse(task);
                }
            }
        };

        function updateUnSeenResponse(task) {
            if ($location.path().indexOf(task._id) === -1) {
                task.unSeenResponses = task.unSeenResponses === undefined || task.unSeenResponses === '' ? 1 : task.unSeenResponses + 1;
            }
        }
        
        function arrayObjectIndexOf(myArray, property, searchTerm) {
            for (var i = 0, len = myArray.length; i < len; i++) {
                if (myArray[i][property] === searchTerm) return i;
            }
            return -1;
        }

        var getTaskByTaskId = function (taskId) {
            var result = getTaskList().filter(function (t) { return t._id === taskId; });
            if (result.length === 1) {
                return result[0];
            }
            return {};
        };

        var setMyTaskCount = function () {
            var userId = self.$storage.user._id;
            var count = $filter('myTasks')(getTaskList(), userId).length;           
            $rootScope.taskcount = count;

            return count;
        };
        
        var setDeviceDetailes = function (device, applicationDirectory) {
            self.$storage.deviceDetailes = device;
            self.$storage.deviceDetailes.applicationDirectory = applicationDirectory;
        };

        var getDeviceDetailes = function () {

            return (self.$storage.deviceDetailes !== undefined &&
                    self.$storage.deviceDetailes.applicationDirectory !== undefined) ?
                    self.$storage.deviceDetailes : {};
        };
        
        var addTasksToRepeatsTasksList = function (tasks) {
            if (self.$storage.repeatsTasksList === undefined) {
                self.$storage.repeatsTasksList = [];
            }
            self.$storage.repeatsTasksList = self.$storage.repeatsTasksList.concat(tasks);
        };

        var getRepeatsTasksList = function () {
            return self.$storage.repeatsTasksList || [];
        };

        var setRepeatsTasksList = function (newTasks) {
            self.$storage.repeatsTasksList = newTasks;
        };

        var deleteRepeatsTask = function (taskId) {
            var index = arrayObjectIndexOf(self.$storage.repeatsTasksList, '_id', taskId);
            if (index !== -1) {
                self.$storage.repeatsTasksList.splice(index, 1);
            }
        };
        
        var replaceRepeatsTasks = function (newTasks) {
            var index;
            for (var i = 0; i < newTasks.length; i++) {
                index = arrayObjectIndexOf(self.$storage.repeatsTasksList, '_id', newTasks[i]._id);
                if (index !== -1) {
                    self.$storage.repeatsTasksList[index] = newTasks[i];
                }
            }
        };

        var isMobileDevice = function () {
            return document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
        };
      
        (function(){
            var user = getUserFromLocalStorage();
            if (user !== undefined) {           
                var logUser = { name: user.name, _id: user._id, phone: user.phone, versionInstalled: user.versionInstalled };
                logUser.device = isMobileDevice() ? user.device.manufacturer + ' ' + user.device.model: 'Browser',
                logger.setUser(logUser);
            }
        })();
        

        var service = {
            getTaskList: getTaskList,
            setTaskList: setTaskList,
            addTaskToTaskList: addTaskToTaskList,
            replaceTask: replaceTask,
            saveUserToLocalStorage: saveUserToLocalStorage,
            getUserFromLocalStorage: getUserFromLocalStorage,
            deleteUserFromLocalStorage: deleteUserFromLocalStorage,
            addUsersToUsersCache: addUsersToUsersCache,
            getAllCachedUsers: getAllCachedUsers,
            addCommentToTask: addCommentToTask,
            deleteTaskListFromLocalStorage: deleteTaskListFromLocalStorage,
            setMyTaskCount: setMyTaskCount,
            pushTasksToTasksList: pushTasksToTasksList,
            setDeviceDetailes: setDeviceDetailes,
            getDeviceDetailes: getDeviceDetailes,
            getTaskByTaskId: getTaskByTaskId,
            addTasksToRepeatsTasksList: addTasksToRepeatsTasksList,
            getRepeatsTasksList: getRepeatsTasksList,
            setRepeatsTasksList: setRepeatsTasksList,
            deleteRepeatsTask: deleteRepeatsTask,
            replaceRepeatsTasks: replaceRepeatsTasks,
            deleteAllCachedUsers: deleteAllCachedUsers
        };

        return service;
    }
})();
