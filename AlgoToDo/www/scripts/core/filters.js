(function() {
    'use strict';

    angular.module('app.core')
    .filter('myTasks', function () {
        return function (tasks, userId) {
            var filtered = [];
            angular.forEach(tasks, function (task) {
                if (task.status === 'inProgress' &&
                    task.to._id === userId) {
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
                    task.to._id !== userId) {
                    filtered.push(task);
                }
            });
            return filtered;
        };
    }).filter('doneTasks', function () {
        return function (tasks, userId) {
            var filtered = [];
            angular.forEach(tasks, function (task) {
                if (task.status === 'done' &&
                    task.from._id === userId) {
                    filtered.push(task);
                }
            });
            return filtered;
        };
    });

})();