(function() {
    'use strict';

    angular
        .module('TaskManeger.data')
        .factory('socket', socket);

    socket.$inject = ['$rootScope', 'appConfig'];

    function socket($rootScope, appConfig) {
        var socket = io.connect(appConfig.appDomain);

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