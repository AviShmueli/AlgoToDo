(function() {
    'use strict';

    angular
        .module('app.tasks')
        .controller('TasksListCtrl', TasksListCtrl);

    TasksListCtrl.$inject = [ 
        '$rootScope', '$scope', 'logger', '$location', 'cordovaPlugins',
        'appConfig', '$mdMedia', '$mdBottomSheet','$filter',
        '$mdSidenav', '$mdDialog', 'datacontext', 'lodash',
        'socket', '$mdToast', 'moment', '$q'
    ];

    function TasksListCtrl($rootScope, $scope, logger, $location, cordovaPlugins,
                            appConfig, $mdMedia, $mdBottomSheet,$filter,
                            $mdSidenav, $mdDialog, datacontext, lodash,
                            socket, $mdToast, moment, $q) {

        var vm = this;
        
        vm.selectedIndex = 1;
        vm.isSmallScrean = $mdMedia('sm');
        vm.userConnected = false;
        vm.user = {};
        vm.appDomain = appConfig.appDomain;
        vm.progressActivated = false;
        vm.myTasksCount = 0;
        $rootScope.taskcount = 0;
        vm.signUpInProggress = true;

        vm.onGoingActivityies = function () { return datacontext.getTaskList(); };      

        var setMyTaskCount = function () {
            var count = $filter('myTasks')(datacontext.getTaskList(), vm.user._id).length;
            cordovaPlugins.setBadge(count);
            vm.myTasksCount = count;
            $rootScope.taskcount = count;
        };

        var activateProgress = function (toastText) {
            vm.progressActivated = true;
            return logger.toast(toastText, null, 10000);
        };

        var deactivateProgress = function (toast) {
            $mdToast.hide(toast);
        };

        var loadTasks = function () {
            
            if (datacontext.getTaskList().length === 0) {
                var loadingToast = activateProgress("טוען נתונים...");
                datacontext.getAllTasks().then(function (response) {
                    datacontext.setTaskList(response.data);
                    setMyTaskCount();
                    vm.progressActivated = false;
                    deactivateProgress(loadingToast);
                });
            }
            else {
                setMyTaskCount();
            }
        };

        vm.checkIfUserLogdIn = function () {
            var user = datacontext.getUserFromLocalStorage();
            if (user !== undefined) {
                vm.user = user;
                vm.login();
            }
        };

        vm.signUp = function () {
            datacontext.checkIfUserExist(vm.user).then(function (response) {
                logger.info("response from isuserexist: ", response);
                if (response.data !== null && response.data !== '') {
                    var user = response.data;
                    datacontext.saveUserToLocalStorage(user);
                    vm.user = user;
                    vm.login();
                }
                else {
                    vm.registerUser();
                }

            }, function (error) {
                logger.error("error while trying to check If User Exist", error);
            });

        };

        vm.registerUser = function () {

            if (vm.user.sex === 'woman') {
                vm.user.avatarUrl = '/images/woman-' + Math.floor((Math.random() * 15) + 1) + '.svg';
            }
            else{
                vm.user.avatarUrl = '/images/man-' + Math.floor((Math.random() * 9) + 1) + '.svg';
            }
            

            if (cordovaPlugins.isMobileDevice()) {

                document.addEventListener("deviceready", function () {

                    vm.user.device = cordovaPlugins.getDeviceDetails();

                    cordovaPlugins.initializePushV5().then(function () {
                        cordovaPlugins.registerForPushNotifications().then(function (registrationId) {

                            if (vm.user.device.platform === 'iOS') {
                                vm.user.ApnRegistrationId = registrationId;
                            }
                            if (vm.user.device.platform === 'Android') {
                                vm.user.GcmRegistrationId = registrationId;
                            }
                            datacontext.registerUser(vm.user).then(function (response) {
                                datacontext.saveUserToLocalStorage(response.data);
                                logger.success('user signUp successfuly', response.data);
                                vm.user = response.data;
                                vm.login();
                            }, function () { });
                        });
                    }, function (error) {
                        logger.error("error while trying to register user to app", error);
                    });
                }, false);
            }
            else {
                datacontext.registerUser(vm.user).then(function (response) {
                    datacontext.saveUserToLocalStorage(response.data);
                    logger.success('user signUp successfuly', response.data);
                    vm.user = response.data;
                    vm.login();
                }, function (error) {
                    logger.error("error while trying to register user to app", error);
                });
            }
        }

        vm.login = function () {
            angular.element(document.querySelectorAll('html')).removeClass("hight-auto");
            // login 
            socket.emit('join', {
                userId: vm.user._id
            });

            //force get all the users from the server
            //socket.emit('get-users');

            // ask server to send the user tasks
            /*socket.emit('get-tasks', {
                userName: vm.user.name
            });*/
            loadTasks();
            vm.userConnected = true;           
            
            if (cordovaPlugins.isMobileDevice()) {
                document.addEventListener("deviceready", function () {
                    cordovaPlugins.startListening();
                    cordovaPlugins.onNotificationReceived(); 
                }, false);
            }

            logger.info("user is now connected", vm.user);
            //logger.toast("אתה עכשיו מחובר!", null, 1000);
        };

        vm.logOff = function () {
            angular.element(document.querySelectorAll('html')).addClass("hight-auto");
            datacontext.deleteUserFromLocalStorage();
            vm.userConnected = false;
            vm.toggleSidenav('left');
            cordovaPlugins.clearAppBadge();
        };

        // the response to the all-usersr from the server
        // get from the server the list of users that are connected
        /*socket.on('all-users', function(data) {

            var users = {};
            angular.forEach(data, function(value, key) {
                if (value.userName !== vm.userName) {
                    users[value.userName] = value;
                }
            });
            datacontext.users = users;
        });

        // when the server response the users tasks
        socket.on('users-tasks', function(data) {
            datacontext.tasksList = data;
        });*/

        // when new task received from the server
        socket.on('new-task', function(data) {           
            var newTask = data;
            if (newTask.from._id !== vm.user._id) {
                datacontext.addTaskToTaskList(newTask);
                setMyTaskCount();
            }
        });

        // when the server response the users tasks
        socket.on('updated-task', function (data) {
            //logger.success('משימה עודכנה', data.value);
            datacontext.replaceTask(data.value);
            setMyTaskCount();
        });

        vm.toggleSidenav = function(menuId) {
            $mdSidenav(menuId).toggle();
        };

        vm.showListBottomSheet = function($event) {
            vm.alert = '';
            $mdBottomSheet.show({
                templateUrl: 'scripts/widgets/ListBottomSheet.html',
                controller: 'ListBottomSheetCtrl',
                controllrAs: 'vm',
                targetEvent: $event
            }).then(function(clickedItem) {
                vm.alert = clickedItem.name + ' clicked!';
            });
        };

        vm.showAdd = function (ev) {           
            $mdDialog.show({
                controller: 'AddTaskDialogController',
                controllerAs: 'vm',
                templateUrl: 'scripts/widgets/AddTaskDialog.html',
                targetEvent: ev,
                fullscreen: true
            }).then(function (task) {
                var user = datacontext.getUserFromLocalStorage();
                task.from = { '_id': user._id, 'name': user.name, 'avatarUrl': user.avatarUrl};
                task.status = 'inProgress';
                task.createTime = new Date();
                datacontext.saveNewTask(task).then(function (response) {
                        logger.toast('המשימה נשלחה בהצלחה!', response.data, 2000);
                        logger.info('task added sucsessfuly', response.data);
                        datacontext.addTaskToTaskList(response.data);
                        setMyTaskCount();
                }, function (error) {
                    logger.error('Error while tring to add new task ', error);
                });;
                });
        
        };

        vm.setTaskStatus = function (task, newStatus) {
            task.status = newStatus;
            if (task.status === 'done') {
                task.doneTime = new Date();
            }
            if (task.status === 'seen') {
                task.seenTime = new Date();
            }

            datacontext.updateTask(task).then(function (response) {
                logger.success('המשימה עודכנה בהצלחה!', response.data);
                setMyTaskCount();
            }, function (error) {
                logger.error('Error while tring to update task ', error);
            });
        };

        vm.reloadTasks = function () {
            var deferred = $q.defer();
            datacontext.getAllTasks().then(function (response) {
                datacontext.setTaskList(response.data);
                setMyTaskCount();
                deferred.resolve();
            });
            return deferred.promise;
        };

        vm.getTotalTaskTime = function (task) {
            var end = new Date(task.doneTime);
            var start = new Date(task.createTime);
            var totalInMillisconds = end.getTime() - start.getTime();
            var totalTime = moment.duration(totalInMillisconds);
            return moment.duration(totalInMillisconds).humanize();
        };

        document.addEventListener("resume", function () {         
            vm.selectedIndex = 1;
            //vm.login();
        }, false);

        vm.searchKeypress = function (event) {
            if (event.keyCode === 13) {
                vm.showSearch = !vm.showSearch;
            }
        };

        vm.navigateToTaskPage = function (taskId) {
            window.location = '#/task/' + taskId;
        }

        vm.checkIfUserLogdIn();
     

    }

})();