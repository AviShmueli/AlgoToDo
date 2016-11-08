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
        vm.task = {};

        vm.appDomain = appConfig.appDomain;
        vm.selectedItem = null;
        vm.searchText = null;
        vm.querySearch = querySearch;

        function querySearch(query) {
            /*var matchesUsersFromCache = [];

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
            }*/

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
            vm.task = {};
            $mdDialog.cancel();
        };
        vm.save = function () {
            vm.task.to = vm.selectedItem;
            $mdDialog.hide(vm.task);
            // clean the form
            vm.task = {};
        };
    }

})();