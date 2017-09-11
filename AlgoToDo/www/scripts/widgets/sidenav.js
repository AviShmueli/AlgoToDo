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
            restrict: 'AE'
        };

        function sidenavController($rootScope, $scope, device, cordovaPlugins, $location,
                                   $mdSidenav, $mdDialog, DAL, logger,
                                   contactsSync, $interval, datacontext,
                                   appConfig, $timeout, MAIN_CLIQA_ID) {
            var vm = this;

            vm.imagesPath = device.getImagesPath();
            vm.showUserCliqot = false;
            vm.MAIN_CLIQA_ID = MAIN_CLIQA_ID;

            $scope.$watch(function () { return datacontext.getUserFromLocalStorage() }, function (oldVal, newVal) {
                vm.user = newVal;
                vm.imagesPath = device.getImagesPath();
            },true);

            $scope.$watch('vm.user', function (oldVal) {
                if(vm.user){
                    if(vm.user.type === 'system-admin'){
                        vm.showUserCliqot = true;
                    }
                    if(vm.user.cliqot && vm.user.cliqot.length){
                        for (var index = 0; index < vm.user.cliqot.length; index++) {
                            var cliqa = vm.user.cliqot[index];
                            if(cliqa._id !== MAIN_CLIQA_ID){
                                vm.showUserCliqot = true;
                            }
                        }
                    }
                }
            },true);


            
            vm.appVersion = '';
            vm.showLogoffButton = false;
            vm.expand_icon = 'expand_more';

            vm.showSideNav = function () {
                return $location.path() !== '/signUp' && $location.path() !== '/logIn';
            }

            vm.logOff = function () {
                vm.closeSidenav();
                datacontext.deleteUserFromLocalStorage();
                datacontext.deleteAllCachedUsers();
                datacontext.deleteTaskListFromLocalStorage();
                datacontext.deleteRepeatsTaskListFromLocalStorage();
                cordovaPlugins.clearAppBadge();
                if(device.isMobileDevice()) {
                    DAL.saveUsersNewRegistrationId('', vm.user);
                }
                $location.path('/logIn');
                vm.user = undefined;          
            };

            vm.appVersion = appConfig.appVersion;
            document.addEventListener("deviceready", function () {
                device.getAppVersion().then(function (version) {
                    vm.appVersion = version;
                });
            }, false);

            vm.goToManagementPage = function () {
                vm.closeSidenav();
                $timeout(function() {
                    $location.path('/management');
                }, 0);
            };

            vm.goToRepeatTasksPage = function () {
                vm.closeSidenav();
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

            vm.showAddCliqaDialog = function (ev) {
                var confirm = $mdDialog.prompt()
                  .parent(angular.element(document.querySelector('#VerificationCodePromptContainer')))
                  .title('קליקה חדשה')
                  .placeholder('איך תרצה לקרוא לקליקה?')
                  .ariaLabel('cliqaName')
                  .targetEvent(ev)
                  .ok('הוסף')
                  .cancel('בטל');

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
            }       

            vm.goToContactsListPage = function () {
                vm.closeSidenav();
                $timeout(function () {
                    $location.path('/contactsList');
                }, 0);
            }

            vm.goToCliqaPage = function (id) {
                vm.closeSidenav();
                $location.path('/cliqa/' + id);
            }
        }

        return directive;
    }
})();