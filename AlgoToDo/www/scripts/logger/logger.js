(function() {
    'use strict';

    angular
        .module('TaskManeger.logger')
        .factory('logger', logger);

    logger.$inject = ['$log', '$mdToast'];

    function logger($log, $mdToast) {
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
        }

        function info(message, data, toastTime) {
            var simpleToast = $mdToast.build({
                hideDelay: toastTime,
                position: 'bottom right',
                template: '<md-toast>' +
                             '<div class="md-toast-content" dir="rtl">' +
                                message +
                             '</div>' +
                          '</md-toast>',
            });
            $mdToast.show(simpleToast);
            $log.info('Info: ' + message, data);
            //cordovaPlugins.showToast(data);
            return simpleToast;
        }

        function success(message, data, title) {
            $log.info('Success: ' + message, data);
        }

        function warning(message, data, title) {
            //toastr.warning(message, title);
            $log.warn('Warning: ' + message, data);
        }
    }
}());