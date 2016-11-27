(function () {
    'use strict';

    angular
        .module('app.widgets')
        .directive('tmSignUp', signUp);

    function signUp() {
        var directive = {
            controller: signUpController,
            controllerAs: 'vm',
            templateUrl: 'scripts/widgets/signUp.html',
            restrict: 'A',
            scope: {
                'user': '=',
                'signUp': '&'
            }
        };

        function signUpController($scope) {
            var vm = this;

            vm.inProgress = false;
            vm.user = $scope.user;
            vm.signUp = $scope.signUp;

            vm.signMeUp = function () {
                if (vm.inProgress === false) {
                    vm.inProgress = true;
                    vm.signUp();
                }
            }
        }

        return directive;
    }
})();