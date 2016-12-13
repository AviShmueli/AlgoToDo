(function () {
    'use strict';

    angular
        .module('app.data')
        .service('storage', storage);

    storage.$inject = ['$cordovaFile', '$q', 'datacontext', 'logger'];

    function storage($cordovaFile, $q, datacontext, logger) {

        var self = this;

        var saveFileToStorage = function (fileName, downloadUrl) {
            var deferred = $q.defer();
            var dirToSavedImage = (datacontext.getDeviceDetailes().platform === 'iOS') ? cordova.file.dataDirectory : cordova.file.externalDataDirectory;

            var folderpath = dirToSavedImage + 'pictures/' + fileName;

            var fileTransfer = new FileTransfer();
            var uri = encodeURI(downloadUrl.replace("?dl=0","?dl=1"));

            fileTransfer.download(
                uri,
                folderpath,
                function (entry) {
                    deferred.resolve(entry.toURL());
                    //console.log("download complete: " + entry.toURL());
                },
                function (error) {
                    logger.error("download error source " , error);
                    deferred.reject(error);
                },
                false,
                {
                        
                }
            );

            return deferred.promise;
        }

        var getFileFromStorage = function (path, fileName) {           
            return $cordovaFile.readAsDataURL(path, fileName);                             
        }

        /*function savebase64AsImageFile(folderpath, filename, content, contentType) {
            // Convert the base64 string in a Blob
            var DataBlob = b64toBlob(content, contentType);

            console.log("Starting to write the file :3");

            window.resolveLocalFileSystemURL(folderpath, function (dir) {
                console.log("Access to the directory granted succesfully");
                dir.getFile(filename, { create: true }, function (file) {
                    console.log("File created succesfully.");
                    file.createWriter(function (fileWriter) {
                        console.log("Writing content to file");
                        fileWriter.write(DataBlob);
                    }, function () {
                        alert('Unable to save file in path ' + folderpath);
                    });
                });
            });
        }

        function b64toBlob(b64Data, contentType, sliceSize) {
            contentType = contentType || '';
            sliceSize = sliceSize || 512;

            var byteCharacters = atob(b64Data);
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);

                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                var byteArray = new Uint8Array(byteNumbers);

                byteArrays.push(byteArray);
            }

            var blob = new Blob(byteArrays, { type: contentType });
            return blob;
        }*/

        var moveFileToAppFolder = function (fileUrl, oldFileName, newPath, newFileName) {
            var deferred = $q.defer();
            $cordovaFile.checkDir(cordova.file.externalDataDirectory, newPath)
              .then(function (success) {
                  $cordovaFile.copyFile(fileUrl, oldFileName, cordova.file.externalDataDirectory + newPath, newFileName).then(function (success) {
                      var s = success;
                      deferred.resolve(s);
                  }, function (error) {
                      var e = error;
                      deferred.reject(e);
                  });
              }, function (error) {
                  $cordovaFile.createDir(cordova.file.externalDataDirectory, newPath, false)
                    .then(function (success) {
                        $cordovaFile.copyFile(fileUrl, oldFileName, cordova.file.externalDataDirectory + newPath, newFileName).then(function (success) {
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


                /*$cordovaFile.createDir(cordova.file.dataDirectory, 'pictures', false)
                    .then(function (success) {
                        var s = success;
                    }, function (error) {
                        var e = error;
                    });*/

        return {
            saveFileToStorage: saveFileToStorage,
            getFileFromStorage: getFileFromStorage,
            moveFileToAppFolder: moveFileToAppFolder
        };

    }
})();
