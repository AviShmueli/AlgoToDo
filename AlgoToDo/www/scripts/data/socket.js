(function() {
    'use strict';

    angular
        .module('app.data')
        .factory('socket', socket);

    socket.$inject = ['$rootScope', 'appConfig'];

    function socket($rootScope, appConfig) {
        var socket = io.connect(appConfig.appDomain());

        return {
            on: on,
            emit: emit
        };

        function on(eventName, callback) {
            socket.on(eventName, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    callback.apply(socket, args);
                });
            });
        }

        function emit(eventName, data, callback) {
            socket.emit(eventName, data, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }

    }
})();


// when new comment received from the server
/*socket.on('new-comment', function (data) {

    var newComment = data.newComment;
    var taskId = data.taskId;
    addCommentToTask(taskId, newComment);
});*/

// login 
/*socket.emit('join', {
    userId: vm.user._id
});*/

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
/*socket.on('new-task', function(data) {           
    var newTask = data;
    if (newTask.from._id !== vm.user._id) {
        //datacontext.addTaskToTaskList(newTask);
        //setMyTaskCount();
    }
});*/

// when the server response the users tasks
/*socket.on('updated-task', function (data) {
    //logger.success('????? ??????', data.value);
    datacontext.replaceTask(data.value);
    var count = datacontext.setMyTaskCount();
    cordovaPlugins.setBadge(count);
});*/
