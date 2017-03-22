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

        var syncPhoneContactsWithServer = function () {

            self.deferred = $q.defer();

            if (!device.isMobileDevice()) {
                //self.deferred.reject();
            }

            device.getContacts('').then(function (allContacts) {

                var phoneNumbers = [], contact;

                for (var i = 0; i < allContacts.length; i++) {

                    contact = allContacts[i];

                    if (contact.phoneNumbers !== null && contact.phoneNumbers.length > 0) {
                        for (var j = 0; j < contact.phoneNumbers.length; j++) {
                            var phoneNumber = contact.phoneNumbers[j].value;

                            if (phoneUtils.getNumberType(phoneNumber, self.region) === 'MOBILE') {
                                var internatianalFormat = phoneUtils.formatInternational(phoneNumber, self.region);
                                self.phone_contact_map[internatianalFormat] = contact;
                                phoneNumbers.push(internatianalFormat);
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
                        name: user.name,
                        phone: user.phone,
                        avatarUrl: user.avatarUrl,
                        displayName: contact.displayName,
                        photo: self.imagesPath + user.avatarUrl
                    };

                    if (contact.photos !== null && contact.photos.length > 0) {
                        crossUser.photo = contact.photos[0].value;
                    }
                    appUsers.push(crossUser);
                }
                if (appUsers.length > 0) {
                    datacontext.addUsersToUsersCache(appUsers, true);
                    self.deferred.resolve(appUsers.length);                 
                }
            }, function (error) {
                if (error.status === -1) {
                    error.data = "App lost connection to the server";
                }
                logger.error('Error while trying to get Users By PhoneNumbers: ', error.data || error);
                self.deferred.reject(error);
            });
        }

        var service = {
            syncPhoneContactsWithServer: syncPhoneContactsWithServer
        };

        return service;
    }

})();