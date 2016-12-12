(function () {
    'use strict';

    angular
        .module('app.data')
        .service('dropbox', dropbox);

    dropbox.$inject = ['$rootScope', 'appConfig'];

    function dropbox($rootScope, appConfig) {

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

        return {
            uploadFile: uploadFile,
            downloadFile: downloadFile,
            getThumbnail: getThumbnail,
            getSharedLinkFile: getSharedLinkFile
        };

    }
})();
