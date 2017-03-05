angular.module('app.directives', []).directive('ngSpeechRecognitionStart', function ($timeout, $rootScope, device) {
    return {
        restrict: 'A',
        link: function ($scope, $element, $attrs) {
            var recognition;
            if (!device.isMobileDevice()) {
                recognition = new webkitSpeechRecognition();
            }
            else {
                recognition = new SpeechRecognition();
            }
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'he-IL';

            recognition.onerror = errorFunc;
            /*recognition.onaudiostart = errorFunc;
            recognition.onsoundstart = errorFunc;
            recognition.onspeechstart = errorFunc;
            recognition.onspeechend = errorFunc;
            recognition.onsoundend = errorFunc;
            recognition.onaudioend = errorFunc;
            recognition.onresult = errorFunc;
            recognition.onnomatch = errorFunc;
            recognition.onstart = errorFunc;*/
            recognition.onend = errorFunc;

            var errorFunc = function (error) {
                if (!device.isMobileDevice()) {
                    recognition = new webkitSpeechRecognition();
                }
                else {
                    recognition = new SpeechRecognition();
                }
                recognition.continuous = true;
                recognition.interimResults = false;
                recognition.lang = 'he-IL';
            }

            var recognitionIsAlreadyCalled = false;

            $element.bind('touchstart mousedown', function (event) {
                $scope.isHolded = true;

                $timeout(function () {
                    if ($scope.isHolded) {
                        $scope.$apply(function () {

                            if ($attrs.ngSpeechRecognitionStart) {
                                $scope.$eval($attrs.ngSpeechRecognitionStart)
                            }

                            if (recognitionIsAlreadyCalled === false) {
                                recognitionIsAlreadyCalled = true;
                                recognition.start();
                            }
                        });
                    }
                }, 100);
            });

            $element.bind('touchend mouseup', function (event) {
                $scope.isHolded = false;

                if ($attrs.ngSpeechRecognitionEnd) {
                    $scope.$apply(function () {

                        recognition.onresult = function (event) {

                            if (event.results[0][0].transcript !== undefined) {
                                $rootScope.transcript = event.results[0][0].transcript;

                                if (typeof $rootScope.transcript === 'string') {
                                    $scope.$eval($attrs.ngSpeechRecognitionEnd);
                                }
                            }
                        }
                        recognition.stop();
                        recognitionIsAlreadyCalled = false;
                    });
                }
            });
        }
    };
})