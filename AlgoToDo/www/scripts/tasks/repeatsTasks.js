(function () {
    'use strict';
     
    angular
        .module('app.tasks')
        .controller('repeatsTasksCtrl', repeatsTasksCtrl);

    repeatsTasksCtrl.$inject = ['$rootScope', '$scope', 'logger', '$q', 'storage',
                                'datacontext', 'moment', 'device', '$mdDialog',
                                'DAL', '$offlineHandler', '$location'
    ];

    function repeatsTasksCtrl($rootScope, $scope, logger, $q, storage,
                        datacontext, moment, device, $mdDialog,
                        DAL, $offlineHandler, $location) {

        var vm = this;

        angular.element(document.querySelectorAll('html')).removeClass("hight-auto");
        document.getElementById('Cube_loadder').style.display = "none";

        vm.repeatsTasks = function () {
            return datacontext.getRepeatsTasksList();
        }

        vm.getRepeatedTime = function (task) {

            var daysRepeat = task.daysRepeat.sort();

            var days = '';
            var time = moment(task.startTime).format("LT");

            if (daysRepeat.length === 7) {
                return 'כל יום ב ' + time;
            }
            if (daysRepeat.length === 1) {
                return 'כל יום ' + moment().weekday(daysRepeat[0]).format("dddd") + ' ב ' + time;
            }

            for (var i = 0; i < daysRepeat.length; i++) {
                days += moment().weekday(daysRepeat[i]).format("dd") + ',';
            }
            days = 'ימים ' + days.slice(0, -1);

            return days + ' ב ' + time;
        }

        vm.descriptionTextLength = function () { return Math.floor((window.innerWidth - 70 - 16 - 40 - 16 - 8) / 4) };

        vm.goBack = function () {
            $location.path('/');
        }

        vm.showAdd = function (ev) {
            vm.isDialogOpen = true;
            $mdDialog.show({
                controller: 'repeatsTaskDialog',
                controllerAs: 'vm',
                templateUrl: 'scripts/widgets/repeatsTaskDialog.html',
                targetEvent: ev,
                fullscreen: true
            }).then(function () {
                vm.isDialogOpen = false;
            });

            document.addEventListener("deviceready", function () {
                document.addEventListener("backbutton", backbuttonClick_FromAddTask_Callback, false);
            }, false);
        };

    }

})();
