(function () {
    'use strict';

    /*
*
*  <a tm-contact-touch contact-id="{{contact._id}}" callback="dvm.addContactToSelectedContactsList" />
*
*/

    angular
            .module('app').directive('tmContactTouch', function ($interval) {
                return function (scope, elem, attr) {

                    scope.startTime;
                    scope.timerPromise;
                    scope.totalElapsedMs = 0;
                    scope.elapsedMs = 0;

                    elem.on('touchstart', function (e) {
                        scope.startContactId = attr.contactId;

                        console.log("start");
                        if (!scope.timerPromise) {
                            scope.startTime = new Date();
                            scope.timerPromise = $interval(function () {
                                var now = new Date();
                                //$scope.time = now;
                                scope.elapsedMs = now.getTime() - scope.startTime.getTime();
                            }, 31);
                        }
                    });

                    elem.on('touchend', function (e) {


                        scope.endContactId = attr.contactId;


                        if (scope.timerPromise) {
                            $interval.cancel(scope.timerPromise);
                            scope.timerPromise = undefined;
                            scope.totalElapsedMs += scope.elapsedMs;
                            console.log(scope.totalElapsedMs);
                            if (scope.endContactId === scope.startContactId) {
                                if (scope.totalElapsedMs > 400) {
                                    scope.$watch(attr.callback, function (callback) {
                                        callback('long', scope.endContactId);
                                    });
                                }
                                else {
                                    scope.$watch(attr.callback, function (callback) {
                                        callback('click', scope.endContactId);
                                    });
                                }
                            }

                            scope.startTime = new Date();
                            scope.totalElapsedMs = scope.elapsedMs = 0;
                        }
                    });
                };
            });

})();