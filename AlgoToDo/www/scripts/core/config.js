(function() {
    'use strict';

    angular.module('app.core')
        .config(function ($routeProvider, $mdThemingProvider, $compileProvider,
                          $animateProvider, LogglyLoggerProvider, $mdGestureProvider,
                          $cordovaAppRateProvider) {
            LogglyLoggerProvider.inputToken('301ae60a-8898-4a29-8dd0-cfd69ba095f5').sendConsoleErrors(true).includeUserAgent(true);
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
                  templateUrl: 'scripts/widgets/landingPage.html'
              })
              .when('/tasksList', {
                  templateUrl: 'scripts/tasks/tasksList.html'
              })
              .when('/task/:taskId', {
                  templateUrl: 'scripts/tasks/task.html'
              })
              .when('/management', {
                  templateUrl: 'scripts/management/management.html'
              })
              .when('/signUp', {
                  templateUrl: 'scripts/widgets/signUp.html'
              })
              .when('/repeatsTasks', {
                  templateUrl: 'scripts/tasks/repeatsTasks.html'
              })
              .when('/groupTask/:taskId', {
                  templateUrl: 'scripts/tasks/groupTask.html'
              })
              .otherwise({
                  templateUrl: 'scripts/widgets/landingPage.html'
              });

            document.addEventListener("deviceready", function () {

                var prefs = {
                    language: 'he',
                    appName: 'Asiti',
                    iosURL: '1188641206',
                    androidURL: 'market://details?id=com.algotodo.app'
                };

                $cordovaAppRateProvider.setPreferences(prefs);

            }, false);
         })
        .service('appConfig', function () {
            var self = this;

            return {
                appDomain:
                  // 'http://app.asiti.net'// 'https://algotodo.herokuapp.com'
                  'https://algotodo-test.herokuapp.com'
                  // 'http://localhost:5001'
            };
        })
        .run(function (amMoment, DAL, $offlineHandler) {
            //init();
            $offlineHandler.goOnline();
            //DAL.reloadAllTasks();
            amMoment.changeLocale('he');

            /*document.addEventListener('deviceready', function () {
                window.plugins.webintent.getExtra(window.plugins.webintent.EXTRA_STREAM, function (url) {
                    // url is the value of EXTRA_TEXT 
                    //alert(url);
                    var a = url;
                }, function () {
                    // There was no extra supplied.
                });
            }, false);*/
        });

})();
