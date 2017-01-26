(function () {
    'use strict';

    angular
        .module('app.management')
        .controller('managementCtrl', managementCtrl);

    managementCtrl.$inject = ['$rootScope', '$scope', 'logger', '$q',
                             'datacontext', 'moment', '$mdMedia'
    ];

    function managementCtrl($rootScope, $scope, logger, $q,
                      datacontext, moment, $mdMedia) {

        var vm = this;

        angular.element(document.querySelectorAll('html')).removeClass("hight-auto");
        document.getElementById('canvas_loadder').style.display = "none";
        document.getElementById('Cube_loadder').style.display = "none";
        
        vm.selected = [];
        vm.totalTaskCount = 0;
        vm.query = {
            order: 'createTime',
            limit: 10,
            page: 1
        };
        vm.tasksFilter = {};
        vm.tasks = [];
        vm.allCliqot = {};
        vm.activeTab = 'tasks';
        vm.tasksFilterStatusInProgress = true;
        vm.tasksFilterStatusDone = true;
        //

        vm.user = datacontext.getUserFromLocalStorage();

        vm.allVersionInstalled = [];
        datacontext.getAllVersionInstalled().then(function (allVersions) {
            vm.allVersionInstalled = allVersions.data;
        });

        var userCliqotIds = [];
        vm.allCliqot['all'] = { name: 'כל הקליקות', '_id': { $in: userCliqotIds } };
        for (var i = 0; i < vm.user.cliqot.length; i++) {
            vm.allCliqot[vm.user.cliqot[i]._id] = vm.user.cliqot[i];
            userCliqotIds.push(vm.user.cliqot[i]._id);
        }
        // { "$exists" : false } - to get the task that dont contains cliqaId filed

        // always filer the table according to admin's cliqot!
        vm.tasksFilter.cliqaId = { $in: userCliqotIds };

        vm.getTasks = function () {

            vm.query.order = 'createTime';

            if (vm.tasksFilterFreeText !== undefined && vm.tasksFilterFreeText !== '') {
                vm.tasksFilter.description = { "$regex": vm.tasksFilterFreeText, "$options": "i" };
            }
            else {
                vm.tasksFilter['description'] = '';
            }

            for (var property in vm.tasksFilter) {
                if (vm.tasksFilter.hasOwnProperty(property)) {
                    if (property === 'cliqaId' && typeof vm.tasksFilter[property] !== 'object' && vm.tasksFilter[property].indexOf('$in') !== -1) {
                        vm.tasksFilter[property] = JSON.parse(vm.tasksFilter[property]);
                    }
                    if (vm.tasksFilter[property] === '') {
                        delete vm.tasksFilter[property];
                    }
                }
            }

            if (vm.tasksFilterStatusInProgress) {
                vm.tasksFilter.status = 'inProgress';
            }
            if (vm.tasksFilterStatusDone) {
                vm.tasksFilter.status = 'done';
            }
            if (vm.tasksFilterStatusDone && vm.tasksFilterStatusInProgress) {
                delete vm.tasksFilter.status;
            }
            if (!vm.tasksFilterStatusDone && !vm.tasksFilterStatusInProgress) {
                delete vm.tasksFilter.status;
                vm.tasksFilterStatusDone = true;
                vm.tasksFilterStatusInProgress = true;
            }


            datacontext.getAllTasksCount(vm.tasksFilter).then(function (response) {
                vm.totalTaskCount = response.data;
            });

            var deferred = $q.defer();
            vm.promise = deferred.promise;
            datacontext.getAllTasks(vm.query, vm.tasksFilter).then(function (tasks) {
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

        vm.getCliqotNamesAsString = function (cliqot) {
            if (cliqot === undefined) {
                return '';
            }
            var cliqotString = '';
            for (var i = 0; i < cliqot.length; i++) {
                cliqotString += cliqot[i].name + ', ';
            }
            return cliqotString.substring(0, cliqotString.length - 2);
        }

        vm.siwtchTab = function (toTab) {
            vm.activeTab = toTab;
            vm.query.page = 1;

            switch (vm.activeTab) {
                case "tasks":
                    vm.getTasks();
                    break;
                case "users":
                    vm.getUsers();
                    break;
                case "reports":

                    break;
                default:
                    vm.getTasks();
                    break;
            }
        }

        vm.goBack = function () {
            window.location = '#/';
        }

        vm.showTasksFilter = $mdMedia('gt-sm');
        vm.expand_icon = vm.showTasksFilter ? 'expand_less' : 'expand_more';
        vm.toggleFilterSection = function () {
            //var svgMorpheus = new SVGMorpheus('#expand_more_icon svg');
            if (vm.showTasksFilter === true) {
                vm.showTasksFilter = false;
                vm.expand_icon = 'expand_more';
            }
            else {
                vm.showTasksFilter = true;
                vm.expand_icon = 'expand_less';
            }
        }

        /* -----  Users Tab ------- */
        vm.usersFilterPlatform = '';
        vm.usersFilter = {};
        //vm.usersFilter.cliqot = {};
        //vm.usersFilter.cliqot._id = '';

        vm.getUsers = function () {

            vm.query.order = 'name';
            if (vm.usersFilterName !== undefined && vm.usersFilterName !== '') {
                vm.usersFilter.name = { "$regex": vm.usersFilterName, "$options": "i" };
            }
            else {
                vm.usersFilter['name'] = '';
            }

            if (vm.usersFilterPlatform !== undefined) {
                if (vm.usersFilterPlatform === '') {
                    delete vm.usersFilterPlatform;
                    delete vm.usersFilter['device.platform'];
                }
                else {
                    vm.usersFilter['device.platform'] = vm.usersFilterPlatform;
                }
            }
            

            for (var property in vm.usersFilter) {
                if (vm.usersFilter.hasOwnProperty(property)) {
                    if (vm.usersFilter[property] === '') {
                        delete vm.usersFilter[property];
                    }
                }
            }

            datacontext.getAllUsersCount(vm.usersFilter).then(function (response) {
                vm.totalUsersCount = response.data;
            });

            var deferred = $q.defer();
            vm.promise = deferred.promise;
            datacontext.getAllUsers(vm.query, vm.usersFilter).then(function (users) {
                vm.users = users.data;
                deferred.resolve();
            });
        };
    }

})();
