(function () {
    'use strict';

    angular
        .module('TaskManeger.widgets')
        .controller('AddTaskDialogController', AddTaskDialogController);

    AddTaskDialogController.$inject = [
        '$scope', '$mdDialog', 'datacontext', '$mdMedia'
    ];

    function AddTaskDialogController($scope, $mdDialog, datacontext, $mdMedia) {

        var vm = this;

        vm.isSmallScrean = $mdMedia('sm');
        vm.task = datacontext.getNewTask();

        vm.selectedItem = null;
        vm.searchText = null;
        vm.querySearch = querySearch;
        vm.users = [{ fullName: 'אבי', name: 'אבי', userAvater: '/dsa/dsa/dsa.png' },
                    { fullName: 'דינה', name: 'דינה', userAvater: '/dsa/dsa/dsa.png' },
                    { fullName: 'רעיה', name: 'רעיה', userAvater: '/dsa/dsa/dsa.png' },
                    { fullName: 'אריאל', name: 'אריאל', userAvater: '/dsa/dsa/dsa.png' }];//datacontext.getAllUsersFroLocalStorage();

        function querySearch(query) {
            var results = query ? vm.users.filter(createFilterFor(query)) : vm.users;
            /*var deferred = $q.defer();
            $timeout(function () { deferred.resolve(results); }, Math.random() * 1000, false);
            return deferred.promise;*/
            return results;
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