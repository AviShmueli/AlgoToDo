(function () {
    'use strict';

    angular
        .module('app.tasks')
        .controller('taskCtrl', taskCtrl);

    taskCtrl.$inject = [
        '$rootScope', '$scope', 'logger', '$location', 'cordovaPlugins',
        'appConfig', '$mdMedia', '$mdBottomSheet', '$filter',
        '$mdSidenav', '$mdDialog', 'datacontext', 'lodash',
        'socket', '$mdToast', 'moment', '$q', '$routeParams'
    ];

    function taskCtrl($rootScope, $scope, logger, $location, cordovaPlugins,
                            appConfig, $mdMedia, $mdBottomSheet, $filter,
                            $mdSidenav, $mdDialog, datacontext, lodash,
                            socket, $mdToast, moment, $q, $routeParams) {

        var vm = this;

        vm.taskId = $routeParams.taskId;
        vm.task = datacontext.getTaskByTaskId(vm.taskId);
        vm.user = datacontext.getUserFromLocalStorage();
    }

})();