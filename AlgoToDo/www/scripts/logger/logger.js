(function() {
    'use strict';

    angular
        .module('TaskManeger.logger')
        .factory('logger', logger);

    logger.$inject = ['$log', '$mdToast', '$cordovaToast'];

    function logger($log, $mdToast, $cordovaToast) {
        var service = {
            showToasts: true,

            error: error,
            info: info,
            success: success,
            warning: warning,

            // straight to console; bypass toastr
            log: $log.log
        };

        return service;
        /////////////////////

        function error(message, data, title) {
            //toastr.error(message, title);
            $log.error('Error: ' + message, data);

            /*
            $cordovaToast
            .show('Here is a message', 'long', 'center')
            .then(function (success) {
                // success
            }, function (error) {
                // error
            });
            */
        }

        function info(message, data, title) {
            //toastr.info(message, title);
            $log.info('Info: ' + message, data);
        }

        function success(message, data, title) {

            $mdToast.show({
                textContent: message,
                position: 'top left',
                hideDelay: 3000
            });

            $log.info('Success: ' + message, data);
        }

        function warning(message, data, title) {
            //toastr.warning(message, title);
            $log.warn('Warning: ' + message, data);
        }
    }
}());