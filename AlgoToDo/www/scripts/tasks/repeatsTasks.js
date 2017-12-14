(function () {
    'use strict';

    angular
        .module('app.tasks')
        .controller('repeatsTasksCtrl', repeatsTasksCtrl);

    repeatsTasksCtrl.$inject = ['$rootScope', '$scope', 'logger', '$q', 'storage',
        'datacontext', 'moment', 'device', '$mdDialog',
        'DAL', '$offlineHandler', '$location', 'cordovaPlugins',
        '$timeout', '$mdBottomSheet'
    ];

    function repeatsTasksCtrl($rootScope, $scope, logger, $q, storage,
        datacontext, moment, device, $mdDialog,
        DAL, $offlineHandler, $location, cordovaPlugins,
        $timeout, $mdBottomSheet) {

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

        $scope.$watch('vm.repeatsTasks', function (repeatsTasks) {
            setEventsList(repeatsTasks);

        }, true);

        $scope.safeApply = function (fn) {
            var phase = this.$root.$$phase;
            if (phase == '$apply' || phase == '$digest') {
                if (fn && (typeof (fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        };

        vm.getRepeatedTime = function (task) {

            var daysRepeat = task.daysRepeat.sort();

            var days = '';
            var time = task.hour + ':' + task.minutes; //moment(task.startTime).format("LT");

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
            } else {
                days = 'ימים ' + days.slice(0, -1);
            }

            return days + ' בשעה ' + time;
        };

        vm.descriptionTextLength = function () {
            return Math.floor((window.innerWidth - 70 - 16 - 40 - 16 - 8) / 4);
        };

        vm.goBack = function () {
            $location.path('/tasksList');
        };

        var viewModes = {
            24: {
                mode: 24,
                modeText: 'day',
                icon: 'view_day'
            },
            7: {
                mode: 7,
                modeText: 'week',                
                icon: 'view_week'
            },
            30: {
                mode: 30,
                modeText: 'month',                
                icon: 'view_module'
            }
        };

        vm.selectedViewMode = viewModes[30];

        vm.showGridBottomSheet = function () {
            $scope.alert = '';
            $mdBottomSheet.show({
                template: `<md-bottom-sheet class="md-grid" layout="column">
                <div ng-cloak>
                  <md-list flex layout="row" layout-align="center center">
                    <md-list-item>
                      <div>
                        <md-button class="md-grid-item-content" ng-click="listItemClick(30)">
                          <ng-md-icon icon="view_module"></ng-md-icon>
                          <div class="md-grid-text"> חודשי </div>
                        </md-button>
                      </div>
                    </md-list-item>
                <md-list-item>
                      <div>
                        <md-button class="md-grid-item-content" ng-click="listItemClick(7)">
                          <ng-md-icon icon="view_week"></ng-md-icon>
                          <div class="md-grid-text"> שבועי </div>
                        </md-button>
                      </div>
                    </md-list-item>
                <md-list-item>
                      <div>
                        <md-button class="md-grid-item-content" ng-click="listItemClick(24)">
                          <ng-md-icon icon="view_day"></ng-md-icon>
                          <div class="md-grid-text"> יומי </div>
                        </md-button>
                      </div>
                    </md-list-item>
                  </md-list>
                </div>
              </md-bottom-sheet>`,
                controller: function ($scope, $mdBottomSheet) {
                    $scope.listItemClick = function (mode) {
                        $mdBottomSheet.hide(mode);
                    };
                }
            }).then(function (clickedItem) {
                vm.selectedViewMode = viewModes[clickedItem];
            }).catch(function (error) {
            });
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
                    updateList: function () {}
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
                    $timeout(function () {
                        vm.exitApp = false;
                    }, 1000);
                } else {
                    window.plugins.toast.hide();
                    navigator.app.exitApp();
                }
            } else {
                window.history.back();
            }
        };

        document.addEventListener("deviceready", function () {
            document.addEventListener("backbutton", backbuttonClick_allways_Callback1, false);
        }, false);



        /**
         * Calendar
         */

        function setEventsList(taskList) {
            for (var index = 0; index < taskList.length; index++) {
                var task = taskList[index];
                setEvents(task);
            }
        }


        vm.calendarView = 'month';
        vm.viewDate = moment().startOf('month').toDate();
        vm.cellModifier = function (cell) {
            cell.cssClass = 'custom-template-cell';
        };

        vm.events = [];
        vm.cellIsOpen = false;
        //vm.selected = vm.events[0];

        vm.eventClicked = function (item) {
            console.log(item);
        };

        vm.createClicked = function (date) {
            console.log(date);
        };

        vm.eventTimesChanged = function (date) {
            console.log(date);
        };

        vm.timespanClicked = function (date, cell) {
            console.log(date + ', ' + cell);
        };
        
        function setEvents(task) {
            var m = moment().day();
            var w = weekOfMonth(moment());
            for (var i = 1; i <= 5; i++) {


                // moment().day(14);//   14 = (6 - w) x 7
                // moment().day(7);//    7 = (5 - w) x 7
                // moment().day(0);//me- 0 = (4 - w) x 7
                // moment().day(-7);//  -7 = (3 - w) x 7
                // moment().day(-14);//-14 = (2 - w) x 7
                // moment().day(-21);//-21 = (1 - w) x 7

                vm.events.push({
                    task: task,
                    startsAt: moment().day(((i - w) * 7) + parseInt(task.daysRepeat)).hour(task.hour).minute(task.minutes).toDate(),
                    //end: moment().day((i - w) * 7 + daysRepeat).hour(hour + 1).minute(minutes).toDate(),
                    title: task.description,
                    color: { // can also be calendarConfig.colorTypes.warning for shortcuts to the deprecated event types
                        primary: 'rgba(0, 188, 212, 0.14);', // the primary event color (should be darker than secondary)
                        secondary: 'rgb(0,188,212);' // the secondary event color (should be lighter than primary)
                    },
                    actions: [{ // an array of actions that will be displayed next to the event title
                        label: '<i class=\'glyphicon glyphicon-pencil\'></i>', // the label of the action
                        cssClass: 'edit-action', // a CSS class that will be added to the action element so you can implement custom styling
                        onClick: function (args) { // the action that occurs when it is clicked. The first argument will be an object containing the parent event
                            vm.editTask(args.calendarEvent.task, null);
                            console.log('Edit event', args.calendarEvent);
                        }
                    }],
                    draggable: true, //Allow an event to be dragged and dropped
                    resizable: true, //Allow an event to be resizable
                    incrementsBadgeTotal: true, //If set to false then will not count towards the badge total amount on the month and year view
                    recursOn: 'year', // If set the event will recur on the given period. Valid values are year or month
                    cssClass: 'a-css-class-name', //A CSS class (or more, just separate with spaces) that will be added to the event when it is displayed on each view. Useful for marking an event as selected / active etc
                    allDay: false // set to true to display the event as an all day event on the day view
                });
            }
            //offsetDays = offsetDays || 0;
            //var offset = offsetDays * 24 * 60 * 60 * 1000;
            //var date = new Date(new Date().getTime() + offset);
            //if (hour) { date.setHours(hour); }
            //return date;
        }

        function weekOfMonth(m) {
            return m.week() - moment(m).startOf('month').week() + 1;
        }

    }

})();