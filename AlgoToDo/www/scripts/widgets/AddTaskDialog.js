﻿(function () {
    'use strict';

    angular
        .module('app.widgets')
        .controller('AddTaskDialogController', AddTaskDialogController);

    AddTaskDialogController.$inject = [
        '$scope', '$mdDialog', 'datacontext', '$mdMedia', '$q', 'logger',
        'cordovaPlugins', 'storage', 'dropbox'
    ];

    function AddTaskDialogController($scope, $mdDialog, datacontext, $mdMedia, $q, logger,
             cordovaPlugins, storage, dropbox) {

        var vm = this;
        
        vm.isSmallScrean = $mdMedia('sm');
        vm.task = {};
        vm.task.comments = [];
        vm.user = datacontext.getUserFromLocalStorage();
        vm.imagesPath = cordovaPlugins.getImagesPath();
        vm.selectedItem = null;
        vm.searchText = null;
        vm.querySearch = querySearch;
        vm.selectedRecipients = [];
        vm.showNoRecipientsSelectedError = false;
        vm.submitInProcess = false;
        vm.uploadingImage = false;
        vm.taskHasImage = false;
        vm.newImage = {};
        
        function querySearch(query) {
            vm.showNoRecipientsSelectedError = false;
            /*
            var matchesUsersFromCache = [];

            // get all users stored in the cache
            var cachedUsers = datacontext.getAllCachedUsers().values();
            
            // search for match user
            //for (var user of cachedUsers) {
                //if (user.name.includes(query)) {
                    //matchesUsersFromCache.push(user);
                //}
            //}

            for (i = 0; i < cachedUsers.length; i++) {
                if (cachedUsers[i].name.includes(query)) {
                    matchesUsersFromCache.push(cachedUsers[i]);
                }
            }
            
            // if found, return it
            if (matchesUsersFromCache.length > 0) {
                return matchesUsersFromCache;
            }
            */
            // if no users found in the cache, search in DB
            var deferred = $q.defer();
            datacontext.searchUsers(query).then(function (response) {
                logger.success("search result: ", response.data);
                //datacontext.addUsersToUsersCache(response.data);
                angular.forEach(response.data, function (user) {
                    user['avatarFullUrl'] = vm.imagesPath + user.avatarUrl;
                });
                deferred.resolve(response.data);
            });
            return deferred.promise;
        }
        
        function createFilterFor(query) {
            var lowercaseQuery = angular.lowercase(query);

            return function filterFn(user) {
                return (user.fullName.indexOf(lowercaseQuery) === 0);
            };
        }
        
        vm.hide = function () {
            $mdDialog.hide();
        };
        vm.cancel = function () {
            vm.task = {};
            $mdDialog.cancel();
        };
        vm.save = function () {
            if (vm.submitInProcess === false) {
                vm.submitInProcess = true;
                if (vm.selectedRecipients.length !== 0) {

                    vm.task.from = { '_id': vm.user._id, 'name': vm.user.name, 'avatarUrl': vm.user.avatarUrl };
                    vm.task.status = 'inProgress';
                    vm.task.createTime = new Date();                    

                    if (vm.task.comments.length > 0) {
                        vm.task.comments[0].createTime = new Date();
                    }

                    var taskListToAdd = createTasksList(vm.task, vm.selectedRecipients);

                    if (vm.taskHasImage === true) {
                        dropbox.uploadNewImageToDropbox(vm.newImage.fileEntry.filesystem.root.nativeURL, vm.newImage.fileEntry.name, vm.newImage.fileName).then(function () {
                            saveNewTask(taskListToAdd);
                        });
                    }
                    else {
                        saveNewTask(taskListToAdd);                       
                    }
                }
                else {
                    vm.showNoRecipientsSelectedError = true;
                    vm.submitInProcess = false;
                } 
            }
        };

        var saveNewTask = function (taskListToAdd) {
            datacontext.saveNewTasks(taskListToAdd).then(function (response) {
                logger.toast('המשימה נשלחה בהצלחה!', response.data, 2000);
                logger.info('task added sucsessfuly', response.data);
                datacontext.pushTasksToTasksList(response.data);
                var count = datacontext.setMyTaskCount();
                cordovaPlugins.setBadge(count);
                $mdDialog.hide();

                if (vm.taskHasImage === true) {
                    storage.saveFileToStorage(response.data[0]._id, vm.newImage.fileName, vm.newImage.fileEntry.nativeURL).
                        then(function () { 
                            cordovaPlugins.cleanupAfterPictureTaken();
                        },
                        function (error) {
                        logger.error("error while trying to save File to Storage", error);
                    });
                }

                // clean the form
                vm.task = {};
                vm.submitInProcess = false;
            }, function (error) {
                logger.error('Error while tring to add new task ', error);
            });
        };

        var createTasksList = function (task, recipients) {
            var listToReturn = [];
            var tempTask;
            angular.forEach(recipients, function (value, key) {
                // if the user select group, 
                // loop over the users in the group and create for each user his task
                if (value.type === 'group') {
                    angular.forEach(value.usersInGroup, function (userInGroup, key) {
                        tempTask = angular.copy(task);
                        tempTask.to = { 'name': userInGroup.name, '_id': userInGroup._id, 'avatarUrl': userInGroup.avatarUrl };
                        listToReturn.push(tempTask);
                    });
                }
                else {
                    tempTask = angular.copy(task);
                    tempTask.to = { 'name': value.name, '_id': value._id, 'avatarUrl': value.avatarUrl };
                    listToReturn.push(tempTask);
                }
            });
            return listToReturn;
        };     

        vm.takePic = function (sourceType) {

            document.addEventListener("deviceready", function () {
                cordovaPlugins.takePicture(sourceType).then(function (fileUrl) {

                    var image = document.getElementById('new-task-image');
                    image.src = fileUrl;

                    window.resolveLocalFileSystemURL(fileUrl, function success(fileEntry) {
                        vm.taskHasImage = true;

                        var fileName = new Date().toISOString() + '.jpg';

                        vm.newImage.fileEntry = fileEntry
                        vm.newImage.fileName = fileName;

                        var comment = {
                            from: {
                                name: vm.user.name,
                                _id: vm.user._id,
                                avatarUrl: vm.user.avatarUrl
                            },
                            text: '',
                            fileName: fileName
                        };

                        vm.task.comments.push(comment);                   
                    });
                }, function (err) {
                    logger.error("error while trying to take a picture", err);
                });
            }, false);
        }
    }

})();