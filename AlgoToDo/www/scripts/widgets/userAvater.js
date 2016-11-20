(function() {
    'use strict';

    angular
        .module('app.widgets')
        .directive('userAvatar', function() {
            return {
                replace: true,
                templateUrl: '/scripts/widgets/userAvater.svg'
            };
        });
})();