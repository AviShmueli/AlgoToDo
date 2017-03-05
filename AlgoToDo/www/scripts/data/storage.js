(function () {
    'use strict';

    angular
        .module('app.data')
        .service('storage', storage);

    storage.$inject = ['$cordovaFile', '$q', 'logger'];

    function storage($cordovaFile, $q, logger) {

        var self = this;

        var saveFileToStorage = function (taskId, fileName, downloadUrl) {
            var deferred = $q.defer();

            //var dataDirectory = (cordova.platformId.toLowerCase() === 'ios') ? cordova.file.dataDirectory : cordova.file.externalDataDirectory;
            var folderpath = getRootDirectory() + 'Asiti/' + taskId + "/" + fileName;
            var uri = encodeURI(downloadUrl.replace("?dl=0", "?dl=1"));

            var fileTransfer = new FileTransfer();
            fileTransfer.download(uri,folderpath,function (entry) {
                    deferred.resolve(entry.toURL());
                },
                function (error) {
                    logger.error("error while trying to download source", error);
                    deferred.reject(error);
                },
                false,
                {}
            );

            return deferred.promise;
        }

        var getFileFromStorage = function (path, fileName) {           
            return $cordovaFile.readAsDataURL(path, fileName);                             
        }

        var moveFileToAppFolder = function (fileUrl, oldFileName, newPath, newFileName) {
            var deferred = $q.defer();
            $cordovaFile.checkDir(getRootDirectory(), newPath)
              .then(function (success) {
                  $cordovaFile.copyFile(fileUrl, oldFileName, getRootDirectory() + newPath, newFileName).then(function (success) {
                      var s = success;
                      deferred.resolve(s);
                  }, function (error) {
                      var e = error;
                      deferred.reject(e);
                  });
              }, function (error) {
                  $cordovaFile.createDir(getRootDirectory(), newPath, false)
                    .then(function (success) {
                        $cordovaFile.copyFile(fileUrl, oldFileName, getRootDirectory() + newPath, newFileName).then(function (success) {
                            var s = success;
                            deferred.resolve(s);
                        }, function (error) {
                            var e = error;
                            deferred.reject(e);
                        });
                    }, function (error) {
                        var e = error;
                        deferred.reject(e);
                    });
              });
            return deferred.promise;
        }

        var checkIfFileExists = function (folder, file) {
            return $cordovaFile.checkFile(encodeURI(folder), encodeURI(file));
        }

        var copyLocalFile = function (sourceDir, sourceFileName, distDir, distFileName) {
            return $cordovaFile.copyFile(sourceDir, sourceFileName, distDir, distFileName);
        }

        var getRootDirectory = function () {
            if (cordova.platformId.toLowerCase() === 'ios') {
                return cordova.file.documentsDirectory; // for iOS
            } else {
                return cordova.file.externalRootDirectory; // for Android
            }
        }

        return {
            saveFileToStorage: saveFileToStorage,
            getFileFromStorage: getFileFromStorage,
            moveFileToAppFolder: moveFileToAppFolder,
            checkIfFileExists: checkIfFileExists,
            copyLocalFile: copyLocalFile,
            getRootDirectory: getRootDirectory
        };

    }
})();
