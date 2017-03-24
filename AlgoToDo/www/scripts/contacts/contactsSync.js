(function () {
    'use strict';

    angular
        .module('app.contacts')
        .service('contactsSync', contactsSync);

    contactsSync.$inject = ['device', 'datacontext', 'appConfig', 'logger', '$q',
                            'DAL'];

    function contactsSync(device, datacontext, appConfig, logger, $q,
                          DAL) {


        var self = this;

        self.region = appConfig.region;
        self.phone_contact_map = {};
        self.imagesPath = device.getImagesPath();
        self.deferred = $q.defer();
        self.currentNumber = '';

        var syncPhoneContactsWithServer = function () {

            self.deferred = $q.defer();

            if (!device.isMobileDevice()) {
                self.deferred.reject();
            }

            device.getContacts('').then(function (allContacts) {

                var phoneNumbers = [], contact;

                for (var i = 0; i < allContacts.length; i++) {

                    contact = allContacts[i];
                    /*if (contact.displayName === 'אריאל חוברה') {
                        var aa = 11;
                    }*/
                    if (contact.phoneNumbers !== null && contact.phoneNumbers.length > 0) {
                        for (var j = 0; j < contact.phoneNumbers.length; j++) {
                            var phoneNumber = contact.phoneNumbers[j].value;
                            if (phoneNumber.startsWith('#31#')) {
                                phoneNumber = phoneNumber.substring(4);
                            }
                            self.currentNumber = phoneNumber;
                            try {
                                
                                if (isNumberValid(phoneNumber)) {
                                    var internatianalFormat = phoneUtils.formatInternational(phoneNumber, self.region);
                                    self.phone_contact_map[internatianalFormat] = contact;
                                    phoneNumbers.push(internatianalFormat);
                                }
                            }
                            catch (err) {
                                logger.error('Error while trying to get Number Type: ' + self.currentNumber, err.data || err);
                                self.deferred.reject(err);
                            }                            
                        }
                    }
                }

                crossContacts(phoneNumbers);
            }, function (error) {
                logger.error('Error while trying to get contacts list: ', error.data || error);
                self.deferred.reject(error);
            });

            return self.deferred.promise;
        };

        var crossContacts = function (phoneNumbers) {

            var appUsers = [];

            DAL.getUsersByPhoneNumbers(phoneNumbers).then(function (result) {
                for (var i = 0; i < result.data.length; i++) {
                    var user = result.data[i];
                    var contact = self.phone_contact_map[user.phone];
                    var crossUser = {
                        _id: user._id,
                        name: contact.displayName,
                        phone: user.phone,
                        avatarUrl: self.imagesPath + user.avatarUrl
                        //cliqot: user.cliqot || ''
                    };

                    if (contact.photos !== null && contact.photos.length > 0) {
                        crossUser.avatarUrl = contact.photos[0].value;
                    }
                    appUsers.push(crossUser);
                }
                if (appUsers.length > 0) {
                    datacontext.addUsersToUsersCache(appUsers, true);
                    updateUsersPhoto();
                }
                self.deferred.resolve(appUsers.length);
            }, function (error) {
                if (error.status === -1) {
                    error.data = "App lost connection to the server";
                }
                logger.error('Error while trying to get Users By PhoneNumbers: ', error.data || error);
                self.deferred.reject(error);
            });
        }

        var isNumberValid = function (phoneNumber) {
             
            if (phoneNumber.length < 8) {
                return false;
            }
            if (!phoneNumber.startsWith('+') && phoneNumber.length > 10) {
                return false;
            }
            if (!phoneUtils.isValidNumber(phoneNumber, self.region)) {
                return false;
            }
            if (phoneUtils.getNumberType(phoneNumber, self.region) !== 'MOBILE') {
                return false;
            }
            return true;
        }

        var updateUsersPhoto = function () {
            var localUser = datacontext.getUserFromLocalStorage();
            var allCachedUsers = datacontext.getAllCachedUsers();
            var user;
            var index = arrayObjectIndexOf(allCachedUsers, '_id', localUser._id);
            if (index !== -1) {
                user = allCachedUsers[index];
            }
            if (user !== undefined && user.avatarUrl !== undefined) {
                localUser.avatarUrl = user.avatarUrl;
                datacontext.saveUserToLocalStorage(localUser);
            }
        }

        function arrayObjectIndexOf(myArray, property, searchTerm) {
            for (var i = 0, len = myArray.length; i < len; i++) {
                if (myArray[i][property] === searchTerm) return i;
            }
            return -1;
        }


        var service = {
            syncPhoneContactsWithServer: syncPhoneContactsWithServer
        };

        return service;
    }

})();