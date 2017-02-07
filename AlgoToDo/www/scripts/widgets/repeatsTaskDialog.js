(function () {
    'use strict';

    angular
        .module('app.widgets')
        .controller('repeatsTaskDialog', repeatsTaskDialog);

    repeatsTaskDialog.$inject = [
        '$scope', '$mdDialog', 'datacontext', '$mdMedia', '$q', 'logger',
        'cordovaPlugins', 'storage', 'dropbox', 'camera', 'device', 'DAL',
        '$offlineHandler'
    ];

    function repeatsTaskDialog($scope, $mdDialog, datacontext, $mdMedia, $q, logger,
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

        vm.task = {};
        vm.task.to = [];
        vm.task.daysRepeat = [];
        
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
                if (vm.task.to.length !== 0) {

                    vm.task.from = { '_id': vm.user._id, 'name': vm.user.name, 'avatarUrl': vm.user.avatarUrl };
                    vm.task.cliqaId = vm.user.cliqot[0]._id;
                    vm.task.creatorId = vm.user._id;

                    saveNewTask(vm.task);
                }
                else {
                    vm.showNoRecipientsSelectedError = true;
                    vm.submitInProcess = false;
                } 
            }
        };

        var saveNewTask = function (task) {
            DAL.addNewRepeatsTasks(task).then(function (response) {
                addTaskAndCloseDialog(response.data.ops);
            }, function (error) {
                if (error.status === -1) {
                    error.data = "App lost connection to the server";
                }
                logger.error('Error while trying to add new repeats task: ', error.data || error);               
                $offlineHandler.addTasksToCachedNewRepeatsTasksList(task);
                addTaskAndCloseDialog([task]);
            });
        };

        var addTaskAndCloseDialog = function (tasks) {
            datacontext.addTasksToRepeatsTasksList(tasks);

            $mdDialog.hide();

            // clean the form
            vm.task = {};
            vm.submitInProcess = false;
        }
        
        vm.addDay = function (key) {
            var index = vm.task.daysRepeat.indexOf(key);
            if (index === -1) {
                vm.task.daysRepeat.push(key);
            }
            else {
                delete vm.task.daysRepeat[index];
            }
        }
    }

})();