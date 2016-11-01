(function () {
    'use strict';

    angular
        .module('TaskManeger.widgets')
        .controller('AddTaskDialogController', AddTaskDialogController);

    AddTaskDialogController.$inject = [
        '$scope', '$mdDialog', 'datacontext', '$mdMedia', '$q', 'logger', 'appConfig'
    ];

    function AddTaskDialogController($scope, $mdDialog, datacontext, $mdMedia, $q, logger, appConfig) {

        var vm = this;

        vm.isSmallScrean = $mdMedia('sm');
        vm.task = datacontext.getNewTask();

        vm.appDomain = appConfig.appDomain;
        vm.selectedItem = null;
        vm.searchText = null;
        vm.querySearch = querySearch;
        vm.users = [{ fullName: 'אבי', name: 'אבי', userAvater: '/dsa/dsa/dsa.png' },
                    { fullName: 'דינה', name: 'דינה', userAvater: '/dsa/dsa/dsa.png' },
                    { fullName: 'רעיה', name: 'רעיה', userAvater: '/dsa/dsa/dsa.png' },
                    { fullName: 'אריאל', name: 'אריאל', userAvater: '/dsa/dsa/dsa.png' }];//datacontext.getAllUsersFroLocalStorage();

        function querySearch(query) {
            var matchesUsersFromCache = [];

            // get all users stored in the cache
            var cachedUsers = datacontext.getAllCachedUsers().values();

            // search for match user
            for (var user of cachedUsers) {
                if (user.name.includes(query)) {
                    matchesUsersFromCache.push(user);
                }
            }

            // if found, return it
            if (matchesUsersFromCache.length > 0) {
                return matchesUsersFromCache;
            }

            // if no users found in the cache, search in DB
            var deferred = $q.defer();
            datacontext.searchUsers(query).then(function (response) {
                logger.success("search result: ", response.data);
                datacontext.addUsersToUsersCache(response.data);
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
            datacontext.resetNewTask();
            $mdDialog.cancel();
        };
        vm.save = function () {
            vm.task.to = vm.selectedItem.name;
            vm.task.from = datacontext.getUserFromLocalStorage().name;
            vm.task.status = 'inProgress';
            vm.task.createTime = new Date();
            datacontext.saveNewTask(vm.task);
            $mdDialog.hide('ok');
        };
    }

})();