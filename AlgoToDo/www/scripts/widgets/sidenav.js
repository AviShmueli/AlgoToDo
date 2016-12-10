(function () {
    'use strict';

    angular
        .module('app.widgets')
        .directive('tmSidenav', sidenav);

    function sidenav() {
        var directive = {
            controller: sidenavController,
            controllerAs: 'vm',
            templateUrl: 'scripts/widgets/sidenav.html',
            restrict: 'A',
            scope: {
                'user': '=',
                'imagesPath': '=',
                'logOff': '&'
            }
        };

        function sidenavController($scope, cordovaPlugins) {
            var vm = this;

            vm.imagesPath = $scope.imagesPath;
            vm.user = $scope.user;
            vm.logOff = $scope.logOff;
            vm.appVersion = '';

            document.addEventListener("deviceready", function () {
                cordovaPlugins.getAppVersion().then(function (version) {
                    vm.appVersion = version;
                });
            }, false);

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