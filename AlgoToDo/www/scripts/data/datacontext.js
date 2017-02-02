(function() {
    'use strict';

    angular
        .module('app.data')
        .service('datacontext', datacontext);

    datacontext.$inject = ['$http', 'logger', 'lodash', 'appConfig', '$rootScope',
                           '$localStorage', '$mdToast', 'socket', '$filter', 'dropbox',
                           '$q', '$location'];

    function datacontext($http, logger, lodash, appConfig, $rootScope,
                         $localStorage, $mdToast, socket, $filter, dropbox,
                         $q, $location) {

        
        var self = this;
        self.$storage = $localStorage;
        self.$storage.usersCache = self.$storage.usersCache === undefined ? [] : self.$storage.usersCache;//new Map();
 
        var getTaskList = function () {
            return self.$storage.tasksList !== undefined ? self.$storage.tasksList: [];
        };

        var setTaskList = function (newList) {
            self.$storage.tasksList = newList;
        };

        var deleteTaskListFromLocalStorage = function () {
            delete self.$storage.tasksList;
        };
        
        var addTaskToTaskList = function (task) {
            var count = self.$storage.tasksList.filter(function (t) { return t._id === task._id });
            // prevent pushing the same task
            if (count.length === 0) {
                self.$storage.tasksList.push(task);
            }            
        };

        var pushTasksToTasksList = function (tasks) {
            self.$storage.tasksList = self.$storage.tasksList.concat(tasks);
        };
        
        var replaceTask = function (task) {
            var index = arrayObjectIndexOf(self.$storage.tasksList, '_id', task._id);
            if (index !== -1) {
                self.$storage.tasksList[index] = task;
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

        var addUsersToUsersCache = function (usersList) {

            //self.$storage.usersCache = self.$storage.usersCache.concat(usersList);
            
            var usersCache = self.$storage.usersCache;
            for (var i = 0; i < usersList.length; i++) {
                if (arrayObjectIndexOf(usersCache, '_id', usersList[i]._id) === -1) {
                    usersCache.push(usersList[i]);
                }
            }
            
           /* _.each(usersList, function (user) {
                if (!self.$storage.usersCache.has(user._id)) {
                    self.$storage.usersCache.set(user._id, user);
                }
            })*/
        }
        
        var getAllCachedUsers = function () {
            return self.$storage.usersCache;
        }
        
        var addCommentToTask = function (taskId, comment) {
            var foundIndex = arrayObjectIndexOf(self.$storage.tasksList, '_id', taskId);
            var task;
            if (foundIndex !== -1) {
                task = self.$storage.tasksList[foundIndex];
            }

            if (task.comments === undefined) {
                task.comments = [comment];
                updateUnSeenResponse(task)
            }
            else {
                var newCommentIndex_IfExist = arrayObjectIndexOf(task.comments, '_id', comment._id);
                if (newCommentIndex_IfExist === -1) {
                    task.comments.push(comment);
                    updateUnSeenResponse(task)
                }
            }

                
            /*if (comment.fileThumbnail) {
                dropbox.getThumbnail(imageUrl, 'w128h128').then(function (response) {
                    comment.fileThumbnail = URL.createObjectURL(response.fileBlob);
                })
                .catch(function (error) {
                    logger.error("error while trying to get file Thumbnail", error);
                });
            }*/
        }

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
            var result = getTaskList().filter(function (t) { return t._id === taskId });
            if (result.length === 1) {
                return result[0];
            }
            return {};
        }

        var setMyTaskCount = function () {
            var userId = self.$storage.user._id;
            var count = $filter('myTasks')(getTaskList(), userId).length;           
            $rootScope.taskcount = count;

            return count;
        };
        
        var setDeviceDetailes = function (device, applicationDirectory) {
            self.$storage.deviceDetailes = device;
            self.$storage.deviceDetailes.applicationDirectory = applicationDirectory;
        }

        var getDeviceDetailes = function () {
            return (self.$storage.deviceDetailes !== undefined &&
                    self.$storage.deviceDetailes.applicationDirectory !== undefined) ?
                    self.$storage.deviceDetailes : {};
        }
        
        
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
            getTaskByTaskId: getTaskByTaskId
        };

        return service;
    }
})();
