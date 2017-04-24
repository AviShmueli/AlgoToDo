(function () {
    'use strict';

    angular
        .module('app.contacts')
        .controller('addGroupDialogCtrl', addGroupDialogCtrl);

    function addGroupDialogCtrl($scope, contact, updateList, $mdDialog, datacontext, $mdMedia, $q, logger,
                                     device, DAL, $offlineHandler, $timeout) {

        var vm = this;

        vm.isSmallScrean = $mdMedia('sm');
        vm.imagesPath = device.getImagesPath();
        vm.isEditMode = false;
        vm.group = {};
        if (contact !== null) {
            vm.group = contact;
            vm.selectedRecipients = angular.copy(vm.group.usersInGroup);
            datacontext.replaceUsersAvatarUrlWithLocalPath(vm.selectedRecipients);
            vm.isEditMode = true;
        }
        else {
            vm.group.name = "";
            vm.selectedRecipients = [];
        }

        vm.user = datacontext.getUserFromLocalStorage();
        vm.selectedItem = null;
        vm.searchText = null;
        vm.querySearch = querySearch;

        vm.showNoRecipientsSelectedError = false;
        vm.submitInProcess = false;
        

        function querySearch(query) {
            vm.showNoRecipientsSelectedError = false;

            var matchesUsersFromCache = [];

            // get all users stored in the cache
            var cachedUsers = datacontext.getAllCachedUsers();

            for (var i = 0; i < cachedUsers.length; i++) {
                if (cachedUsers[i].name.indexOf(query) !== -1) {
                    if (cachedUsers[i]['avatarUrl'].indexOf('file:') === -1) {
                        cachedUsers[i]['avatarUrl'] = vm.imagesPath + cachedUsers[i].avatarUrl;
                    } 
                    matchesUsersFromCache.push(cachedUsers[i]);
                }
            }

            // if found, return it
            if (matchesUsersFromCache.length > 0) {
                return matchesUsersFromCache;
            }

            // if no users found in the cache, search in DB
            var deferred = $q.defer();
            DAL.searchUsers(query, vm.user).then(function (response) {
                var usersList = response.data;
                for (var i = 0; i < usersList.length; i++) {
                    usersList[i]['avatarUrl'] = vm.imagesPath + usersList[i].avatarUrl;
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
            vm.group = {};
            $mdDialog.cancel();
        };

        vm.save = function () {
            if (vm.submitInProcess === false) {
                vm.submitInProcess = true;
                if (vm.selectedRecipients.length > 1) {

                    $mdDialog.hide();

                    vm.group.avatarUrl = "/images/group-1.svg",
                    vm.group.creatorId = vm.user._id;
                    vm.group.cliqaId = vm.user.cliqot[0]._id;
                    vm.group.usersInGroup = vm.selectedRecipients;

                    saveNewGroup(vm.group);
                }
                else {
                    vm.showNoRecipientsSelectedError = true;
                    vm.submitInProcess = false;
                }
            }
        };

        var saveNewGroup = function (group) {
            DAL.addNewGroup(group).then(function (response) {
                var sucsessText = vm.isEditMode ? 'הקבוצה עודכנה בהצלחה!' : 'הקבוצה נוצרה בהצלחה!';
                logger.toast(sucsessText, 700);
                logger.info('group added sucsessfuly', response.data);
                addGroupAndCloseDialog(response.data);
            }, function (error) {
                if (error.status === -1) {
                    error.data = "App lost connection to the server";
                }
                logger.error('Error while trying to add new group: ', error.data || error);
                //$offlineHandler.addGroupToCachedNewGroupsList(group);// todo: implement this
                addGroupAndCloseDialog(group);
            });
        };

        var addGroupAndCloseDialog = function (group) {
            datacontext.addUsersToUsersCache(group, false);

            // clean the form
            vm.group = {};
            vm.submitInProcess = false;
        };

        vm.deleteGroup = function (ev) {
            var confirm = $mdDialog.confirm()
                 .title('למחוק את הקבוצה ' + vm.group.name + ' לצמיתות?')
                 .ariaLabel('delete')
                 .parent(angular.element(document.querySelector('#deleteRepeatsTaskContainer')))
                 .targetEvent(ev)
                 .ok('כן, מחק')
                 .cancel('לא, אל תמחק');

            $mdDialog.show(confirm).then(function () {
                // delete task
                DAL.deleteGroups([vm.group._id]).then(function (result) {
                    datacontext.removeUsersFromUsersCache(vm.group._id);
                    updateList();
                }, function (error) {
                    if (error.status === -1) {
                        error.data = "App lost connection to the server";
                    }
                    logger.error('Error while trying to delete group: ', error.data || error);
                    //$offlineHandler.addTasksToCachedDeleteRepeatsTasksList(vm.task); // todo: implement this
                    datacontext.removeUsersFromUsersCache(vm.group._id);
                    updateList();
                });
            }, function () {
                // do nothing
            });
        }
    }

})();
