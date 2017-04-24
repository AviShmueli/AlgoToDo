(function () {
    'use strict';
    
    angular
        .module('app.widgets')
        .controller('verificationCodeCtrl', verificationCodeCtrl);

    function verificationCodeCtrl($scope, userId, $mdDialog, $timeout, DAL) {
        $scope.showButton = false;

        $scope.counter = 20;
        $scope.onTimeout = function () {
            if ($scope.counter > 1) {
                $scope.counter--;
                mytimeout = $timeout($scope.onTimeout, 1000);
            }
            else {
                $scope.showButton = true;
                $scope.counter = 20;
                $timeout.cancel(mytimeout);
            }
        }
        var mytimeout = $timeout($scope.onTimeout, 1000);

        $scope.hide = function () {
            $mdDialog.hide();
        };

        $scope.cancel = function () {
            $mdDialog.cancel();
        };

        $scope.resend = function () {
            DAL.reSendVerificationCodeToUser(userId);
            mytimeout = $timeout($scope.onTimeout, 1000);
            $scope.showButton = false;
        };

        $scope.answer = function (answer) {
            $mdDialog.hide(answer);
        };

    }

})();