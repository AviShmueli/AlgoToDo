(function() {
    'use strict';

    angular
        .module('app.tasks')
        .controller('TasksListCtrl', TasksListCtrl);

    TasksListCtrl.$inject = [ 
        '$rootScope', '$scope', 'logger', '$location', 'cordovaPlugins',
        '$mdBottomSheet','$filter', '$timeout',
        '$mdSidenav', '$mdDialog', 'datacontext',
        'socket', '$mdToast', 'moment', '$q',
        'pushNotifications', 'localNotifications', 'device',
        'DAL', '$offlineHandler', '$toast', '$transitions'
    ];

    function TasksListCtrl($rootScope, $scope, logger, $location, cordovaPlugins,
                            $mdBottomSheet,$filter, $timeout,
                            $mdSidenav, $mdDialog, datacontext,
                            socket, $mdToast, moment, $q,
                            pushNotifications, localNotifications, device,
                            DAL, $offlineHandler, $toast, $transitions) {

        angular.element(document.querySelectorAll('html')).removeClass("hight-auto");

        var vm = this;

        if ($rootScope.selectedIndex === undefined) {
            $rootScope.selectedIndex = 1;
        }

        vm.user = datacontext.getUserFromLocalStorage();
        vm.imagesPath = device.getImagesPath();
        vm.progressActivated = false;
        $rootScope.taskcount = 0;
        vm.doneTasks = [];
        vm.descriptionTextLength = function () { return Math.floor((window.innerWidth - 70 - 16 - 40 - 16 - 8) / 4); };

        vm.allTasks = function () { return datacontext.getTaskList(); };

        $timeout(function () {
            var count = datacontext.setMyTaskCount();
            cordovaPlugins.setBadge(count);

            if (!device.isMobileDevice()) {
                datacontext.reloadAllTasks(false);
            }
        }, 0);

        vm.logOff = function () {      
            datacontext.deleteUserFromLocalStorage();
            datacontext.deleteAllCachedUsers();
            datacontext.deleteTaskListFromLocalStorage();           
            cordovaPlugins.clearAppBadge();
            if (device.isMobileDevice()) {
                DAL.saveUsersNewRegistrationId('', vm.user);
            }
            $location.path('/logIn');
        };

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

        vm.isDialogOpen = false;
        
        vm.showAdd = function (ev, imageURI, text, calledFromIntent) {           
            vm.isDialogOpen = true;
            $mdDialog.show({
                controller: 'AddTaskDialogController',
                controllerAs: 'vm',
                templateUrl: 'scripts/tasks/AddTaskDialog.html',
                targetEvent: ev,
                fullscreen: true,
                multiple: true,
                skipHide: true,
                clickOutsideToClose: true,
                locals: {
                    imageURI: imageURI,
                    text: text,
                    calledFromIntent: calledFromIntent
                }
            }).then(function () {
                vm.isDialogOpen = false;
            });

            document.addEventListener("deviceready", function () {
                document.addEventListener("backbutton", backbuttonClick_FromAddTask_Callback, false);
            }, false);
        };

        var backbuttonClick_FromAddTask_Callback = function (e) {
            e.preventDefault();
            $mdDialog.cancel();
            vm.isDialogOpen = false;
            document.removeEventListener("backbutton", backbuttonClick_FromAddTask_Callback, false);
        };

        vm.exitApp = false;

        var backbuttonClick_allways_Callback = function (e) {
            if (vm.isDialogOpen) {
                e.preventDefault();
                return;
                // do nothing - dialog will be closed
            }
            if ($location.path() === '/tasksList' || $location.path() === '/signUp' || $location.path() === '/logIn') {
                e.preventDefault();
                if (!vm.exitApp) {
                    vm.exitApp = true;
                    cordovaPlugins.showToast("הקש שוב ליציאה", 1000);
                    $timeout(function () { vm.exitApp = false; }, 1000);
                } else {
                    window.plugins.toast.hide();
                    navigator.app.exitApp();
                }
            }
            else {
                if ($location.path() === '/repeatsTasks') {
                    e.preventDefault();
                }
                else {
                    if ($location.path() !== '/signUp' || $location.path() !== '/logIn') {
                        window.history.back();
                    }                  
                }
            }
        };

        document.addEventListener("deviceready", function () {
            document.addEventListener("backbutton", backbuttonClick_allways_Callback, false);
        }, false);

        vm.setTaskStatus = function (task, newStatus) {
            task.status = newStatus;
            if (task.status === 'done') {
                task.doneTime = new Date();
                //datacontext.removeAllTaskImagesFromCache(task);
                //localNotifications.cancelNotification(task._id);
                $toast.showActionToast("המשימה סומנה כבוצע", "בטל", 2000).then(function (response) {
                    if (response == 'ok') {
                        task.doneTime = null;
                        if (task.offlineMode === true) {
                            $offlineHandler.removeTaskFromCachedTasksToUpdateList(task);
                        }
                        vm.setTaskStatus(task, 'inProgress');
                    }
                });
            }
            if (task.status === 'seen') {
                task.seenTime = new Date();
            }

            var count = datacontext.setMyTaskCount();
            cordovaPlugins.setBadge(count);

            DAL.updateTask(task).then(function (response) {
                
            }, function (error) {
                if (error.status === -1) {
                    error.data = "App lost connection to the server";
                }
                logger.error('Error while trying to update task: ', error.data || error);
                task.offlineMode = true;
                $offlineHandler.addTaskToCachedTasksToUpdateList(task);
            });
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

        vm.searchKeypress = function (event) {
            if (event.keyCode === 13) {
                vm.showSearch = !vm.showSearch;
            }
        };

        vm.navigateToTaskPage = function (task) {
            
            $transitions.slide("left");

            if (task.type === 'group-main') {
                $location.path('/groupTask/' + task._id);
            }
            else {
                $location.path('/task/' + task._id);
            }
        };
 
        $rootScope.redirectToTaskPage = function (taskId, toast) {
            //window.location = '#/task/' + taskId;
            $location.path('/task/' + taskId);
            var toastElement = angular.element(document.querySelectorAll('#message-toast'));
            $mdToast.hide(toastElement);
        };

        $rootScope.hideToast = function (toastId) {
            var toastElement = angular.element(document.querySelectorAll('#' + toastId));
            $mdToast.hide(toastElement);
        };

        vm.cancelAllNotifications = function (ev) {
            var confirm = $mdDialog.confirm()
                .title('למחוק את כל ההתראות הקיימות?')
                .textContent('פעולה זו תגרום למחיקת כל ההתראות הקיימות, ולא יהיה ניתן לשחזר אותן.')
                .ariaLabel('Lucky day')
                .targetEvent(ev)
                .ok('מחק')
                .cancel('בטל');

            $mdDialog.show(confirm).then(function () {
                localNotifications.cancelAllNotifications();
            }, function () {

            });

        };

        vm.taskHasAttachment = function (task) {
            if (task.comments === undefined || task.comments.length === 0) {
                return false;
            }
            for (var i = 0; i < task.comments.length; i++) {
                if (task.comments[i].fileName !== undefined && task.comments[i].fileName !== '') {
                    return true;
                }
            }
            return false;
        };

        vm.moreLoadedTasks = [];

        vm.doneTasks = function () {
            return $filter('orderBy')($filter('doneTasks')(datacontext.getTaskList(), vm.user._id).concat(datacontext.getMoreLoadedTasks()/*vm.moreLoadedTasks*/), 'doneTime', true);
        };
        
        vm.infiniteItems = {
            numLoaded_: vm.doneTasks().length,
            toLoad_: 0,
            //items: ,
            stopLoadData: false,
            
            getItemAtIndex: function (index) {
                if (index > this.numLoaded_) {                   
                    this.fetchMoreItems_(index);
                    return null;
                }

                return vm.doneTasks()[index] || null;
            },


            getLength: function () {
                return this.numLoaded_ + 5;
            },

            fetchMoreItems_: function (index) {
                if (this.toLoad_ < index && this.stopLoadData === false) {
                    if (this.toLoad_ === 0) {
                        this.toLoad_ = vm.doneTasks().length + 1;
                    }
                    else {
                        this.toLoad_ += 20;
                    }

                    DAL.getDoneTasks(this.toLoad_, vm.user).then(angular.bind(this, function (response) {
                        if (response.data.length === 0) {
                            this.stopLoadData = true;
                        }
                        else {
                            datacontext.addTasksToMoreLoadedTasks(response.data);
                            //vm.moreLoadedTasks = vm.moreLoadedTasks.concat(response.data);// = $filter('orderBy')(vm.doneTasks.concat(response.data), 'createTime', true);
                            this.numLoaded_ = this.toLoad_;
                        }
                    }));                                     
                }
            }
        };
        /*vm.heightStep = window.innerHeight - 500;

        $timeout(function () {
            angular.element(document.getElementsByTagName('md-content')).on('scroll', function (evt) {
                if ($rootScope.selectedIndex === 2 && evt.srcElement.scrollTop > vm.heightStep) {
                    vm.heightStep += 500;
                    vm.loadMoreDoneTasks();
                }
            });
        }, 1);

        vm.loadedDoneTask = 20;

        vm.loadMoreDoneTasks = function () {
            vm.loadedDoneTask += 20;
            DAL.getDoneTasks(vm.loadedDoneTask, vm.user).then(function (response) {
                datacontext.pushTasksToTasksList(response.data);
            });
        };*/

        // for testing only
        vm.goOnline = function () {
            $offlineHandler.goOnline();
        };

        document.addEventListener('deviceready', function () {

            window.plugins.webintent.getExtra(window.plugins.webintent.EXTRA_STREAM,
                function (url) {
                    vm.showAdd(null, url, '', true);
                }, function () {}
            );

            window.plugins.webintent.getExtra(window.plugins.webintent.EXTRA_TEXT,
                function (text) {
                    vm.showAdd(null, '', text, true);
                }, function () {}
            );

        }, false);

        
    }

})();
