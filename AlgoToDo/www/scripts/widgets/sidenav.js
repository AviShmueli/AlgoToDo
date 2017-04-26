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

        function sidenavController($scope, device, cordovaPlugins, $location,
                                   $mdSidenav, $mdDialog, DAL, logger,
                                   contactsSync, $interval) {
            var vm = this;

            vm.imagesPath = $scope.imagesPath;
            vm.user = $scope.user;
            vm.logOff = $scope.logOff;
            vm.cancelAllNotifications = $scope.cancelAllNotifications;
            vm.appVersion = '';
            vm.showLogoffButton = false;
            vm.expand_icon = 'add_circle';

            document.addEventListener("deviceready", function () {
                device.getAppVersion().then(function (version) {
                    vm.appVersion = version;
                });
            }, false);

            vm.goToManagementPage = function () {
                $location.path('/management');
            };

            vm.goToRepeatTasksPage = function () {
                $location.path('/repeatsTasks');
            };

            vm.shareApp = function () {
                cordovaPlugins.shareApp();
            };

            vm.rateApp = function () {
                cordovaPlugins.rateApp();
            };

            vm.closeSidenav = function () {
                $mdSidenav("left").close();
            };

            vm.showAddCliqaDialog = function () {
                var confirm = $mdDialog.prompt()
                  .parent(angular.element(document.querySelector('#VerificationCodePromptContainer')))
                  .title('קליקה חדשה')
                  .placeholder('איך תרצה לקרוא לקליקה?')
                  .ariaLabel('cliqaName')
                  .ok('הוסף');

                $mdDialog.show(confirm).then(function (cliqaName) {
                    if (cliqaName !== undefined && cliqaName !== '') {
                        DAL.createNewCliqa(cliqaName).then(function () {
                            cordovaPlugins.showToast("הקליקה נוצרה בהצלחה!", 2000);
                        }, function (error) {
                            logger.error("error while trying to add new cliqa", error);
                        });
                    }
                });
            };

            vm.sendBroadcastUpdateAlert = function (paltform) {
                $mdDialog.show(
                  $mdDialog.prompt()
                    .parent(angular.element(document.querySelector('#CliqaAlertContainer')))
                    .clickOutsideToClose(true)
                    .title('עדכן את כל משתמשי ' + paltform + ' על עדכון גירסה')
                    .placeholder('איזו גירסה?')
                    .ariaLabel('Alert Dialog Demo')
                    .ok('שלח')
                    .cancel('בטל')
                ).then(function (version) {
                    vm.closeSidenav();
                    DAL.sendBroadcastUpdateAlert(paltform, version).then(function (result) {
                        if (device.isMobileDevice()) {
                            cordovaPlugins.showToast("עדכון נשלח ל " + result.data + " משתמשים", 2000);
                        }
                        else {
                            logger.toast("עדכון נשלח ל " + result.data + " משתמשים", 2000);
                        }
                    }, function (error) {
                        logger.error(error);
                    });
                });
            };

            vm.admin = [{
                link: '',
                title: 'רוקן משימות',
                icon: 'delete'
            }, {
                link: 'vm.showListBottomSheet($event)',
                title: 'הגדרות',
                icon: 'settings'
            }];           

            vm.goToContactsListPage = function () {
                $location.path('/contactsList');
            }

            vm.goToCliqaPage = function (id) {
                $location.path('/cliqa/' + id);
            }
        }

        return directive;
    }
})();