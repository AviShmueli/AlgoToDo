(function() {
    'use strict';

    angular
        .module('TaskManeger.widgets')
        .directive('userAvatar', function() {
            return {
                replace: true,
                templateUrl: 'scripts/widgets/userAvater.svg'
            };
        });
})();