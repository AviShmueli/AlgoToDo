(function () {
    'use strict';

    angular
        .module('app.tasks')
        .controller('groupTaskCtrl', groupTaskCtrl);

    groupTaskCtrl.$inject = ['$rootScope', '$scope', 'logger', '$q', 'storage',
         'datacontext', '$routeParams', '$window', 'moment',
         'cordovaPlugins', 'dropbox', 'appConfig',
         'localNotifications', 'camera', 'device', '$filter',
         'DAL', '$offlineHandler', '$location', '$timeout'
    ];

    function groupTaskCtrl($rootScope, $scope, logger, $q, storage,
                      datacontext, $routeParams, $window, moment,
                      cordovaPlugins, dropbox, appConfig,
                      localNotifications, camera, device, $filter,
                      DAL, $offlineHandler, $location, $timeout) {

        angular.element(document.querySelectorAll('html')).removeClass("hight-auto");

        var vm = this;

        vm.taskId = $routeParams.taskId.split('&')[0];
        vm.task = datacontext.getTaskByTaskId(vm.taskId);
        vm.user = datacontext.getUserFromLocalStorage();
        vm.imagesPath = device.getImagesPath();

        vm.goBack = function () {
            $location.path('/tasksList');
        };

        vm.navigateToTaskPage = function (task) {
            $location.path('/task/' + task._id);
        };

        vm.getTotalTaskTime = function (task) {
            if (task === null || task === undefined) {
                return '';
            }
            var end = new Date(task.doneTime);
            var start = new Date(task.createTime);
            var totalInMillisconds = end.getTime() - start.getTime();
            var totalTime = moment.duration(totalInMillisconds);
            return moment.duration(totalInMillisconds).humanize();
        };

        vm.doneTasksLength = 0;
        vm.subsTasks_done = function () {
            var toReturn = $filter('groupTasks_done')(datacontext.getTaskList(), vm.task._id);
            vm.doneTasksLength = toReturn.length;
            return toReturn
        }

        vm.inProgressTasksLength = 0;
        vm.subsTasks_inProgress = function () {
            var toReturn = $filter('groupTasks_inProgress')(datacontext.getTaskList(), vm.task._id);
            vm.inProgressTasksLength = toReturn.length;
            return toReturn
        }
    }

})();
