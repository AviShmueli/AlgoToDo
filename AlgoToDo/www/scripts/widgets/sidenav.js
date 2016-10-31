(function () {
    'use strict';

    angular
        .module('TaskManeger.widgets')
        .directive('tmSidenav', sidenav);

    function sidenav() {
        var directive = {
            controller: sidenavController,
            controllerAs: 'vm',
            templateUrl: 'scripts/widgets/sidenav.html',
            restrict: 'A',
            scope: {
                'user': '=',
                'appDomain': '=',
                'logOff': '&'
            },
        };

        function sidenavController($scope) {
            var vm = this;

            vm.appDomain = $scope.appDomain;
            vm.user = $scope.user;
            vm.logOff = $scope.logOff;

            vm.menu = [{
                link: '',
                title: 'דוחות',
                icon: 'dashboard'
            }, {
                link: '',
                title: 'עובדים',
                icon: 'group'
            }, {
                link: '',
                title: 'הודעות',
                icon: 'message'
            }];

            vm.admin = [{
                link: '',
                title: 'רוקן משימות',
                icon: 'delete'
            }, {
                link: 'vm.showListBottomSheet($event)',
                title: 'הגדרות',
                icon: 'settings'
            }];
        }

        return directive;
    }
})();