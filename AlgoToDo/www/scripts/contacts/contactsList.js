(function () {
    'use strict';

    angular
        .module('app.contacts')
        .controller('contactsListCtrl', contactsListCtrl);

    contactsListCtrl.$inject = ['$rootScope', '$scope', 'logger', '$q', 'storage',
                                'datacontext', 'moment', 'device', '$mdDialog',
                                'contactsSync', '$offlineHandler', '$location', 'cordovaPlugins',
                                '$interval', 'appConfig'
    ];

    function contactsListCtrl($rootScope, $scope, logger, $q, storage,
                        datacontext, moment, device, $mdDialog,
                        contactsSync, $offlineHandler, $location, cordovaPlugins,
                        $interval, appConfig) {

        var vm = this;
        vm.imagesPath = device.getImagesPath();
        vm.IOStempDirectory = device.getIOStempDirectory();
        vm.isDialogOpen = false;
        vm.user = datacontext.getUserFromLocalStorage();
        vm.contactsList = datacontext.getAllCachedUsers();

        angular.element(document.querySelectorAll('html')).removeClass("hight-auto");

        vm.goBack = function () {
            $location.path('/tasksList');
        };

        vm.updateList = function () {
            vm.contactsList = datacontext.getAllCachedUsers();
        };

        vm.syncContactsIcon = 'sync';
        vm.inProgressTimer;
        vm.syncContacts = function () {
            vm.inProgressTimer = $interval(function () {
                vm.syncContactsIcon = (vm.syncContactsIcon === 'sync') ?
                    vm.syncContactsIcon = 'loop' :
                    vm.syncContactsIcon = 'sync';
            }, 1000);
            contactsSync.syncPhoneContactsWithServer().then(function (contactSyncCount) {
                $interval.cancel(vm.inProgressTimer);
                cordovaPlugins.showToast(contactSyncCount + " אנשי קשר סונכרנו בהצלחה", 4000);
                vm.updateList();
            }, function (error) {
                $interval.cancel(vm.inProgressTimer);
                cordovaPlugins.showToast("אירעה שגיאה בסנכרון אנשי השר שלך, אנא נסה שנית", 4000);
            });
        };

        vm.getLocalPhoneFormat = function (phone) {
            if (phone !== undefined) {
                return phoneUtils.formatNational(phone, appConfig.region)
            }
            return '';
        }

        vm.getCliqotNamesAsString = function (cliqot) {
            if (cliqot === undefined) {
                return '';
            }
            var cliqotString = '';
            for (var i = 0; i < cliqot.length; i++) {
                cliqotString += cliqot[i].name + ', ';
            }
            return cliqotString.substring(0, cliqotString.length - 2);
        }

        vm.addGroup = function (ev) {
            $mdDialog.show({
                controller: 'addGroupDialogCtrl',
                controllerAs: 'vm',
                templateUrl: 'scripts/contacts/addGroupDialog.html',
                targetEvent: ev,
                fullscreen: true,
                clickOutsideToClose: true,
                locals: {
                    contact: null,
                    updateList: function () { }
                //    calledFromIntent: calledFromIntent
                }
            }).then(function () {
                
            });
        }

        vm.editGroup = function (contact, ev) {
            $mdDialog.show({
                controller: 'addGroupDialogCtrl',
                controllerAs: 'vm',
                templateUrl: 'scripts/contacts/addGroupDialog.html',
                targetEvent: ev,
                fullscreen: true,
                clickOutsideToClose: true,
                locals: {
                    contact: contact,
                    updateList: vm.updateList,
                //    calledFromIntent: calledFromIntent
                }
            }).then(function () {

            });
        }

        vm.getUsersInGroupAsString = function (usersInGroup) {
            if (usersInGroup === undefined) {
                return '';
            }
            var usersInGroupString = '', userFirstName, splitedName;
            for (var i = 0; i < usersInGroup.length; i++) {
                splitedName = usersInGroup[i].name.split(" ");
                userFirstName = splitedName !== undefined && splitedName.length > 0 ?
                                splitedName[0] : usersInGroup[i].name;
                usersInGroupString += userFirstName  + ', ';
            }
            return usersInGroupString.substring(0, usersInGroupString.length - 2);
        }
            
        /*
        vm.showAdd = function (ev) {
            vm.isDialogOpen = true;
            $mdDialog.show({
                controller: 'repeatsTaskDialog',
                controllerAs: 'vm',
                templateUrl: 'scripts/tasks/repeatsTaskDialog.html',
                targetEvent: ev,
                fullscreen: true,
                locals: {
                    taskToEdit: {},
                    updateList: function () { }
                }
            }).then(function () {
                vm.isDialogOpen = false;
                vm.repeatsTasks = datacontext.getRepeatsTasksList();
            });

            document.addEventListener("deviceready", function () {
                document.addEventListener("backbutton", backbuttonClick_FromAddRepeatTask_Callback, false);
            }, false);
        };

        var backbuttonClick_FromAddRepeatTask_Callback = function (e) {
            e.preventDefault();
            $mdDialog.cancel();
            vm.isDialogOpen = false;
            document.removeEventListener("backbutton", backbuttonClick_FromAddRepeatTask_Callback, false);
        };

        var backbuttonClick_allways_Callback1 = function (e) {
            if (vm.isDialogOpen) {
                e.preventDefault();
                return;
                // do nothing - dialog will be closed
            }
            if ($location.path() === '/tasksList') {
                e.preventDefault();
                if (!vm.exitApp) {
                    vm.exitApp = true;
                    cordovaPlugins.showToast("הקש שוב ליציאה", 1000);
                    $timeout(function () { vm.exitApp = false; }, 1000);
                } else {
                    window.plugins.toast.hide();
                    navigator.app.exitApp();
                }
            }
            else {
                window.history.back();
            }
        };

        document.addEventListener("deviceready", function () {
            document.addEventListener("backbutton", backbuttonClick_allways_Callback1, false);
        }, false);
        */
    }

})();
