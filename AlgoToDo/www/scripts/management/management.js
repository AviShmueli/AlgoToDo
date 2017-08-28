(function () {
    'use strict';

    angular
        .module('app.management')
        .controller('managementCtrl', managementCtrl);

    managementCtrl.$inject = ['$rootScope', '$scope', 'logger', '$q',
        'datacontext', 'moment', '$mdMedia', 'DAL',
        '$location', '$timeout', 'appConfig', 'filesHandler'
    ];

    function managementCtrl($rootScope, $scope, logger, $q,
        datacontext, moment, $mdMedia, DAL,
        $location, $timeout, appConfig, filesHandler) {

        var vm = this;

        angular.element(document.querySelectorAll('html')).removeClass("hight-auto");

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
        vm.tasksFilterStatusClosed = true;
        //

        vm.user = datacontext.getUserFromLocalStorage();

        vm.allVersionInstalled = [];
        DAL.getAllVersionInstalled().then(function (allVersions) {
            vm.allVersionInstalled = allVersions.data;
        });

        var userCliqotIds = [];

        $timeout(function () {
            vm.allCliqot['all'] = {
                name: 'כל הקליקות',
                '_id': {
                    $in: userCliqotIds
                }
            };
            for (var i = 0; i < vm.user.cliqot.length; i++) {
                vm.allCliqot[vm.user.cliqot[i]._id] = vm.user.cliqot[i];
                userCliqotIds.push(vm.user.cliqot[i]._id);
            }
            // { "$exists" : false } - to get the task that dont contains cliqaId filed

            // always filer the table according to admin's cliqot!
            vm.tasksFilter.cliqaId = {
                $in: userCliqotIds
            };
        }, 0);

        vm.getTasks = function () {

            vm.query.order = 'createTime';

            if (vm.tasksFilterFreeText !== undefined && vm.tasksFilterFreeText !== '') {
                vm.tasksFilter.description = {
                    "$regex": vm.tasksFilterFreeText,
                    "$options": "i"
                };
            } else {
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
            if (vm.tasksFilterStatusClosed) {
                vm.tasksFilter.status = 'closed';
            }
            if (vm.tasksFilterStatusDone && vm.tasksFilterStatusInProgress && vm.tasksFilterStatusClosed) {
                delete vm.tasksFilter.status;
            }
            if (!vm.tasksFilterStatusDone && !vm.tasksFilterStatusInProgress && !vm.tasksFilterStatusClosed) {
                delete vm.tasksFilter.status;
                vm.tasksFilterStatusDone = true;
                vm.tasksFilterStatusClosed = true;
                vm.tasksFilterStatusInProgress = true;
            }


            DAL.getAllTasksCount(vm.tasksFilter).then(function (response) {
                vm.totalTaskCount = response.data;
            });

            var deferred = $q.defer();
            vm.promise = deferred.promise;
            DAL.getAllTasks(vm.query, vm.tasksFilter, vm.user).then(function (tasks) {
                vm.tasks = tasks.data;
                deferred.resolve();
            });
        };

        $timeout(function () {
            vm.getTasks();
        }, 0);

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
            //window.location = '#/';
            $location.path('/tasksList');
        }

        vm.showTasksFilter = $mdMedia('gt-sm');
        vm.expand_icon = vm.showTasksFilter ? 'expand_less' : 'expand_more';
        vm.toggleFilterSection = function () {
            //var svgMorpheus = new SVGMorpheus('#expand_more_icon svg');
            if (vm.showTasksFilter === true) {
                vm.showTasksFilter = false;
                vm.expand_icon = 'expand_more';
            } else {
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
                vm.usersFilter.name = {
                    "$regex": vm.usersFilterName,
                    "$options": "i"
                };
            } else {
                vm.usersFilter['name'] = '';
            }

            if (vm.usersFilterPlatform !== undefined) {
                if (vm.usersFilterPlatform === '') {
                    delete vm.usersFilterPlatform;
                    delete vm.usersFilter['device.platform'];
                } else {
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

            DAL.getAllUsersCount(vm.usersFilter).then(function (response) {
                vm.totalUsersCount = response.data;
            });

            var deferred = $q.defer();
            vm.promise = deferred.promise;
            DAL.getAllUsers(vm.query, vm.usersFilter, vm.user).then(function (users) {
                vm.users = users.data;
                deferred.resolve();
            });
        };

        vm.getLocalPhoneFormat = function (phone) {
            if (phone !== undefined) {
                return phoneUtils.formatNational(phone, appConfig.region)
            }
            return '';
        }


        /* ------ Excel download -----*/
        var fields = {
            createTime: 'תאריך',
            from: 'שולח',
            to: 'נמען',
            description: 'תיאור',
            status: 'סטטוס',
            totalTime: 'זמן ביצוע',
            comments: 'תגובות',
            photos: 'תמונות'
        };


        vm.downloadFilterdTable = function () {
            var fileName = 'משימות' + '_' + moment().format("DD/MM/YYYY");
            DAL.getAllTasks(vm.query, vm.tasksFilter, vm.user).then(function (response) {
                var taskToDownload = convertTasksToExcelFormat(response.data);
                filesHandler.downloadAsCSV(taskToDownload, fields, fileName);
            });
        }

        var convertTasksToExcelFormat = function (tasks) {
            var listToReturn = []
            for (var index = 0; index < tasks.length; index++) {
                var task = tasks[index];
                var excelTask = {
                    createTime: moment(task.createTime).format("DD/MM/YYYY hh:mm"),
                    from: task.from.name,
                    to: task.to.name,
                    description: task.description,
                    status: grtStatusHebString(task.status),
                    totalTime: vm.getTotalTaskTime(task),
                    comments: getTaskCommentsAsString(task),
                    photos: getTaskPhotos(task)
                };
                listToReturn.push(excelTask);
            }
            return listToReturn;
        }

        var getTaskCommentsAsString = function (task) {
            var str = '';
            for (var index = 0; index < task.comments.length; index++) {
                var comment = task.comments[index];
                if (comment.text && comment.text !== '') {
                    str += comment.from.name + ': ' + comment.text + ', ';
                }
            }
            return str;
        }

        var getTaskPhotos = function (task) {
            var str = '';
            for (var index = 0; index < task.comments.length; index++) {
                var comment = task.comments[index];
                if (comment.fileName && comment.fileName !== '') {
                    str += comment.from.name + ': ' + comment.fileName + ', ';
                }
            }
            return str;
        }

        var grtStatusHebString = function (status) {
            switch (key) {
                case 'inProgress':
                    return 'בתהליך';
                case 'done':
                    return 'בוצע'
                case 'closed':
                    return 'נסגר'
                default:
                    break;
            }
        }
    }

})();