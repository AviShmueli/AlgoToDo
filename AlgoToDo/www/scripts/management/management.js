(function () {
    'use strict';

    angular
        .module('app.management')
        .controller('managementCtrl', managementCtrl);

    managementCtrl.$inject = ['$rootScope', '$scope', 'logger', '$q',
        'datacontext', 'moment', '$mdMedia', 'DAL',
        '$location', '$timeout', 'appConfig', 'filesHandler',
        'socket', '$mdToast'
    ];

    function managementCtrl($rootScope, $scope, logger, $q,
        datacontext, moment, $mdMedia, DAL,
        $location, $timeout, appConfig, filesHandler,
        socket, $mdToast) {

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
        vm.users = [];
        vm.allCliqot = {};
        vm.activeTab = 'tasks';
        vm.tasksFilterStatusInProgress = true;
        vm.tasksFilterStatusDone = true;
        vm.tasksFilterStatusClosed = true;

        vm.user = datacontext.getUserFromLocalStorage();

        vm.allVersionInstalled = [];
        DAL.getAllVersionInstalled().then(function (allVersions) {
            vm.allVersionInstalled = allVersions.data;
        });

        var userCliqotIds = [];


        $scope.$watch('vm.tasksFilter.cliqaId', function (cliqot) {
            if (cliqot && cliqot.length) {
                delete vm.tasksFilter.userId;
                // if (vm.tasksFilter.cliqaId.indexOf('$in') !== -1) {
                //     vm.users = [];
                // }
                DAL.getUsersInCliqa(cliqot).then(function (users) {
                    vm.users = users.data;
                });
            }
        });

        //$timeout(function () {

        // vm.allCliqot['all'] = {
        //     name: 'כל הקליקות',
        //     '_id': {
        //         $in: userCliqotIds
        //     }
        // };
        for (var i = 0; i < vm.user.cliqot.length; i++) {
            vm.allCliqot[vm.user.cliqot[i]._id] = vm.user.cliqot[i];
            userCliqotIds.push(vm.user.cliqot[i]._id);
        }
        // { "$exists" : false } - to get the task that dont contains cliqaId filed
        vm.allCliqotValues = Object.values(vm.allCliqot);
        // always filer the table according to admin's cliqot!
        vm.tasksFilter.cliqaId = userCliqotIds;
        //}, 0);

        vm.getNextPage = function (page, skip) {
            vm.query.page = page;
            vm.query.skip = skip;
            vm.getTasksFilter(false, false);
        }

        vm.getTasksFilter = function (reset, dontFilter) {

            if (reset) {
                vm.query.page = 1;
            }

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
                    if (property === 'cliqaId' &&
                        typeof vm.tasksFilter[property] !== 'object' &&
                        vm.tasksFilter[property].indexOf('$in') !== -1) {
                        vm.tasksFilter[property] = JSON.parse(vm.tasksFilter[property]);
                    }
                    if (vm.tasksFilter[property] === '' || vm.tasksFilter[property].length < 1) {
                        delete vm.tasksFilter[property];
                    }
                }
            }
            if (!vm.tasksFilter.hasOwnProperty('cliqaId')) {
                logger.toast('חובה לבחור קליקה', 700);
                return;
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
            if (vm.tasksFilterStatusDone &&
                vm.tasksFilterStatusInProgress &&
                vm.tasksFilterStatusClosed) {
                delete vm.tasksFilter.status;
            }
            if (!vm.tasksFilterStatusDone &&
                !vm.tasksFilterStatusInProgress &&
                !vm.tasksFilterStatusClosed) {
                delete vm.tasksFilter.status;
                vm.tasksFilterStatusDone = true;
                vm.tasksFilterStatusClosed = true;
                vm.tasksFilterStatusInProgress = true;
            }

            if (!dontFilter) {
                getFilterdTasks();
            }
        };

        var getFilterdTasks = function () {

            DAL.getAllTasksCount(vm.tasksFilter).then(function (response) {
                vm.totalTaskCount = response.data;
            });

            var deferred = $q.defer();
            vm.promise = deferred.promise;
            DAL.getAllTasks(vm.query, vm.tasksFilter, vm.user).then(function (tasks) {
                vm.tasks = tasks.data;
                window.localStorage.setItem('fakeData', JSON.stringify(vm.tasks));
                deferred.resolve();
            });
        }

        $timeout(function () {
            vm.getTasksFilter();
            //vm.tasks = JSON.parse(window.localStorage.getItem('fakeData'));
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
                    vm.getTasksFilter();
                    break;
                case "users":
                    vm.getUsers();
                    break;
                case "reports":

                    break;
                default:
                    vm.getTasksFilter();
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

            if (!vm.tasksFilter.hasOwnProperty('cliqaId')) {
                logger.toast('חובה לבחור קליקה', 700);
                return;
            }

            showToast();

            subscribeToIO().then(function (clientId) {
                var query = {
                    order: 'createTime'
                };
                //updateToast('filter...');
                vm.getTasksFilter(false, true);

                if (vm.tasksFilter.hasOwnProperty('cliqaId')) {
                    var req = DAL.generateReport(query, vm.tasksFilter, vm.user);

                    var linkElement = document.createElement('a');
                    try {

                        var url = req.url + '?query=' +
                            JSON.stringify(req.params.query) + '&filter=' +
                            JSON.stringify(req.params.filter) + '&clientId=' +
                            clientId;

                        linkElement.setAttribute('href', url);
                        linkElement.setAttribute("download", "MyExcel.xlsx");

                        var clickEvent = new MouseEvent("click", {
                            "view": window,
                            "bubbles": true,
                            "cancelable": false
                        });
                        updateToast('שולח נתונים לשרת ...');
                        linkElement.dispatchEvent(clickEvent);

                        socket.emit('start', "avi");
                    } catch (ex) {
                        console.log(ex);
                    }
                } else {
                    updateToast('אירעה שגיאה, נסה שוב');
                    $timeout(function () {
                        hideToast();
                    }, 4000);

                }
            });


        }

        var getStatusHebString = function (status) {
            switch (status) {
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

        var deferred;
        var subscribeToIO = function name(params) {
            deferred = $q.defer();

            socket.emit('start', "avi");

            $timeout(function () {
                deferred.resolve(clientId);
            }, 10000);

            return deferred.promise;
        }
        socket.on('wellcome', function (data) {
            clientId = data;
            if (deferred) {
                deferred.resolve(clientId);
            }
        });
        socket.on('status', function (data) {
            handelStatusFromServer(data);
        });
        var clientId;

        var handelStatusFromServer = function (statusCode) {
            switch (statusCode) {
                case "1":
                    //updateToast('geting tasks');
                    break;
                case "2":
                    //updateToast('creating worksheet');
                    break;
                case "3":
                    updateToast('מוריד תמונות ...');
                    break;
                case "4":
                    //updateToast('inserting data to worksheet');
                    break;
                case "5":
                    //updateToast('removing temp files');
                    break;
                case "6":
                    //updateToast('compleateing');
                    break;
                case "compleate":
                    //updateToast('done!');
                    hideToast();
                    break;
                case "error":
                    updateToast('אירעה שגיאה, נסה שוב');
                    $timeout(function () {
                        hideToast();
                    }, 4000);
                    break;
                default:
                    break;
            }
        }

        var showToast = function () {
            $mdToast.show($mdToast.simple().textContent('מכין נתונים ...').hideDelay(300000));
        }

        var updateToast = function (text) {
            $mdToast.updateTextContent(text);
        }

        var hideToast = function () {
            $mdToast.hide();
        }


    }

})();