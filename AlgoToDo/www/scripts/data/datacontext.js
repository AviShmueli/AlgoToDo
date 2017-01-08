(function() {
    'use strict';

    angular
        .module('app.data')
        .service('datacontext', datacontext);

    datacontext.$inject = ['$http', 'logger', 'lodash', 'appConfig', '$rootScope',
                           '$localStorage', '$mdToast', 'socket', '$filter', 'dropbox',
                           '$q'];

    function datacontext($http, logger, lodash, appConfig, $rootScope,
                         $localStorage, $mdToast, socket, $filter, dropbox,
                         $q) {

        
        var self = this;
        self.$storage = $localStorage;
        self.$storage.usersCache = [];//new Map();

        var saveNewTasks = function(tasks) {

            var req = {
                method: 'POST',
                url: appConfig.appDomain + '/TaskManeger/newTask',
                data: {
                    task: tasks
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
        };

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
            var params = {};
            if (self.$storage.user.type !== undefined && self.$storage.user.type === 'admin') {
                params = {
                    queryString: string
                };
            }
            else {
                if (self.$storage.user.cliqot !== undefined && self.$storage.user.cliqot[0] !== undefined) {
                    params = {
                        queryString: string,
                        userCliqaId: self.$storage.user.cliqot[0]._id
                    };
                }
                else {
                    params = {
                        queryString: string
                    };
                }
            }
            var req = {
                method: 'GET',
                url: appConfig.appDomain + '/TaskManeger/searchUsers',
                params: params
            };

            return $http(req);
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

        var checkIfUserExist = function (user) {
            var req = {
                method: 'GET',
                url: appConfig.appDomain + '/TaskManeger/isUserExist',
                params: {
                    userName: user.name,
                    userPhone: user.phone
                }
            };

            return $http(req);
        }

        var checkIfVerificationCodeMatch = function (user, verificationCode) {
            var req = {
                method: 'GET',
                url: appConfig.appDomain + '/TaskManeger/checkIfVerificationCodeMatch',
                params: {
                    userId: user._id,
                    verificationCode: verificationCode
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
        
        var addCommentToTask = function (taskId, comment) {
            var foundIndex = arrayObjectIndexOf(self.$storage.tasksList, '_id', taskId);
            var task;
            if (foundIndex !== -1) {
                task = self.$storage.tasksList[foundIndex];
            }

            if (task.comments === undefined) {
                task.comments = [comment];
                task.unSeenResponses = task.unSeenResponses === undefined || task.unSeenResponses === '' ? 1 : task.unSeenResponses + 1;
            }
            else {
                var newCommentIndex_IfExist = arrayObjectIndexOf(task.comments, '_id', comment._id);
                if (newCommentIndex_IfExist === -1) {
                    task.comments.push(comment);
                    task.unSeenResponses = task.unSeenResponses === undefined || task.unSeenResponses === '' ? 1 : task.unSeenResponses + 1;
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
        
        function arrayObjectIndexOf(myArray, property, searchTerm) {
            for (var i = 0, len = myArray.length; i < len; i++) {
                if (myArray[i][property] === searchTerm) return i;
            }
            return -1;
        }

        // when new comment received from the server
        /*socket.on('new-comment', function (data) {

            var newComment = data.newComment;
            var taskId = data.taskId;
            addCommentToTask(taskId, newComment);
        });*/

        var reloadAllTasks = function () {
            if (self.$storage.user !== undefined) {
                getAllTasks().then(function (response) {
                    setTaskList(response.data);
                });
            }           
        };

        var setMyTaskCount = function () {
            var userId = self.$storage.user._id;
            var count = $filter('myTasks')(getTaskList(), userId).length;           
            $rootScope.taskcount = count;

            return count;
        };

        var updateUserDetails = function (userId, fieldToUpdate, valueToUpdate) {
            var req = {
                method: 'POST',
                url: appConfig.appDomain + '/TaskManeger/updateUserDetails',
                data: {
                    userId: userId,
                    fieldToUpdate: fieldToUpdate,
                    valueToUpdate: valueToUpdate
                }
            };

            return $http(req);
        }

        var saveUsersNewRegistrationId = function (registrationId, user) {
            var filedToUpdate = '';
            if (user.device.platform === 'iOS') {
                user.ApnRegistrationId = registrationId;
                filedToUpdate = 'ApnRegistrationId';
            }
            if (user.device.platform === 'Android') {
                user.GcmRegistrationId = registrationId;
                filedToUpdate = 'GcmRegistrationId';
            }
            updateUserDetails(user._id, filedToUpdate, registrationId);
        }
        
        var setDeviceDetailes = function (device, applicationDirectory) {
            self.$storage.deviceDetailes = device;
            self.$storage.deviceDetailes.applicationDirectory = applicationDirectory;
        }

        var getDeviceDetailes = function () {
            return (self.$storage.deviceDetailes !== undefined &&
                    self.$storage.deviceDetailes.applicationDirectory !== undefined) ?
                    self.$storage.deviceDetailes : {};
        }

        var saveFileToCache = function (fileName, file) {
            if (!self.$storage.filesCache) {
                self.$storage.filesCache = {};
            }
            self.$storage.filesCache[fileName] = file;
        }

        var getFileFromCache = function (fileName) {
            if (self.$storage.filesCache) {
                return self.$storage.filesCache[fileName];
            }
            return undefined;
        }

        var removeFileFromCache = function (fileName) {
            delete self.$storage.filesCache[fileName];
        }

        var removeAllTaskImagesFromCache = function (task) {
            for (var i = 0; i < task.comments.length; i++) {
                if (task.comments[i].fileName !== undefined) {
                    removeFileFromCache(task.comments[i].fileName);
                }
            }
        }
        
        var getAllCliqot = function () {
            var deferred = $q.defer();

            var req = {
                method: 'GET',
                url: appConfig.appDomain + '/TaskManeger/getAllCliqot',
                params: {
                    
                }
            };

            $http(req).then(function (response) {
                deferred.resolve(response.data);
            });

            return deferred.promise;
        }

        var service = {
            getTaskList: getTaskList,
            setTaskList: setTaskList,
            addTaskToTaskList: addTaskToTaskList,
            saveNewTasks: saveNewTasks,
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
            addCommentToTask: addCommentToTask,
            reloadAllTasks: reloadAllTasks,
            deleteTaskListFromLocalStorage: deleteTaskListFromLocalStorage,
            setMyTaskCount: setMyTaskCount,
            pushTasksToTasksList: pushTasksToTasksList,
            saveUsersNewRegistrationId: saveUsersNewRegistrationId,
            setDeviceDetailes: setDeviceDetailes,
            getDeviceDetailes: getDeviceDetailes,
            removeFileFromCache: removeFileFromCache,
            getFileFromCache: getFileFromCache,
            saveFileToCache: saveFileToCache,
            removeAllTaskImagesFromCache: removeAllTaskImagesFromCache,
            getAllCliqot: getAllCliqot,
            checkIfVerificationCodeMatch: checkIfVerificationCodeMatch,
            updateUserDetails: updateUserDetails
        };

        return service;
    }
})();
