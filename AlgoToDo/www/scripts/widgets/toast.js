(function () {
    'use strict';

    angular
        .module('app.widgets')
        .factory('$toast', toast);

    function toast($mdToast) {

        var self = this;

        function showSimpleToast(message, toastTime) {
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

        function showActionToast(textContent, actionText, toastTime) {
            var toast = $mdToast.simple()
              .textContent(textContent)
              .action(actionText)
              .highlightAction(true)
              .highlightClass('md-accent')// Accent is used by default, this just demonstrates the usage.
              .position('bottom left')
              .hideDelay(toastTime);

            return $mdToast.show(toast);
        };

        var service = {
            showSimpleToast: showSimpleToast,
            showActionToast: showActionToast
        };

        return service;
    }
}());