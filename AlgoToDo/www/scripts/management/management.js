(function () {
    'use strict';

    angular
        .module('app.management')
        .controller('managementCtrl', managementCtrl);

    managementCtrl.$inject = ['$rootScope', '$scope', 'logger', '$q',
                             'datacontext', 'moment'
    ];

    function managementCtrl($rootScope, $scope, logger, $q,
                      datacontext, moment) {

        var vm = this;

        angular.element(document.querySelectorAll('html')).removeClass("hight-auto");
        document.getElementById('canvas_loadder').style.display = "none";
        document.getElementById('Cube_loadder').style.display = "none";

        vm.selected = [];
        vm.totalTaskCount = 0;
        vm.query = {
            order: 'createTime',
            limit: 5,
            page: 1
        };
        vm.filter = {};
        vm.tasks = [];
        vm.allCliqot = {};

        vm.user = datacontext.getUserFromLocalStorage();

        var userCliqotIds = [];
        vm.allCliqot['all'] = { name: 'כל הקליקות', '_id': { $in: userCliqotIds } };
        for (var i = 0; i < vm.user.cliqot.length; i++) {
            vm.allCliqot[vm.user.cliqot[i]._id] = vm.user.cliqot[i];
            userCliqotIds.push(vm.user.cliqot[i]._id);
        }
        // { "$exists" : false } - to get the task that dont contains cliqaId filed

        // always filer the table according to admin's cliqot!
        vm.filter.cliqaId = { $in: userCliqotIds };

        vm.getTasks = function () {

            for (var property in vm.filter) {
                if (vm.filter.hasOwnProperty(property)) {
                    if (property === 'cliqaId' && typeof vm.filter[property] !== 'object' && vm.filter[property].indexOf('$in') !== -1) {
                        vm.filter[property] = JSON.parse(vm.filter[property]);
                    }
                    if (property === 'status' && vm.filter[property] == '') {
                        delete vm.filter[property];
                    }
                }
            }

            datacontext.getAllTasksCount(vm.filter).then(function (response) {
                vm.totalTaskCount = response.data;
            });

            var deferred = $q.defer();
            vm.promise = deferred.promise;
            datacontext.getAllTasks(vm.query, vm.filter).then(function (tasks) {
                vm.tasks = tasks.data;
                deferred.resolve();
            });
        };

        vm.getTasks();

        vm.getTotalTaskTime = function (task) {
            if (task.doneTime === undefined) {
                return '';
            }
            var end = new Date(task.doneTime);
            var start = new Date(task.createTime);
            var totalInMillisconds = end.getTime() - start.getTime();
            var totalTime = moment.duration(totalInMillisconds);
            return moment.duration(totalInMillisconds).humanize();
        };

        vm.getCliqaName = function (cliqaId) {
            return vm.allCliqot[cliqaId] !== undefined ? vm.allCliqot[cliqaId].name : '';
        }

        vm.filterTable = function () {
            for (var property in vm.filter) {
                if (vm.filter.hasOwnProperty(property)) {
                    if (property === 'cliqaId' && typeof vm.filter[property] !== 'object' && vm.filter[property].indexOf('$in') !== -1) {
                        vm.filter[property] = JSON.parse(vm.filter[property]);
                    }
                }
            }
            vm.getTasks();
        }
    }

})();
