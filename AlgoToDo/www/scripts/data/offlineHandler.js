(function() {
    'use strict';

    angular
        .module('app.data')
        .service('$offlineHandler', offlineHandler);

    offlineHandler.$inject = ['$http', 'logger', 'lodash', 'appConfig', '$rootScope',
                              '$localStorage', '$q', 'DAL', 'datacontext', '$cordovaNetwork'];

    function offlineHandler($http, logger, lodash, appConfig, $rootScope,
                            $localStorage, $q, DAL, datacontext, $cordovaNetwork) {

        
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
        }

        var removeAllTempTaskFromLocalStorage = function () {
            var allTasks = self.$storage.tasksList;
            for (var i = 0; i < allTasks.length; i++) {
                if (allTasks[i] === undefined) {
                    var a = i;
                }
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
        }

        document.addEventListener("deviceready", function () {

            /*var type = $cordovaNetwork.getNetwork();
            
            var isOnline = $cordovaNetwork.isOnline();

            var isOffline = $cordovaNetwork.isOffline();*/


            // listen for Online event
            $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
                goOnline();
            });

            // listen for Offline event
            /*$rootScope.$on('$cordovaNetwork:offline', function (event, networkState) {
                var offlineState = networkState;
                alert("offline");
            })*/

        }, false);


        var service = {
            goOnline: goOnline,
            addTasksToCachedNewTasksList: addTasksToCachedNewTasksList,
            addTaskToCachedTasksToUpdateList: addTaskToCachedTasksToUpdateList
        };

        return service;
    }
})();