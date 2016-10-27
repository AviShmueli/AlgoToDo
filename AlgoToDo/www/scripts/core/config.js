(function() {
    'use strict';

    angular.module('TaskManeger.core')
        .config(function ($mdThemingProvider) {
            var customBlueMap = $mdThemingProvider.extendPalette('light-blue', {
                'contrastDefaultColor': 'light',
                'contrastDarkColors': ['50'],
                '50': 'ffffff'
            });
            $mdThemingProvider.definePalette('customBlue', customBlueMap);
            $mdThemingProvider.theme('default')
                .primaryPalette('cyan', {
                    'default': '500',
                    'hue-1': '50'
                })
                .accentPalette('deep-orange', {
                    'default': '400', // by default use shade 400 from the pink palette for primary intentions
                    'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
                    'hue-2': 'A400',
                    'hue-3': 'A700'
                });
            $mdThemingProvider.theme('input', 'default')
                .primaryPalette('grey');
        })
        .service('appConfig', function () {
            var self = this;

            self.registrationId = '';

            return {
                appDomain: 
                     'https://algotodo.herokuapp.com'
                    //'http://localhost:5001' 
                , getRegistrationId: function () { return self.registrationId }
                , setRegistrationId: function (newValue) { self.registrationId = newValue }
            }
        });;

})();