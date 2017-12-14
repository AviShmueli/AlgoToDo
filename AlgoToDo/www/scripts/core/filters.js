(function() {
    'use strict';

    angular.module('app.core')
    .filter('myTasks', function () {
        return function (tasks, userId) {
            var filtered = [];
            angular.forEach(tasks, function (task) {
                if (task.status === 'inProgress' &&
                    task.to && task.to._id === userId) {
                    filtered.push(task);
                }
            });
            return filtered;
        };
    })
    .filter('tasksInProgress', function () {
        return function (tasks, userId) {
            var filtered = [];
            angular.forEach(tasks, function (task) {
                if (task.status === 'inProgress' &&
                    task.from._id === userId &&
                    task.to._id !== userId &&
                    task.type !== 'group-sub') {
                    filtered.push(task);
                }
            });
            return filtered;
        };
    }).filter('doneTasks', function () {
        return function (tasks, userId) {
            var filtered = [];
            angular.forEach(tasks, function (task) {
                if ((task.status === 'done' || task.status === 'closed') &&
                    task.from._id === userId &&
                    task.type !== 'group-sub') {
                    filtered.push(task);
                }
            });
            return filtered;
        };
    }).filter('groupTasks_inProgress', function () {
        return function (tasks, mainTaskId) {
            var filtered = [];
            angular.forEach(tasks, function (task) {
                if (task.groupMainTaskId === mainTaskId &&
                    task.status === 'inProgress') {
                    filtered.push(task);
                }
            });
            return filtered;
        };
    }).filter('groupTasks_done', function () {
        return function (tasks, mainTaskId) {
            var filtered = [];
            angular.forEach(tasks, function (task) {
                if (task.groupMainTaskId === mainTaskId &&
                    task.status === 'done') {
                    filtered.push(task);
                }
            });
            return filtered;
        };
    })
    .filter('unReadTasks', function () {
        return function (tasks) {
            var filtered = [];
            angular.forEach(tasks, function (task) {
                if (task.unSeenResponses) {
                    filtered.push(task);
                }
            });
            return filtered;
        };
    })
    .filter('getWeekTitle', function (moment) {
        return function (date) {
            var momentDate = moment(date);
            var weekOfMonth = momentDate.week() - momentDate.startOf('month').week() + 1;
            var month = momentDate.months();
            var he = moment().locale('he');
            var monthInHeb = he.localeData().months()[month];
            var weekInHeb = he.localeData().weekdays()[weekOfMonth -1]
            var srtToReturn = "שבוע " + weekInHeb + " של " + monthInHeb;
            return srtToReturn;
        };
    });;

})();