(function() {
    'use strict';

    angular
        .module('TaskManeger.data')
        .factory('socket', socket);

    socket.$inject = ['$rootScope'];

    function socket($rootScope) {
        var socket = io.connect('https://algotodo.herokuapp.com');
        //var socket = io.connect('http://localhost:5001');

        return {
            on: on,
            emit: emit
        }

        function on(eventName, callback) {
            socket.on(eventName, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    callback.apply(socket, args);
                });
            });
        };

        function emit(eventName, data, callback) {
            socket.emit(eventName, data, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        };

    };
})();