(function () {
    'use strict';

    angular
        .module('app.contacts')
        .service('contactsSync', contactsSync);

    contactsSync.$inject = ['device', 'datacontext', 'appConfig', 'logger', '$q',
                            'DAL', 'common', '$timeout', 'storage'];

    function contactsSync(device, datacontext, appConfig, logger, $q,
                          DAL, common, $timeout, storage) {


        var self = this;

        self.region = appConfig.region;
        self.phone_contact_map = {};
        self.imagesPath = device.getImagesPath();
        self.deferred = $q.defer();
        self.currentNumber = '';
        

        var syncPhoneContactsWithServer = function () {

            self.deferred = $q.defer();

            getAllUserCliqotContacts().then(function () {

                if (!device.isMobileDevice()) {
                    $timeout(function () {
                        self.deferred.resolve();
                    }, 0); 
                }
                else{
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
                }
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
                        name: contact.displayName !== null ? contact.displayName : contact.name.formatted,
                        phone: user.phone,
                        avatarUrl: user.avatarUrl //self.imagesPath + user.avatarUrl
                        //cliqot: user.cliqot || ''
                    };
                    

                    if (contact.photos !== null && contact.photos.length > 0) {
                        var filePath = contact.photos[0].value;
                        // in Android - tack the contact photo
                        if (filePath.startsWith('file://') || filePath.startsWith('content://')) {
                            crossUser.avatarUrl = contact.photos[0].value ;
                        }
                        else{    
                            // in iOS - do nothing for now
                            
                            /*filePath =  "file://" + filePath;            
                            var splitedPath = filePath.split('/');
                            var fileName = splitedPath[splitedPath.length - 1]; //cordova.file.tempDirectory + 
                            var path = filePath.substring(0, filePath.indexOf(fileName));

                            
                            storage.copyLocalFile(path, fileName, storage.getRootDirectory() + 'Asiti/Asiti Images/contacts/' , fileName).then(function(fileNewPath){
                                alert(fileNewPath);
                                //crossUser.avatarUrl = fileNewPath ;
                            });*/
                        }
                    }
                    console.log(crossUser);
                    appUsers.push(crossUser);
                }
                if (appUsers.length > 0) {
                    datacontext.addUsersToUsersCache(appUsers, true);
                    datacontext.sortUsersByfrequencyOfUse();
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
            var index = common.arrayObjectIndexOf(allCachedUsers, '_id', localUser._id);
            if (index !== -1) {
                user = allCachedUsers[index];
            }
            if (user !== undefined && user.avatarUrl !== undefined) {
                localUser.avatarUrl = user.avatarUrl;
                datacontext.saveUserToLocalStorage(localUser);
            }
        }

        var getAllUserCliqotContacts = function () {

            var deferred = $q.defer();

            var user = datacontext.getUserFromLocalStorage();

            DAL.searchUsers('', user).then(function (response) {
                var usersList = response.data;
                for (var i = 0; i < usersList.length; i++) {
                    usersList[i]['avatarUrl'] = usersList[i].avatarUrl; //self.imagesPath + usersList[i].avatarUrl;
                }
                datacontext.addUsersToUsersCache(usersList, true);
                deferred.resolve();
            }, function (error) {
                if (error.status === -1) {
                    error.data = "App lost connection to the server";
                }
                logger.error('Error while trying to search Users: ', error.data || error);
                deferred.resolve();
            });

            return deferred.promise;
        }

        var service = {
            syncPhoneContactsWithServer: syncPhoneContactsWithServer
        };

        return service;
    }

})();