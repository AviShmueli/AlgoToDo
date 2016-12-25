(function() {
    'use strict';

    angular
        .module('app.logger')
        .factory('logger', logger);

    logger.$inject = ['$log', '$mdToast', '$mdDialog'];

    function logger($log, $mdToast, $mdDialog) {
        var service = {
            showToasts: true,

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
            $log.error('Error: ' + message, data);
            shoeErrorOcurredAlert(message + ' \n ***' + data)
        }

        function info(message, data) {           
            $log.info('Info: ' + message, data);
        }

        function toast(message, data, toastTime) {
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

        var shoeErrorOcurredAlert = function (error) {
            $mdDialog.show(
              $mdDialog.alert()
                .parent(angular.element(document.querySelector('#popupContainer')))
                .clickOutsideToClose(true)
                .title('????? ?????')
                .textContent('???????! ????? ????? ?????????, ???? ????? ??? ????? ?? ????? ???? ?? ???? ????? ????? ??? ????? 0542240608 ?? ????? avis@algo.bz , ????? ?? ?? ?????? ??????, ??? ???? ????? ?? ????? ????? ??????. ' + error)
                .ariaLabel('Alert Dialog Demo')
                .ok('?????!')
                .targetEvent(ev)
            );
        }
    }
}());