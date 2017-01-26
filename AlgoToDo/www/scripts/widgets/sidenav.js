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
                'logOff': '&',
                'cancelAllNotifications': '&'
            }
        };

        function sidenavController($scope, device, cordovaPlugins) {
            var vm = this;

            vm.imagesPath = $scope.imagesPath;
            vm.user = $scope.user;
            vm.logOff = $scope.logOff;
            vm.cancelAllNotifications = $scope.cancelAllNotifications;
            vm.appVersion = '';
            vm.showLogoffButton = false;
            
            document.addEventListener("deviceready", function () {
                device.getAppVersion().then(function (version) {
                    vm.appVersion = version;
                });
            }, false);

            vm.goToManagementPage = function () {
                window.location = '#/management'
            }

            vm.shareApp = function (platform) {
                cordovaPlugins.shareApp(platform);
            }

            vm.rateApp = function () {
                cordovaPlugins.rateApp();
            }

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