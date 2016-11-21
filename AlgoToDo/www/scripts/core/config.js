(function() {
    'use strict';

    angular.module('app.core')
        .config(function ($routeProvider, $mdThemingProvider, $compileProvider, $animateProvider, LogglyLoggerProvider) {
            LogglyLoggerProvider.inputToken('666c914a-b76a-4aff-8c61-f7d45d681abf').sendConsoleErrors(true);
            $compileProvider.debugInfoEnabled(false);
            //$animateProvider.classNameFilter(/\banimated\b/);
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

            $routeProvider.
              when('/', {
                  templateUrl: 'scripts/tasks/tasksList.html',
                  controller: 'TasksListCtrl'
              })
              .when('/task/:taskId', {
                  templateUrl: 'scripts/tasks/task.html',
                  controller: 'taskCtrl'
              });
         })
        .service('appConfig', function () {
            var self = this;

            return {
                appDomain:
                     'https://algotodo.herokuapp.com'
               // 'http://localhost:5001'  
            };
        })
        .run(function (amMoment) {
            amMoment.changeLocale('he');
        });

})();