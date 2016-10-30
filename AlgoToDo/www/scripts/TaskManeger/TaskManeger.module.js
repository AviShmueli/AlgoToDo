(function() {
    'use strict';

    angular.module('TaskManeger', [
        /*
         * Order is not important. Angular makes a
         * pass to register all of the modules listed
         * and then when app.dashboard tries to use app.data,
         * it's components are available.
         */
        'ngMaterial',
        'ngMdIcons',
        'ngCookies',
        'ngStorage',
        'ngLodash',
        'ngCordova',
        'ngMessages',
        'ngAnimate',
        'angularMoment',

        /*
         * Everybody has access to these.
         * We could place these under every feature area,
         * but this is easier to maintain.
         */
        'TaskManeger.widgets',
        'TaskManeger.core',
        'TaskManeger.data',
        'TaskManeger.logger',
        'TaskManeger.cordova'
        
        /*
         * Feature areas
         */

    ]);
})();