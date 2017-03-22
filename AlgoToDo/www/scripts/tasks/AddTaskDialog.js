(function () {
    'use strict';

    angular
        .module('app.tasks')
        .controller('AddTaskDialogController', AddTaskDialogController);

    /*AddTaskDialogController.$inject = [
        '$scope', '$mdDialog', 'datacontext', '$mdMedia', '$q', 'logger',
        'cordovaPlugins', 'storage', 'dropbox', 'camera', 'device', 'DAL',
        '$offlineHandler'
    ];*/

    function AddTaskDialogController($scope, imageURI, text, calledFromIntent, $mdDialog, datacontext, $mdMedia, $q, logger,
                                     cordovaPlugins, storage, dropbox, camera, device, DAL,
                                     $offlineHandler, $timeout) {

        var vm = this;
        
        vm.isSmallScrean = $mdMedia('sm');
        vm.task = {};
        vm.task.comments = [];
        vm.task.description = text || '';
        vm.user = datacontext.getUserFromLocalStorage();
        vm.imagesPath = device.getImagesPath();
        vm.selectedItem = null;
        vm.searchText = null;
        vm.querySearch = querySearch;
        vm.selectedRecipients = [];
        vm.showNoRecipientsSelectedError = false;
        vm.submitInProcess = false;
        vm.uploadingImage = false;
        vm.taskHasImage = false;
        vm.newImage = {};
        vm.emptyFileUrl = vm.imagesPath + '/images/upload-empty.png';
        vm.uplodingInProgress = false;
        
        function querySearch(query) {
            vm.showNoRecipientsSelectedError = false;
            
            var matchesUsersFromCache = [];

            // get all users stored in the cache
            var cachedUsers = datacontext.getAllCachedUsers();
            
            // search for match user
            //for (var user of cachedUsers) {
                //if (user.name.includes(query)) {
                    //matchesUsersFromCache.push(user);
                //}
            //}

            for (var i = 0; i < cachedUsers.length; i++) {
                if (cachedUsers[i].name.indexOf(query) !== -1) {
                    matchesUsersFromCache.push(cachedUsers[i]);
                }
                else {
                    if (cachedUsers[i].displayName !== undefined && cachedUsers[i].displayName.indexOf(query) !== -1) {
                        matchesUsersFromCache.push(cachedUsers[i]);
                    }
                }
            }
            
            // if found, return it
            if (matchesUsersFromCache.length > 0) {
                return matchesUsersFromCache;
            }
            
            // if no users found in the cache, search in DB
            var deferred = $q.defer();
            DAL.searchUsers(query).then(function (response) {
                var usersList = response.data;
                for (var i = 0; i < usersList.length; i++) {
                    usersList[i]['photo'] = vm.imagesPath + usersList[i].avatarUrl;
                    usersList[i]['displayName'] = usersList[i].name;
                }
                datacontext.addUsersToUsersCache(usersList);
                deferred.resolve(usersList);
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
            if (calledFromIntent) {
                navigator.app.exitApp();
            }
        };

        vm.save = function () {            
            if (vm.submitInProcess === false) {
                vm.submitInProcess = true;
                if (vm.selectedRecipients.length !== 0) {

                    $mdDialog.hide();
                    /*if (calledFromIntent) {
                        cordovaPlugins.minimizeApp();
                    }*/

                    vm.task.from = { '_id': vm.user._id, 'name': vm.user.name, 'avatarUrl': vm.user.avatarUrl };
                    vm.task.status = 'inProgress';                                       
                    vm.task.createTime = new Date();
                    vm.task.cliqaId = vm.user.cliqot[0]._id;

                    if (vm.selectedRecipients.length > 1) {
                        vm.task.type = 'group-sub';
                    }

                    if (vm.task.comments.length > 0) {
                        vm.task.comments[0].createTime = new Date();
                    }

                    var taskListToAdd = createTasksList(vm.task, vm.selectedRecipients);
                    var groupMainTask;

                    var isTaskFromMeToMe = (taskListToAdd.length === 1 && taskListToAdd[0].from._id === taskListToAdd[0].to._id);
                    if (vm.taskHasImage === true && !isTaskFromMeToMe) {
                        //cordovaPlugins.showToast("שולח, מעלה תמונה...", 100000);
                        var splitedPath = vm.newImage.nativeUrl.split('/');               
                        var fileName = splitedPath[splitedPath.length - 1];
                        var path = vm.newImage.nativeUrl.substring(0, vm.newImage.nativeUrl.indexOf(fileName));

                        vm.uplodingInProgress = true;
                        dropbox.uploadNewImageToDropbox(path, fileName, vm.newImage.fileName)
                            .then(function () {
                                vm.uplodingInProgress = false;
                                if (calledFromIntent) {
                                    navigator.app.exitApp();
                                }
                            }, function (error) {
                                if (error.status === -1) {
                                    error.data = "App lost connection to the server";
                                }
                                logger.error('Error while trying to upload image to Dropbox: ', error.data || error);
                                vm.uplodingInProgress = false;
                                $offlineHandler.addTasksToCachedImagesList(vm.newImage);
                            });
                    }

                    if (taskListToAdd.length > 1) {
                        groupMainTask = createGroupMainTask(vm.task, vm.selectedRecipients);
                        taskListToAdd.push(groupMainTask);
                    }

                    saveNewTask(taskListToAdd, groupMainTask);

                }
                else {
                    vm.showNoRecipientsSelectedError = true;
                    vm.submitInProcess = false;
                } 
            }
        };

        var saveNewTask = function (taskListToAdd, groupMainTask) {
            DAL.saveNewTasks(taskListToAdd).then(function (response) {
                logger.toast('המשימה נשלחה בהצלחה!', 700);
                logger.info('task/s added sucsessfuly', response.data);
                addTasksAndCloseDialog(response.data);
            }, function (error) {
                if (error.status === -1) {
                    error.data = "App lost connection to the server";
                }
                logger.error('Error while trying to add new task: ', error.data || error);               
                $offlineHandler.addTasksToCachedNewTasksList(taskListToAdd);
                markTaskAsOfflineMode(taskListToAdd, groupMainTask);
                addTasksAndCloseDialog(taskListToAdd);
            });
        };

        var addTasksAndCloseDialog = function (tasks) {
            datacontext.pushTasksToTasksList(tasks);
            var count = datacontext.setMyTaskCount();
            cordovaPlugins.setBadge(count);
            $mdDialog.hide();

            if (vm.taskHasImage === true) {
                logger.error("vm.newImage.nativeUrl", vm.newImage.nativeUrl);
                storage.saveFileToStorage(tasks[0]._id, vm.newImage.fileName, vm.newImage.nativeUrl).
                    then(function () {
                        camera.cleanupAfterPictureTaken();
                        window.plugins.toast.hide();
                        if (calledFromIntent && !vm.uplodingInProgress) {
                            navigator.app.exitApp();
                        }
                    },
                    function (error) {
                        logger.error("error while trying to save File to Storage", error);
                        if (calledFromIntent && !vm.uplodingInProgress) {
                            navigator.app.exitApp();
                        }
                    });
            }
            else {
                if (calledFromIntent && !vm.uplodingInProgress) {
                    navigator.app.exitApp();
                }
            }

            // clean the form
            vm.task = {};
            vm.submitInProcess = false;
        };

        var markTaskAsOfflineMode = function (tasks, groupMainTask) {
            if (groupMainTask !== undefined) {
                groupMainTask._id = 'tempId' + Math.floor(Math.random() * 90000) + 10000;
                groupMainTask.offlineMode = true;
            }
            for (var i = 0; i < tasks.length; i++) {
                tasks[i].offlineMode = true;
                if (groupMainTask !== undefined) {
                    if (tasks[i].type !== 'group-main') {
                        tasks[i]._id = 'tempId' + Math.floor(Math.random() * 90000) + 10000;
                        tasks[i].groupMainTaskId = groupMainTask._id;
                    }
                }
                else {
                    tasks[i]._id = 'tempId' + Math.floor(Math.random() * 90000) + 10000;
                }
            }
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
                        tempTask.type = 'group-sub';
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
    
        var createGroupMainTask = function (task, recipients) {
            var groupTask = angular.copy(task);
            groupTask.type = 'group-main';
            groupTask.to = recipients;
            return groupTask;
        };

        vm.takePic = function (sourceType) {
            vm.taskHasImage = true;
            vm.takeingPic = true;
            document.addEventListener("deviceready", function () {
                camera.takePicture(sourceType).then(function (fileUrl) {

                    handelNewImage(fileUrl);

                }, function (err) {
                    vm.taskHasImage = false;
                    vm.takeingPic = false;
                    logger.error("error while trying to take a picture", err);
                });
                device.setStatusbarOverlays();
            }, false);
        };

        var handelNewImage = function (fileUrl) {

            var image = document.getElementById('new-task-image');
            image.src = fileUrl;

            window.resolveLocalFileSystemURL(fileUrl, function success(fileEntry) {

                vm.takeingPic = false;

                var fileName = new Date().toISOString().replace(/:/g, "_") + '.jpg';

                if (JSON.stringify(fileEntry.filesystem).indexOf('sdcard') !== -1) {
                    vm.newImage.nativeUrl = 'file:///sdcard' + fileEntry.fullPath;
                }
                else {
                    vm.newImage.nativeUrl = fileEntry.nativeURL;
                }
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
        };

        if (imageURI !== undefined && imageURI !== '') {
            $timeout(function () {
                vm.taskHasImage = true;
                vm.takeingPic = true;
                handelNewImage(imageURI);
            }, 100);
        }
    }

})();