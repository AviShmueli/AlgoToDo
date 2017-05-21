(function () {
    'use strict';

    angular
        .module('app.contacts')
        .controller('contactsListCtrl', contactsListCtrl);

    contactsListCtrl.$inject = ['$rootScope', '$scope', 'logger', '$q', 'storage',
                                'datacontext', 'moment', 'device', '$mdDialog',
                                'contactsSync', '$offlineHandler', '$location', 'cordovaPlugins',
                                '$interval', 'appConfig', '$timeout'
    ];

    function contactsListCtrl($rootScope, $scope, logger, $q, storage,
                        datacontext, moment, device, $mdDialog,
                        contactsSync, $offlineHandler, $location, cordovaPlugins,
                        $interval, appConfig, $timeout) {

        var vm = this;
        
        vm.isDialogOpen = false;

        $timeout(function () {
            vm.imagesPath = device.getImagesPath();
            vm.user = datacontext.getUserFromLocalStorage();
            vm.contactsList = datacontext.getAllCachedUsers();
        }, 0);


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
                cordovaPlugins.showToast("אירעה שגיאה בסנכרון אנשי הקשר שלך, אנא נסה שנית", 4000);
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
          
        vm.shareApp = function () {
            cordovaPlugins.shareApp();
        };

        vm.openContactsNativeUI = function () {
            device.pickContactUsingNativeUI();
        }

        vm.showHelpAlert = function (ev) {

            $mdDialog.show({
                controllerAs: 'dialogCtrl',
                controller: function ($mdDialog) {
                    this.hide = function () {
                        $mdDialog.hide();
                    }
                },
                preserveScope: true,
                autoWrap: true,
                skipHide: true,
                clickOutsideToClose: true,
                template: '<md-dialog aria-label="Mango (Fruit)" class="confirm"><md-dialog-content dir="rtl"> <div class="md-dialog-content"> <h2>עזרה באנשי קשר</h2> אם אינך רואה אנשי קשר ברשימה לחץ/י על כפתור הסנכרון בכדי לייבא אנשי קשר מספר הטלפונים שלך.<br/><br/> אם עדיין נתקלת בבעיה ניתן לפנות לתמיכה במייל avis@algo.bz <br/><br/> <button class="md-primary md-confirm-button md-button md-default-theme md-ink-ripple float-left" type="button" ng-click="dialogCtrl.hide()" md-autofocus="dialog.$type===\'alert\'"><span>תודה!</span></button> </div> </md-dialog-content></md-dialog>'
            });
        };
    }

})();
