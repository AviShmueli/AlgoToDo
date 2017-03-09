(function () {
    'use strict';

    angular
        .module('app.data')
        .service('dropbox', dropbox);

    dropbox.$inject = ['$rootScope', 'appConfig', 'storage', '$q', 'logger'];

    function dropbox($rootScope, appConfig, storage, $q, logger) {

        var self = this;

        self.ACCESS_TOKEN = "8dz3NrXtpJAAAAAAAAABWyprYJjYKAg9mXOfA7pX7qAUmGr156zlzZg-pNMnIcrB";
        self.dbx = new Dropbox({ accessToken: self.ACCESS_TOKEN });
        
        var uploadFile = function (fileName, file) {
            var uploadOption = { path: '/' + fileName, contents: file, autorename: true };
            return self.dbx.filesUpload(uploadOption);
        }

        var downloadFile = function (fileName) {
            return self.dbx.sharingCreateSharedLink({ path: '/' + fileName, short_url: false });
        }

        var getThumbnail = function (fileName, ThumbnailSize) {
            return self.dbx.filesGetThumbnail({ path: '/' + fileName, size: ThumbnailSize });
        }
 
        var getSharedLinkFile = function(_url){
            return self.dbx.sharingGetSharedLinkFile({ url: _url });
        }

        var uploadNewImageToDropbox = function (newPath, fileName, newFileName) {

            var deferred = $q.defer();

            storage.getFileFromStorage(newPath, fileName)
                .then(function (base64File) {

                    // convert the base 64 image to blob
                    var imageData = base64File.replace(/^data:image\/\w+;base64,/, "");
                    var blob = b64toBlob(imageData, 'image/jpg');
                    //var blonewFileUrlbUrl = URL.createObjectURL(blob);

                    var reader = new FileReader();
                    reader.onload = (function (file_reader) {
                        uploadFile(newFileName, file_reader).then(function (response) {
                            deferred.resolve(newFileName);
                        })
                        .catch(function (error) {
                            logger.error("error while trying to upload file to dropbox", error);
                            deferred.reject(error);
                        });
                    })(blob);
                }, function (error) {
                    logger.error("error while trying to get File From Storage", error);
                    deferred.reject(error);
                });
            return deferred.promise;
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
        }

        var deleteFile = function (fileName) {
            self.dbx.filesDelete({ path: '/' + fileName }).then(function (s) {
                var a = s;
            });
        }

        return {
            uploadFile: uploadFile,
            deleteFile: deleteFile,
            downloadFile: downloadFile,
            getThumbnail: getThumbnail,
            getSharedLinkFile: getSharedLinkFile,
            uploadNewImageToDropbox: uploadNewImageToDropbox
        };

    }
})();
