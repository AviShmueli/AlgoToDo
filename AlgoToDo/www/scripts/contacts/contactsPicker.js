(function () {
    'use strict';

    angular
        .module('app').directive('focusOn', function () {
            return function (scope, elem, attr) {
                scope.$on(attr.focusOn, function (e) {
                    elem[0].focus();
                });
            };
        });

    angular
        .module('app.contacts')
        .controller('contactsPickerCtrl', contactsPickerCtrl);

    function contactsPickerCtrl($scope, existingContacts, /* updateList,*/ $mdDialog,
        datacontext, $mdMedia, $q, logger,
        device, DAL, $offlineHandler, $timeout,
        appConfig, common, cordovaPlugins, contactsSync,
        $interval) {

        var dvm = this;

        dvm.isSmallScrean = $mdMedia('sm');
        $timeout(function () {
            dvm.imagesPath = device.getImagesPath();
            dvm.user = datacontext.getUserFromLocalStorage();
            dvm.contactsList = angular.copy(datacontext.getAllCachedUsers());
        }, 0)
        dvm.selectedContactsList = [];
        dvm.search = '';
        dvm.showSearch = false;
        dvm.existingContacts = existingContacts;

        dvm.updateList = function () {
            dvm.contactsList = angular.copy(datacontext.getAllCachedUsers());
        };

        dvm.focus = function () {
            $timeout(function () {
                $scope.$broadcast('focusSearch');
            }, 0);
        };

        dvm.getLocalPhoneFormat = function (phone) {
            if (phone !== undefined) {
                return phoneUtils.formatNational(phone, appConfig.region)
            }
            return '';
        }

        dvm.getUsersInGroupAsString = function (usersInGroup) {
            if (usersInGroup === undefined) {
                return '';
            }
            var usersInGroupString = '',
                userFirstName, splitedName;
            for (var i = 0; i < usersInGroup.length; i++) {
                splitedName = usersInGroup[i].name.split(" ");
                userFirstName = splitedName !== undefined && splitedName.length > 0 ?
                    splitedName[0] : usersInGroup[i].name;
                usersInGroupString += userFirstName + ', ';
            }
            return usersInGroupString.substring(0, usersInGroupString.length - 2);
        }


        dvm.startTime;
        dvm.timerPromise;
        dvm.totalElapsedMs = 0;
        dvm.elapsedMs = 0;

        dvm.startTimer = function (contact) {
            console.log("start");
            if (!dvm.timerPromise) {
                dvm.startTime = new Date();
                dvm.timerPromise = $interval(function () {
                    var now = new Date();
                    //$scope.time = now;
                    dvm.elapsedMs = now.getTime() - dvm.startTime.getTime();
                }, 31);
            }
        };

        dvm.stopTimer = function (contact) {
            console.log("stop");
            if (dvm.timerPromise) {
                $interval.cancel(dvm.timerPromise);
                dvm.timerPromise = undefined;
                dvm.totalElapsedMs += dvm.elapsedMs;
                console.log(dvm.totalElapsedMs + dvm.elapsedMs);
                dvm.startTime = new Date();
                dvm.totalElapsedMs = dvm.elapsedMs = 0;
            }
        };

        dvm.isLong = false;
        dvm.addContactToSelectedContactsList = function (clickType, contact) {
            console.log(clickType, dvm.isLong, contact.name);
            if (contact.exist || (clickType === 'click' && dvm.isLong === true)) {
                return;
            }
            if (clickType === 'click' && dvm.selectedContactsList.length === 0 && dvm.isLong === false) {
                dvm.selectedContactsList.push(contact);
                dvm.save();
                return;
            }
            if (clickType === 'long' && dvm.selectedContactsList.length === 0 && device.isMobileDevice()) {
                dvm.isLong = true;
                $timeout(function () {
                    device.vibrate(50);
                }, 100);
                $timeout(function () {
                    dvm.isLong = false;
                }, 800)
            }
            if (contact.selected) {
                contact.selected = false;
                var index = common.arrayObjectIndexOf(dvm.selectedContactsList, '_id', contact._id);
                if (index !== -1) {
                    dvm.selectedContactsList.splice(index, 1);
                }
            } else {
                contact.selected = true;
                dvm.selectedContactsList.push(contact);
            }
        }

        dvm.shareApp = function () {
            cordovaPlugins.shareApp();
        };

        dvm.openContactsNativeUI = function () {
            device.pickContactUsingNativeUI();
        }

        dvm.syncingContacts = false;
        dvm.syncContactsIcon = 'sync';
        dvm.inProgressTimer;
        dvm.syncContacts = function () {
            dvm.syncingContacts = true;
            dvm.inProgressTimer = $interval(function () {
                dvm.syncContactsIcon = (dvm.syncContactsIcon === 'sync') ?
                    dvm.syncContactsIcon = 'loop' :
                    dvm.syncContactsIcon = 'sync';
            }, 1000);
            contactsSync.syncPhoneContactsWithServer().then(function (contactSyncCount) {
                $interval.cancel(dvm.inProgressTimer);
                cordovaPlugins.showToast(contactSyncCount + " אנשי קשר סונכרנו בהצלחה", 4000);
                dvm.updateList();
                dvm.syncingContacts = false;
            }, function (error) {
                $interval.cancel(dvm.inProgressTimer);
                cordovaPlugins.showToast("אירעה שגיאה בסנכרון אנשי הקשר שלך, אנא נסה שנית", 4000);
            });
        };

        dvm.showHelpAlert = function (ev) {

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

        dvm.hide = function () {
            $mdDialog.hide();
        };

        dvm.cancel = function () {
            $mdDialog.cancel();
        };

        dvm.save = function () {
            $mdDialog.hide(dvm.selectedContactsList);
        };

        /*dvm.searchKeypress = function ($event) {
            var a = dvm.search + $event.key;
        }*/
    }

})();