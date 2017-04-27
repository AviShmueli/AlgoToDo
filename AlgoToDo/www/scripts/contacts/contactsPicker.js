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

    function contactsPickerCtrl($scope, /*contact, updateList,*/ $mdDialog,
                                datacontext, $mdMedia, $q, logger,
                                device, DAL, $offlineHandler, $timeout,
                                appConfig, common) {

        var vm = this;
        
        vm.isSmallScrean = $mdMedia('sm');
        vm.imagesPath = device.getImagesPath();
        vm.user = datacontext.getUserFromLocalStorage();
        vm.contactsList = angular.copy(datacontext.getAllCachedUsers());
        vm.selectedContactsList = [];
        vm.search = '';
        vm.showSearch = false;

        vm.focus = function () {
            $timeout(function () {
                $scope.$broadcast('newItemAdded');
            }, 0)
        };

        vm.getLocalPhoneFormat = function (phone) {
            if (phone !== undefined) {
                return phoneUtils.formatNational(phone, appConfig.region)
            }
            return '';
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
                usersInGroupString += userFirstName + ', ';
            }
            return usersInGroupString.substring(0, usersInGroupString.length - 2);
        }

        vm.addContactToSelectedContactsList = function (contact) {
            if (contact.selected) {
                contact.selected = false;
                var index = common.arrayObjectIndexOf(vm.selectedContactsList, '_id', contact._id);
                if (index !== -1) {
                    vm.selectedContactsList.splice(index, 1);
                }
            }
            else {
                contact.selected = true;
                vm.selectedContactsList.push(contact);
            }
        }

        vm.hide = function () {
            $mdDialog.hide();
        };

        vm.cancel = function () {
            $mdDialog.cancel();
        };

        vm.save = function () {
            $mdDialog.hide(vm.selectedContactsList);
        };
    }

})();
