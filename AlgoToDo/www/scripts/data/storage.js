(function () {
    'use strict';

    angular
        .module('app.data')
        .service('storage', storage);

    storage.$inject = ['$cordovaFile', '$q', 'datacontext'];

    function storage($cordovaFile, $q, datacontext) {

        var self = this;

        var saveFileToStorage = function (fileName, downloadUrl) {
            var deferred = $q.defer();
            var dirToSavedImage = (datacontext.getDeviceDetailes().platform === 'iOS')? cordova.file.tempDirectory: cordova.file.externalCacheDirectory;

            var folderpath = dirToSavedImage + fileName;

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
                    console.log("download error source " + error.source);
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

        var moveFileToAppFolder = function(fileUrl, newFileName){
            return $cordovaFile.moveFile(fileUrl, fileUrl.substring(fileUrl.lastIndexOf('/') + 1), cordova.file.dataDirectory, newFileName);
        }

        return {
            saveFileToStorage: saveFileToStorage,
            getFileFromStorage: getFileFromStorage,
            moveFileToAppFolder: moveFileToAppFolder
        };

    }
})();
