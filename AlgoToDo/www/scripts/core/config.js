(function() {
    'use strict';

    angular.module('app.core')
        .config(function ($routeProvider, $mdThemingProvider, $compileProvider,
                          $animateProvider, LogglyLoggerProvider, $mdGestureProvider,
                          CMRESLoggerProvider) {

            CMRESLoggerProvider.setElasticSearchConfig({
                'host': 'https://xeyy2hb9:ulq4oyqfknu76lvm@aralia-7697095.eu-west-1.bonsaisearch.net',
                'apiVersion': '1.7'
            });

            CMRESLoggerProvider.setLogConfig({
                'index': 'algotodo2',
                'type': 'jslog',
                'bufferSize': 2500,
                'flushIntervalInMS': 3000
            });

            CMRESLoggerProvider.setApplicationLogContext({
                'appNameTag': 'algotodo',
                'envTag': 'Development'
            });

            LogglyLoggerProvider.inputToken('301ae60a-8898-4a29-8dd0-cfd69ba095f5').sendConsoleErrors(true);
            $compileProvider.debugInfoEnabled(false);
            $mdGestureProvider.skipClickHijack();
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
                  templateUrl: 'scripts/tasks/tasksList.html'
              })
              .when('/task/:taskId', {
                  templateUrl: 'scripts/tasks/task.html'
              })
              .when('/signUp', {
                  templateUrl: 'scripts/widgets/signUp.html'
              });;
         })
        .service('appConfig', function () {
            var self = this;

            return {
                appDomain:
                   'https://algotodo.herokuapp.com'
                   //'https://algotodo-test.herokuapp.com'
                  //  'http://localhost:5001'
            };
        })
        .run(function (amMoment, datacontext, cordovaPlugins) {
            //init();
            datacontext.reloadAllTasks();
            amMoment.changeLocale('he');
        });

})();
