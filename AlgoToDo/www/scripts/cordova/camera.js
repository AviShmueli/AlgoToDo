(function () {
    'use strict';

    angular
        .module('app.cordova')
        .service('camera', camera);

    camera.$inject = ['$rootScope', 'datacontext', '$log', '$cordovaCamera'];

    function camera($rootScope, datacontext, $log, $cordovaCamera) {

        var self = this;

        var takePicture = function (sourceType) {
            var _sourceType = sourceType === 'camera' ? Camera.PictureSourceType.CAMERA : Camera.PictureSourceType.PHOTOLIBRARY;
            var isSamsungDevice = datacontext.getDeviceDetailes() !== undefined && datacontext.getDeviceDetailes().manufacturer === "samsung";

            var options = {
                quality: 100,
                destinationType: Camera.DestinationType.FILE_URI,
                sourceType: _sourceType,
                allowEdit: isSamsungDevice,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: isSamsungDevice ? 1500 : window.innerWidth,
                targetHeight: isSamsungDevice ? 1500 : window.innerHeight,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: true,
                correctOrientation: true
            };

            return $cordovaCamera.getPicture(options);
        }

        var cleanupAfterPictureTaken = function () {
            $cordovaCamera.cleanup();
        }

        var service = {
            takePicture: takePicture,
            cleanupAfterPictureTaken: cleanupAfterPictureTaken
        };

        return service;
    }
})();
