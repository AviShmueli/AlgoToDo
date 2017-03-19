(function() {
    'use strict';

    angular
        .module('app.logger')
        .factory('logger', logger);

    logger.$inject = ['$log', '$mdToast', '$mdDialog'];

    function logger($log, $mdToast, $mdDialog) {

        var self = this;

        var service = {
            showToasts: true,
            setUser: setUser,
            error: error,
            info: info,
            success: success,
            warning: warning,
            toast: toast,
            // straight to console; bypass toastr
            log: $log.log
        };

        return service;
        /////////////////////

        function error(message, data) {
            //toastr.error(message, title);
            $log.error('Error: ' + message, data, self.user);
        }

        function info(message, data) {           
            $log.info('Info: ' + message, data);
        }

        function toast(message, toastTime) {
            var simpleToast = $mdToast.build({
                hideDelay: toastTime,
                position: 'bottom left',
                template: '<md-toast>' +
                             '<div class="md-toast-content" dir="rtl">' +
                                message +
                             '</div>' +
                          '</md-toast>'
            });
            $mdToast.show(simpleToast);
            return simpleToast;
        }

        function success(message, data, title) {
            $log.info('Success: ' + message, data);
        }

        function warning(message, data, title) {
            //toastr.warning(message, title);
            $log.warn('Warning: ' + message, data);
        }

        function setUser(user) {
            self.user = user;
        }
    }
}());