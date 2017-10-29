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

            var folderpath = getRootDirectory() + 'Asiti/Media/Asiti Images/' + taskId + "/" + fileName;

            if (downloadUrl.startsWith("content://")) {
                resolveAndDownloadNativePath(downloadUrl, folderpath).then(function (entry) {
                    deferred.resolve(entry.toURL());
                },
                function (error) {
                    logger.error("error while trying to download source", error);
                    deferred.reject(error);
                });
            }
            else{                       
                downloadUrl = downloadUrl.replace("?dl=0", "?dl=1");
                var fileTransfer = new FileTransfer();
                downLoadFile(downloadUrl, folderpath).then(function (entry) {
                    deferred.resolve(entry.toURL());
                },
                function (error) {
                    logger.error("error while trying to download source", error);
                    deferred.reject(error);
                });
            }

            return deferred.promise;
        }

        var getFileFromStorage = function (path, fileName) {
            var deferred = $q.defer();
            if (path.startsWith("content://")) {
                var fileURL = getRootDirectory() + 'Asiti/Media/Asiti Images/temp/' + fileName;
                resolveAndDownloadNativePath(path + fileName, fileURL).then(function (entry) {
                    var url = entry.toURL();
                    var splitedPath = url.split('/');
                    var fileName = splitedPath[splitedPath.length - 1];
                    var path = url.substring(0, url.indexOf(fileName));

                    readAsDataURL(path, fileName).then(function (base64File) {
                        deferred.resolve(base64File);
                    }, function (error) {
                        deferred.reject(error);
                    })
                }, function (error) {
                    deferred.reject(error);
                });
            }
            else {
                readAsDataURL(path, fileName).then(function (base64File) {
                    deferred.resolve(base64File);
                }, function (error) {
                    deferred.reject(error);
                });
            }
            return deferred.promise;
        }

        var readAsDataURL = function (path, fileName) {
            return $cordovaFile.readAsDataURL(path, fileName);
        }

        var resolveAndDownloadNativePath = function (path, fileURL) {
            var deferred = $q.defer();

            document.addEventListener("deviceready", function () {
                window.FilePath.resolveNativePath(path, function (filePath) {                

                    // remove "file://" from file path
                    filePath = filePath.substring(7);

                    downLoadFile(filePath, fileURL).then(function (entry) {                   
                        deferred.resolve(entry);
                    });
                
                }, function (error) {
                    deferred.reject(error);
                });
            }, false);

            return deferred.promise;
        }

        var downLoadFile = function (from, to) {
            var deferred = $q.defer();

            var fileTransfer = new FileTransfer();
            var uri = encodeURI(from);

            fileTransfer.download(
                uri,
                to,
                function (entry) {
                    deferred.resolve(entry);
                },
                function (error) {
                    logger.error("error while trying to download source", error);
                    deferred.reject(error);
                }, false, {}
            );

            return deferred.promise;
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

        var getAutorizationFromUser = function () {

            var deferred = $q.defer();

            document.addEventListener("deviceready", function () {
                var permissions = cordova.plugins.permissions;
                var list = [
                  permissions.READ_EXTERNAL_STORAGE,
                  permissions.WRITE_EXTERNAL_STORAGE
                ];

                permissions.hasPermission(list, function (status) {
                    if (!status.hasPermission) {
                        
                        // ask for the first time
                        permissions.requestPermissions(
                          list,
                          function (status) {
                              if (!status.hasPermission) {
                                  // ask for the second time
                                  permissions.requestPermissions(
                                    list,
                                    function (status) {
                                        deferred.resolve();
                                    },
                                    function () {
                                        deferred.reject()
                                    });
                              }
                              else {
                                  deferred.resolve();
                              }
                          },
                          function () {
                              deferred.reject()
                          });
                    }
                    else {
                        deferred.resolve();
                    }
                }, function () {
                    deferred.reject()
                });
            }, false);

            return deferred.promise;
        }

        return {
            saveFileToStorage: saveFileToStorage,
            getFileFromStorage: getFileFromStorage,
            moveFileToAppFolder: moveFileToAppFolder,
            checkIfFileExists: checkIfFileExists,
            copyLocalFile: copyLocalFile,
            getRootDirectory: getRootDirectory,
            getAutorizationFromUser: getAutorizationFromUser
        };

    }
})();
