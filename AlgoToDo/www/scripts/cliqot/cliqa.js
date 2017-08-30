(function () {
    'use strict';

    angular
        .module('app.cliqot')
        .controller('cliqaCtrl', cliqaCtrl);

    cliqaCtrl.$inject = ['$rootScope', '$scope', 'logger', '$q', 'storage',
                                'datacontext', 'moment', 'device', '$mdDialog',
                                'DAL', '$offlineHandler', '$location', 'cordovaPlugins',
                                '$interval', 'appConfig', '$routeParams', 'common'
    ];

    function cliqaCtrl($rootScope, $scope, logger, $q, storage,
                        datacontext, moment, device, $mdDialog,
                        DAL, $offlineHandler, $location, cordovaPlugins,
                        $interval, appConfig, $routeParams, common) {

        var vm = this;
        var cliqaId = $routeParams.cliqaId;
        vm.imagesPath = device.getImagesPath();
        vm.isDialogOpen = false;
        vm.user = datacontext.getUserFromLocalStorage();
        
        vm.existingContacts = [];

        angular.element(document.querySelectorAll('html')).removeClass("hight-auto");
        vm.loadingContacts = true;
        DAL.getUsersInCliqa(cliqaId).then(function (response) {
            vm.loadingContacts = false;
            vm.contactsList = response.data;
            for (var i = 0; i < vm.contactsList.length; i++) {
                vm.existingContacts.push(vm.contactsList[i]._id);
            }
        });

        vm.goBack = function () {
            $location.path('/tasksList');
        };

        vm.updateList = function () {
            vm.contactsList = datacontext.getAllCachedUsers();
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

        vm.addUserToCliqa = function (ev) {
            $mdDialog.show({
                controller: 'contactsPickerCtrl',
                controllerAs: 'dvm',
                templateUrl: 'scripts/contacts/contactsPicker.tmpl.html',
                targetEvent: ev,
                fullscreen: true,
                clickOutsideToClose: true,
                locals: {
                    existingContacts: vm.existingContacts
                    //updateList: function () { }
                    //    calledFromIntent: calledFromIntent
                }
            }).then(function (selectedContacts) {
                
                DAL.addUsersToCliqa({_id: cliqaId, name: vm.cliqaName}, selectedContacts).then(function (response) {
                    if (response.data === 'ok') {
                        logger.toast('הפעולה בוצעה בהצלחה', 700);
                        vm.contactsList = vm.contactsList.concat(selectedContacts);
                    }
                    else{
                        logger.error('error while trying to add users to cliqa');
                    }
                }, function (error) {
                    logger.error('error while trying to add users to cliqa: ', error.data || error);
                });
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
                usersInGroupString += userFirstName + ', ';
            }
            return usersInGroupString.substring(0, usersInGroupString.length - 2);
        }

        var getCliqaName = function () {
            var index = common.arrayObjectIndexOf(vm.user.cliqot, '_id', cliqaId);
            if (index !== -1) {
                return vm.user.cliqot[index].name;
            }
            return '';
        }

        vm.cliqaName = getCliqaName();

    }

})();
