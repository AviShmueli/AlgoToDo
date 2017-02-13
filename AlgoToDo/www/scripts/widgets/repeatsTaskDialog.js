(function () {
    'use strict';

    angular
        .module('app.widgets')
        .controller('repeatsTaskDialog', repeatsTaskDialog);

    function repeatsTaskDialog($scope, taskToEdit, updateList, $mdDialog, datacontext, $mdMedia, $q, logger,
                                     cordovaPlugins, storage, dropbox, camera, device, DAL,
                                     $offlineHandler) {

        var vm = this;
        
        vm.isSmallScrean = $mdMedia('sm');
        
        vm.user = datacontext.getUserFromLocalStorage();
        vm.imagesPath = device.getImagesPath();
        vm.selectedItem = null;
        vm.searchText = null;
        vm.querySearch = querySearch;        
        vm.showNoRecipientsSelectedError = false;
        vm.submitInProcess = false;
        vm.isEditMode = false;

        if (!angular.equals({},taskToEdit)) {
            vm.isEditMode = true;
            vm.task = taskToEdit;
            vm.task.startTime = new Date(vm.task.startTime);
        } else {
            vm.task = {};
            vm.task.to = [];
            vm.task.daysRepeat = [];
        }

        
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
                    usersList[i]['avatarFullUrl'] = vm.imagesPath + usersList[i].avatarUrl;
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
        };

        vm.save = function () {
            if (vm.submitInProcess === false) {
                vm.submitInProcess = true;
                if (vm.task.to.length > 0 && vm.task.daysRepeat.length > 0) {

                    vm.task.from = { '_id': vm.user._id, 'name': vm.user.name, 'avatarUrl': vm.user.avatarUrl };
                    vm.task.cliqaId = vm.user.cliqot[0]._id;
                    vm.task.creatorId = vm.user._id;

                    saveNewTask(vm.task);
                }
                else {
                    vm.showNoRecipientsSelectedError = (vm.task.to.length === 0);
                    vm.showNoDaysSelectedError = (vm.task.daysRepeat.length === 0);
                    vm.submitInProcess = false;
                } 
            }
        };

        var saveNewTask = function (task) {
            if (vm.isEditMode) {
                DAL.updateRepeatsTasks([task]).then(function (response) {
                    datacontext.replaceRepeatsTasks([task]);
                    $mdDialog.hide();
                }, function (error) {
                    if (error.status === -1) {
                        error.data = "App lost connection to the server";
                    }
                    logger.error('Error while trying to add new repeats task: ', error.data || error);
                    $offlineHandler.addTasksToCachedUpdateRepeatsTasksList(task);

                    datacontext.replaceRepeatsTasks([task]);
                    $mdDialog.hide();
                });
            }
            else {
                DAL.addNewRepeatsTasks(task).then(function (response) {

                    datacontext.addTasksToRepeatsTasksList(response.data);
                    $mdDialog.hide();

                }, function (error) {
                    if (error.status === -1) {
                        error.data = "App lost connection to the server";
                    }
                    logger.error('Error while trying to add new repeats task: ', error.data || error);
                    $offlineHandler.addTasksToCachedNewRepeatsTasksList(task);

                    datacontext.addTasksToRepeatsTasksList([task]);
                    $mdDialog.hide();
                });
            }     
        };
        
        vm.addDay = function (key) {
            var index = vm.task.daysRepeat.indexOf(key);
            if (index === -1) {
                vm.task.daysRepeat.push(key);
            }
            else {
                vm.task.daysRepeat.splice(index, 1);
            }
        }

        vm.deleteTask = function (ev) {
            var confirm = $mdDialog.confirm()
                 .title('למחוק את המישמה לצמיתות?')
                 .textContent('המשימה לא תשלח יותר, באפשרותך יהיה ליצור משימה חוזרת חדשה.')
                 .ariaLabel('delete')
                 .parent(angular.element(document.querySelector('#deleteRepeatsTaskContainer')))
                 .targetEvent(ev)
                 .ok('כן, מחק')
                 .cancel('לא, אל תמחק');

            $mdDialog.show(confirm).then(function () {
                // delete task
                DAL.deleteRepeatsTasks([vm.task]).then(function (result) {
                    datacontext.deleteRepeatsTask(vm.task._id);
                    updateList();
                }, function (error) {
                    if (error.status === -1) {
                        error.data = "App lost connection to the server";
                    }
                    logger.error('Error while trying to delete repeats task: ', error.data || error);
                    $offlineHandler.addTasksToCachedDeleteRepeatsTasksList(vm.task);
                    datacontext.deleteRepeatsTask(vm.task._id);
                    updateList();
                });
            }, function () {
                // do nothing
            });
        }
    }

})();