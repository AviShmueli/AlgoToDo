(function() {
    'use strict';

    angular
        .module('TaskManeger.data')
        .service('datacontext', datacontext);

    datacontext.$inject = ['$http', 'logger'];

    function datacontext($http, logger) {

        var self = this;
        self.tasksList = [];
        self.newTask = {};

        var saveNewTask = function(task) {

            var req = {
                method: 'POST',
                url: 'http://localhost:5001/TaskManeger/newTask',
                data: {
                    task: task
                }
            };

            $http(req).then(function(response) {
                logger.success('המשימה נשלחה בהצלחה!', response.data);
            }, function() {});
        };

        var getAllTasks = function() {
            var req = {
                method: 'GET',
                url: 'http://localhost:5001/TaskManeger/getTasks'
            };

            return $http(req);
        };

        var service = {
            tasksList: self.tasksList,
            newTask: self.newTask,
            saveNewTask: saveNewTask,
            getAllTasks: getAllTasks
        };

        return service;
    }
})();