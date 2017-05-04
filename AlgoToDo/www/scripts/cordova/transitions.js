(function () {
    'use strict';

    angular
        .module('app.cordova')
        .service('$transitions', transitions);

    transitions.$inject = ['$rootScope', '$q', 'device'];

    function transitions($rootScope, $q, device) {

        var self = this;

        self.slideOptions = {
            "direction": "left", // 'left|right|up|down', default 'left' (which is like 'next')
            "duration": 400, // in milliseconds (ms), default 400
            "slowdownfactor": -1, // overlap views (higher number is more) or no overlap (1). -1 doesn't slide at all. Default 4
            "slidePixels": 1, // optional, works nice with slowdownfactor -1 to create a 'material design'-like effect. Default not set so it slides the entire page.
            "iosdelay": 60, // ms to wait for the iOS webview to update before animation kicks in, default 60
            "androiddelay": 70, // same as above but for Android, default 70
            "winphonedelay": 250, // same as above but for Windows Phone, default 200,
            "fixedPixelsTop": 0, // the number of pixels of your fixed header, default 0 (iOS and Android)
            "fixedPixelsBottom": 0  // the number of pixels of your fixed footer (f.i. a tab bar), default 0 (iOS and Android)
        };

        self.flipOptions = {
            "direction": "left", // 'left|right|up|down', default 'right' (Android currently only supports left and right)
            "duration": 600, // in milliseconds (ms), default 400
            "iosdelay": 50, // ms to wait for the iOS webview to update before animation kicks in, default 60
            "androiddelay": 70,  // same as above but for Android, default 70
            "winphonedelay": 150 // same as above but for Windows Phone, default 200
        };

        self.fadeOptions = {
            "duration": 600, // in milliseconds (ms), default 400
            "iosdelay": 50, // ms to wait for the iOS webview to update before animation kicks in, default 60
            "androiddelay": 100
        };

        self.drawerOptions = {
            "origin": "left", // 'left|right', open the drawer from this side of the view, default 'left'
            "action": "open", // 'open|close', default 'open', note that close is not behaving nicely on Crosswalk
            "duration": 300, // in milliseconds (ms), default 400
            "iosdelay": 50 // ms to wait for the iOS webview to update before animation kicks in, default 60
        };

        var drawer = function (origin) {

            self.drawerOptions.origin = origin;

            if (device.isMobileDevice()) {
                window.plugins.nativepagetransitions.drawer(self.drawerOptions);
            }
        }

        var fade = function () {

            if (device.isMobileDevice()) {
                window.plugins.nativepagetransitions.fade(self.fadeOptions);
            }
        }

        var flip = function (direction) {

            self.flipOptions.direction = direction;

            if (device.isMobileDevice()) {   
                window.plugins.nativepagetransitions.flip(self.flipOptions);
            }
        }

        var slide = function (direction) {

            self.slideOptions.direction = direction;

            if (device.isMobileDevice()) {            
                window.plugins.nativepagetransitions.slide(self.slideOptions);
            }
        }

        var service = {
            slide: slide,
            flip: flip,
            fade: fade,
            drawer: drawer
        };

        return service;
    }
})();

