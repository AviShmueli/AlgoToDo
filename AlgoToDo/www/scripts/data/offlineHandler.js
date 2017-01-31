(function() {
    'use strict';

    angular
        .module('app.data')
        .service('$offlineHandler', offlineHandler);

    offlineHandler.$inject = ['$http', 'logger', 'lodash', 'appConfig', '$rootScope',
                              '$localStorage', '$q', 'DAL', 'datacontext', '$cordovaNetwork',
                              'cordovaPlugins'];

    function offlineHandler($http, logger, lodash, appConfig, $rootScope,
                            $localStorage, $q, DAL, datacontext, $cordovaNetwork,
                            cordovaPlugins) {

        
        var self = this;
        
        self.$storage = $localStorage;

        var goOnline = function () {
            if (self.$storage.cachedNewTasksList !== undefined && self.$storage.cachedNewTasksList.length > 0) {
                DAL.saveNewTasks(self.$storage.cachedNewTasksList).then(function (response) {
                    removeAllTempTaskFromLocalStorage();
                    datacontext.pushTasksToTasksList(response.data);
                    delete self.$storage.cachedNewTasksList;
                });
            }

            if (self.$storage.cachedTasksToUpdateList !== undefined && self.$storage.cachedTasksToUpdateList.length > 0) {
                DAL.updateTasks(self.$storage.cachedTasksToUpdateList).then(function (response) {
                    delete self.$storage.cachedTasksToUpdateList;
                });
            }

            if (self.$storage.cachedNewCommentsList !== undefined && self.$storage.cachedNewCommentsList.length > 0) {
                DAL.AddNewComments(self.$storage.cachedNewCommentsList).then(function (response) {
                    markCommentsAsOnline(self.$storage.cachedNewCommentsList);
                    delete self.$storage.cachedNewCommentsList;
                });
            }
        }

        var addTasksToCachedNewTasksList = function (tasks) {
            
            if (self.$storage.cachedNewTasksList === undefined) {
                self.$storage.cachedNewTasksList = [];
            }

            if (Array.isArray(tasks)) {
                self.$storage.cachedNewTasksList = self.$storage.cachedNewTasksList.concat(tasks);
            }
            else {
                self.$storage.cachedNewTasksList.push(tasks);
            }

            if (self.networkState === 'offline') {
                cordovaPlugins.showToast('אתה במצב לא מקוון, המשימה תשלח כשתתחבר לרשת', 2000);
            }
        }

        var removeAllTempTaskFromLocalStorage = function () {
            var allTasks = self.$storage.tasksList;
            for (var i = 0; i < allTasks.length; i++) {
                if (allTasks[i]._id.indexOf('tempId') !== -1) {
                    allTasks.splice(i,1);
                }
            }
        }

        var addTaskToCachedTasksToUpdateList = function (task) {
            if (self.$storage.cachedTasksToUpdateList === undefined) {
                self.$storage.cachedTasksToUpdateList = [];
            }

            self.$storage.cachedTasksToUpdateList.push(task);

            if (self.networkState === 'offline') {
                cordovaPlugins.showToast('אתה במצב לא מקוון, המשימה תתעדכן כשתתחבר לרשת', 2000);
            }
        }

        var addCommentToCachedNewCommentsList = function (taskId, comment, userIdToNotify) {
            if (self.$storage.cachedNewCommentsList === undefined) {
                self.$storage.cachedNewCommentsList = [];
            }

            self.$storage.cachedNewCommentsList.push({ taskId: taskId, comment: comment, userIdToNotify: userIdToNotify });

            if (self.networkState === 'offline') {
                cordovaPlugins.showToast('אתה במצב לא מקוון, התגובה תשלח כשתתחבר לרשת', 2000);
            }
        }

        var markCommentsAsOnline = function (comments) {
            for (var i = 0; i < comments.length; i++) {
                comments[i].comment.offlineMode = false;
            }
        }

        document.addEventListener("deviceready", function () {
            // listen for Online event
            $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
                goOnline();
                self.networkState = 'online';
            });

            // listen for Offline event
            $rootScope.$on('$cordovaNetwork:offline', function (event, networkState) {
                self.networkState = 'offline';
            })
        }, false);


        var service = {
            goOnline: goOnline,
            addTasksToCachedNewTasksList: addTasksToCachedNewTasksList,
            addTaskToCachedTasksToUpdateList: addTaskToCachedTasksToUpdateList,
            addCommentToCachedNewCommentsList: addCommentToCachedNewCommentsList
        };

        return service;
    }
})();