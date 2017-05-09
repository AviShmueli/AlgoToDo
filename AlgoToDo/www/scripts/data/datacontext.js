(function () {
    'use strict';

    angular
        .module('app.data')
        .service('datacontext', datacontext);

    datacontext.$inject = ['logger', '$rootScope', '$localStorage', '$filter',
                           '$q', '$location', 'DAL', 'common', 'browserNotification',
                           '$interval', '$timeout'];

    function datacontext(logger, $rootScope, $localStorage, $filter,
                         $q, $location, DAL, common, browserNotification,
                         $interval, $timeout) {


        var self = this;
        self.$storage = $localStorage;
        self.$storage.usersCache = self.$storage.usersCache === undefined ? [] : self.$storage.usersCache;//new Map();

        /* ----- Tasks ----- */

        var reloadAllTasks = function (isFromInterval) {

            var deferred = $q.defer();

            var user = getUserFromLocalStorage(), tempDate = new Date();

            if (user !== undefined) {

                if (user.lastServerSync !== undefined) {
                    user.lastServerSync = new Date(user.lastServerSync);                    
                }

                //DAL.getTasksInProgress(user).then(function (response) {
                DAL.getTasks(user).then(function (response) {

                    //setTaskList(response.data);
                    updateLocalTasks(response.data, isFromInterval);


                    //DAL.getDoneTasks(0, user).then(function (_response) {
                        //pushTasksToTasksList(_response.data);
                    //    updateLocalTasks(_response.data, isFromInterval);
                        setMyTaskCount();
                        deferred.resolve();
                    //});

                    // if calld from sync contacts or login
                    if (isFromInterval === undefined) {
                        sortUsersByfrequencyOfUse();
                    }

                    // a trik to do somthing every day
                    if (user.lastServerSync !== undefined &&
                        user.lastServerSync.getUTCDate() !== tempDate.getUTCDate()) {
                        sortUsersByfrequencyOfUse();
                    }
                    user.lastServerSync = tempDate;
                });

            }

            return deferred.promise;
        };

        var setTaskList = function (newList) {
            replaceUsersWithPhoneContact(newList);
            self.$storage.tasksList = newList;
        };

        var getTaskList = function () {
            return self.$storage.tasksList !== undefined ? self.$storage.tasksList : [];
        };

        var getTaskByTaskId = function (taskId) {
            var tasksList = getTaskList();
            var index = common.arrayObjectIndexOf(tasksList, '_id', taskId);
            if (index !== -1) {
                return tasksList[index];
            }
            else {
                var moreLoadedTasks = getMoreLoadedTasks();
                index = common.arrayObjectIndexOf(moreLoadedTasks, '_id', taskId);
                if (index !== -1) {
                    return moreLoadedTasks[index];
                }
            }
            return {};
        };

        var addTaskToTaskList = function (task) {
            var tasksList = getTaskList();
            var index = common.arrayObjectIndexOf(tasksList, '_id', task._id);
            if (index === -1) {
                replaceUsersWithPhoneContact([task]);
                self.$storage.tasksList.push(task);
            }
        };

        var pushTasksToTasksList = function (tasks) {
            replaceUsersWithPhoneContact(tasks);
            self.$storage.tasksList = getTaskList().concat(tasks);
        };

        var replaceUsersWithPhoneContact = function (tasks) {
            var allCachedUsers = getAllCachedUsers();
            if (allCachedUsers.length === 0) {
                return;
            }
            for (var i = 0; i < tasks.length; i++) {
                var task = tasks[i];
                var f_index = common.arrayObjectIndexOf(allCachedUsers, '_id', task.from._id);
                if (f_index !== -1) {
                    task.from = allCachedUsers[f_index];
                }

                if (task.to !== undefined && !Array.isArray(task.to)) {
                    if (task.from._id !== task.to._id) {
                        var t_index = common.arrayObjectIndexOf(allCachedUsers, '_id', task.to._id);
                        if (t_index !== -1) {
                            task.to = allCachedUsers[t_index];
                        }
                    }
                    else {
                        task.to = allCachedUsers[f_index];
                    }
                }
                else {
                    if (Array.isArray(task.to) && task.to.length === 1) {
                        if (task.from._id !== task.to[0]._id) {
                            t_index = common.arrayObjectIndexOf(allCachedUsers, '_id', task.to[0]._id);
                            if (t_index !== -1) {
                                task.to[0] = allCachedUsers[t_index];
                            }
                        }
                        else {
                            task.to[0] = allCachedUsers[f_index];
                        }
                    }
                }

                if (task.comments !== undefined && task.comments.length > 0) {
                    replaceUsersWithPhoneContact(task.comments);
                }
            }
        };

        var deleteTaskListFromLocalStorage = function () {
            delete self.$storage.tasksList;
        };

        var setMyTaskCount = function () {
            var userId = self.$storage.user._id;
            var count = $filter('myTasks')(getTaskList(), userId).length;
            $rootScope.taskcount = count;

            return count;
        };

        var updateLocalTasks = function (newTasks, isFromInterval) {
            var user = getUserFromLocalStorage();
            var tasksList = getTaskList();
            if (tasksList === []) {
                setTaskList(newTasks);
            }
            for (var i = 0; i < newTasks.length; i++) {
                var newTask = newTasks[i];
                var localTaskIndex = common.arrayObjectIndexOf(tasksList, '_id', newTask._id);
                if (localTaskIndex === -1) {
                    pushTasksToTasksList([newTask]);
                    if (!isMobileDevice() && newTask.status === 'inProgress' && newTask.from._id !== user._id && isFromInterval) {
                        browserNotification.showNotification("משימה חדשה", newTask.description, newTask._id);
                    }
                }
                else {
                    var localTask = tasksList[localTaskIndex];
                    if (localTask.status !== newTask.status) {
                        localTask.status = newTask.status;
                    }
                    if (localTask.comments.length !== newTask.comments.length) {
                        var diffCount = newTask.comments.length - localTask.comments.length;
                        var filterdNewTasksComments = $filter('orderBy')(newTask.comments, 'createTime', true);

                        for (var j = 0; j < diffCount; j++) {
                            var newComment = filterdNewTasksComments[j];
                            addCommentToTask(newTask._id, newComment);
                            if (!isMobileDevice() && isFromInterval) {
                                browserNotification.showNotification("תגובה חדשה", newComment.text, newTask._id);
                            }
                        }
                    }
                    if (localTask.doneTime !== newTask.doneTime) {
                        localTask.doneTime = newTask.doneTime;
                    }
                    if (localTask.lastModified !== newTask.lastModified) {
                        localTask.lastModified = newTask.lastModified;
                    }
                }
            }

            setMyTaskCount();
        }

        var getMoreLoadedTasks = function () {
            return self.moreLoadedTasks !== undefined ? self.moreLoadedTasks : [];
        }

        var addTasksToMoreLoadedTasks = function (tasks) {
            replaceUsersWithPhoneContact(tasks);
            self.moreLoadedTasks = getMoreLoadedTasks().concat(tasks);
        }

        /* ----- Comments ----- */

        var addCommentToTask = function (taskId, comment) {
            replaceUsersWithPhoneContact([comment]);
            var foundIndex = common.arrayObjectIndexOf(self.$storage.tasksList, '_id', taskId);
            var task;
            if (foundIndex !== -1) {
                task = self.$storage.tasksList[foundIndex];
            }

            if (task.comments === undefined) {
                task.comments = [comment];
                updateUnSeenResponse(task);
            }
            else {
                var newCommentIndex_IfExist = common.arrayObjectIndexOf(task.comments, '_id', comment._id);
                if (newCommentIndex_IfExist === -1) {
                    task.comments.push(comment);
                    updateUnSeenResponse(task);
                }
            }
        };

        var updateUnSeenResponse = function (task) {
            if ($location.path().indexOf(task._id) === -1) {
                task.unSeenResponses = task.unSeenResponses === undefined || task.unSeenResponses === '' ? 1 : task.unSeenResponses + 1;
            }
            var user = getUserFromLocalStorage();
            if (task.status === 'inProgress' &&
                    task.from._id === user._id &&
                    task.to._id !== user._id /*&&
                    task.type !== 'group-sub'*/) {
                $rootScope.newCommentsInTasksInProcessCount =
                    $rootScope.newCommentsInTasksInProcessCount !== undefined ?
                    $rootScope.newCommentsInTasksInProcessCount + 1 :
                    1;
            }
        }

        /* ---- Device ----- */

        var setDeviceDetailes = function (device, applicationDirectory) {
            self.$storage.deviceDetailes = device;
            self.$storage.deviceDetailes.applicationDirectory = applicationDirectory;
        };

        var getDeviceDetailes = function () {

            return (self.$storage.deviceDetailes !== undefined &&
                    self.$storage.deviceDetailes.applicationDirectory !== undefined) ?
                    self.$storage.deviceDetailes : {};
        };

        var isMobileDevice = function () {
            return document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
        };

        /* ---- Repeats Tasks ----- */

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
            replaceUsersWithPhoneContact(newTasks);
            self.$storage.repeatsTasksList = newTasks;
        };

        var deleteRepeatsTask = function (taskId) {
            var index = common.arrayObjectIndexOf(self.$storage.repeatsTasksList, '_id', taskId);
            if (index !== -1) {
                self.$storage.repeatsTasksList.splice(index, 1);
            }
        };

        var replaceRepeatsTasks = function (newTasks) {
            var index;
            for (var i = 0; i < newTasks.length; i++) {
                index = common.arrayObjectIndexOf(self.$storage.repeatsTasksList, '_id', newTasks[i]._id);
                if (index !== -1) {
                    self.$storage.repeatsTasksList[index] = newTasks[i];
                }
            }
        };

        /* ----- Users ----- */

        var replaceUsersAvatarUrlWithLocalPath = function (users) {

            var allCachedUsers = getAllCachedUsers();

            for (var i = 0; i < users.length; i++) {
                var user = users[i];

                var index = common.arrayObjectIndexOf(allCachedUsers, '_id', user._id);
                if (index !== -1) {
                    user.avatarUrl = allCachedUsers[index].avatarUrl;
                }
            }
        }

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
                index = common.arrayObjectIndexOf(usersCache, '_id', usersList[i]._id);
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

        var removeUsersFromUsersCache = function (userId) {
            var usersCache = getAllCachedUsers(), index;

            index = common.arrayObjectIndexOf(usersCache, '_id', userId);
            if (index !== -1) {
                usersCache.splice(index, 1);
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

        var sortUsersByfrequencyOfUse = function () {
            var user = getUserFromLocalStorage();
            var allUsers = getAllCachedUsers();
            var allTasks = getTaskList();

            self.userId_useCount_map = {};

            var task, taskFromId, taskToId;
            for (var i = 0; i < allTasks.length; i++) {
                task = allTasks[i];
                taskFromId = task.from._id;
                taskToId = task.to._id;

                if (taskToId !== undefined) {
                    buildMap(taskFromId, taskToId, user._id);
                }
                else {
                    // if this is a group task
                    for (var j = 0; j < task.to.length; j++) {
                        buildMap(taskFromId, task.to[j]._id, user._id);
                    }
                }
            }

            Object.keys(self.userId_useCount_map).forEach(function (key, index) {

                for (var i = 0, len = allUsers.length; i < len; i++) {

                    if (allUsers[i]._id === key) {
                        allUsers[i]['useCount'] = self.userId_useCount_map[key] * -1;
                    }
                    if (allUsers[i]['useCount'] === undefined) {
                        //allUsers[i]['useCount'] = 0;
                    }
                }
            });
        };

        var buildMap = function (taskFromId, taskToId, userId) {
            if (taskToId === userId) {
                if (self.userId_useCount_map[taskFromId] !== undefined) {
                    self.userId_useCount_map[taskFromId]++;
                }
                else {
                    self.userId_useCount_map[taskFromId] = 1;
                }
            }
            else {
                if (self.userId_useCount_map[taskToId] !== undefined) {
                    self.userId_useCount_map[taskToId]++;
                }
                else {
                    self.userId_useCount_map[taskToId] = 1;
                }
            }
        };

        (function () {
            var user = getUserFromLocalStorage();
            if (user !== undefined) {
                var logUser = { name: user.name, _id: user._id, phone: user.phone, versionInstalled: user.versionInstalled };
                logUser.device = isMobileDevice() ? user.device.manufacturer + ' ' + user.device.model : 'Browser',
                logger.setUser(logUser);
            }

            if (!isMobileDevice()) {
                $interval(function () {
                    reloadAllTasks(true);
                }, 30000);
            }
        })();


        var service = {
            getTaskList: getTaskList,
            setTaskList: setTaskList,
            addTaskToTaskList: addTaskToTaskList,
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
            deleteAllCachedUsers: deleteAllCachedUsers,
            replaceUsersWithPhoneContact: replaceUsersWithPhoneContact,
            reloadAllTasks: reloadAllTasks,
            removeUsersFromUsersCache: removeUsersFromUsersCache,
            replaceUsersAvatarUrlWithLocalPath: replaceUsersAvatarUrlWithLocalPath,
            updateLocalTasks: updateLocalTasks,
            getMoreLoadedTasks: getMoreLoadedTasks,
            addTasksToMoreLoadedTasks: addTasksToMoreLoadedTasks,
            sortUsersByfrequencyOfUse: sortUsersByfrequencyOfUse
        };

        return service;
    }
})();
