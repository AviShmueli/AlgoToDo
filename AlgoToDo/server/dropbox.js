(function (dropbox) {

    dropbox.downloadFile = downloadFile;
    dropbox.getThumbnail = getThumbnail;

    var Dropbox = require('dropbox');
    var dbx = new Dropbox({ accessToken: "8dz3NrXtpJAAAAAAAAABWyprYJjYKAg9mXOfA7pX7qAUmGr156zlzZg-pNMnIcrB" });

    function downloadFile (fileName) {
        return dbx.sharingCreateSharedLink({ path: '/' + fileName, short_url: false });
    }

    function getThumbnail (fileName, ThumbnailSize) {
        return dbx.filesGetThumbnail({ path: '/' + fileName, size: ThumbnailSize });
    }


})(module.exports);