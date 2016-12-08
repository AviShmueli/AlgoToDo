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

            self.dbx.sharingCreateSharedLink({ path: '/avi.jpg', short_url: false })
                  .then(function (response) {
                      console.log(response);
                      self.dbx.sharingGetSharedLinkFile({ url: response.url })
                          .then(function (response) {
                              console.log(response);
                              var downloadUrl = URL.createObjectURL(response.fileBlob);
                              var downloadButton = document.createElement('a');
                              downloadButton.setAttribute('href', downloadUrl);
                              downloadButton.setAttribute('download', response.name);
                              downloadButton.setAttribute('class', 'button');
                              downloadButton.innerText = 'Download: ' + response.name;
                              document.getElementById('results').src = downloadButton;
                          })
                          .catch(function (error) {
                              console.error(error);
                          });
                  })
                  .catch(function (error) {
                      console.error(error);
                  });   
        }

        var getThumbnail = function (fileName, ThumbnailSize) {
            return self.dbx.filesGetThumbnail({ path: '/' + fileName, size: ThumbnailSize });
        }

        return {
            uploadFile: uploadFile,
            downloadFile: downloadFile,
            getThumbnail: getThumbnail
        };

    }
})();