(function () {
    'use strict';

    angular
        .module('app.tasks')
        .controller('repeatsTasksCtrl', repeatsTasksCtrl);

    repeatsTasksCtrl.$inject = ['$rootScope', '$scope', 'logger', '$q', 'storage',
                                'datacontext', 'moment', 'device', '$mdDialog',
                                'DAL', '$offlineHandler', '$location', 'cordovaPlugins'
    ];

    function repeatsTasksCtrl($rootScope, $scope, logger, $q, storage,
                        datacontext, moment, device, $mdDialog,
                        DAL, $offlineHandler, $location, cordovaPlugins) {

        var vm = this;
        vm.imagesPath = device.getImagesPath();
        vm.isDialogOpen = false;
        vm.user = datacontext.getUserFromLocalStorage();
        vm.repeatsTasks = datacontext.getRepeatsTasksList();

        angular.element(document.querySelectorAll('html')).removeClass("hight-auto");

        DAL.getUsersRepeatsTasks(vm.user._id).then(function (response) {
            vm.repeatsTasks = response.data;
            datacontext.setRepeatsTasksList(response.data);
        });      

        vm.getRepeatedTime = function (task) {

            var daysRepeat = task.daysRepeat.sort();

            var days = '';
            var time = moment(task.startTime).format("LT");

            if (daysRepeat.length === 7) {
                return 'כל יום בשעה ' + time;
            }
            if (daysRepeat.length === 1) {
                return 'כל יום ' + moment().weekday(daysRepeat[0]).format("dddd") + ' בשעה ' + time;
            }
            var isConsecutive = false;
            for (var i = 0; i < daysRepeat.length; i++) {
                days += moment().weekday(daysRepeat[i]).format("dd") + ',';
                isConsecutive = (daysRepeat[i + 1] !== undefined && parseInt(daysRepeat[i]) + 1 === parseInt(daysRepeat[i + 1])) ? true : (daysRepeat[i + 1] === undefined && isConsecutive) ? true : false;
            }
            if (isConsecutive && daysRepeat.length > 2) {
                days = 'ימים ' + moment().weekday(daysRepeat[0]).format("dd") + '-' + moment().weekday(daysRepeat[daysRepeat.length - 1]).format("dd");
            }
            else {
                days = 'ימים ' + days.slice(0, -1);
            }

            return days + ' בשעה ' + time;
        };

        vm.descriptionTextLength = function () { return Math.floor((window.innerWidth - 70 - 16 - 40 - 16 - 8) / 4); };

        vm.goBack = function () {
            $location.path('/tasksList');
        };

        vm.editTask = function (task, ev) {
            vm.isDialogOpen = true;
            $mdDialog.show({
                controller: 'repeatsTaskDialog',
                controllerAs: 'vm',
                templateUrl: 'scripts/tasks/repeatsTaskDialog.html',
                targetEvent: ev,
                fullscreen: true,
                locals: {
                    taskToEdit: task,
                    updateList: vm.updateList
                }
            }).then(function () {
                vm.isDialogOpen = false;
                vm.repeatsTasks = datacontext.getRepeatsTasksList();
            });

            document.addEventListener("deviceready", function () {
                document.addEventListener("backbutton", backbuttonClick_FromAddRepeatTask_Callback, false);
            }, false);
        };

        vm.updateList = function () {
            vm.repeatsTasks = datacontext.getRepeatsTasksList();
        };

        vm.showAdd = function (ev) {
            vm.isDialogOpen = true;
            $mdDialog.show({
                controller: 'repeatsTaskDialog',
                controllerAs: 'vm',
                templateUrl: 'scripts/tasks/repeatsTaskDialog.html',
                targetEvent: ev,
                fullscreen: true,
                locals: {
                    taskToEdit: {},
                    updateList: function () { }
                }
            }).then(function () {
                vm.isDialogOpen = false;
                vm.repeatsTasks = datacontext.getRepeatsTasksList();
            });

            document.addEventListener("deviceready", function () {
                document.addEventListener("backbutton", backbuttonClick_FromAddRepeatTask_Callback, false);
            }, false);
        };

        var backbuttonClick_FromAddRepeatTask_Callback = function (e) {
            e.preventDefault();
            $mdDialog.cancel();
            vm.isDialogOpen = false;
            document.removeEventListener("backbutton", backbuttonClick_FromAddRepeatTask_Callback, false);
        };

        var backbuttonClick_allways_Callback1 = function (e) {
            if (vm.isDialogOpen) {
                e.preventDefault();
                return;
                // do nothing - dialog will be closed
            }
            if ($location.path() === '/tasksList') {
                e.preventDefault();
                if (!vm.exitApp) {
                    vm.exitApp = true;
                    cordovaPlugins.showToast("הקש שוב ליציאה", 1000);
                    $timeout(function () { vm.exitApp = false; }, 1000);
                } else {
                    navigator.app.exitApp();
                }
            }
            else {
                window.history.back();
            }
        };

        document.addEventListener("deviceready", function () {
            document.addEventListener("backbutton", backbuttonClick_allways_Callback1, false);
        }, false);

    }

})();
