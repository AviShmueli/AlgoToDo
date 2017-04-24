(function () {
    'use strict';

    angular
        .module('app.cordova')
        .service('browserNotification', browserNotification);

    browserNotification.$inject = ['$rootScope', 'webNotification', '$location', '$timeout'];

    function browserNotification($rootScope, webNotification, $location, $timeout) {

        var self = this;

        var showNotification = function myfunction(title, body, id) {

            var snd = new Audio('/images/alert.mp3');
            snd.play();

            webNotification.showNotification(title, {
                body: body,
                data: id,
                icon: '/images/web_hi_res_512.png', // document.location.protocol + '//' + document.location.host + '/favicon.ico';
                onClick: function onNotificationClicked(event) {
                    
                    
                    window.focus();

                    $timeout(function () {
                        var taskId = event.currentTarget.data;
                        $location.path('/task/' + taskId);
                    }, 300);                   
                },
                autoClose: 6000 
            }, function onShow(error, hide) {
                if (error) {
                    window.alert('Unable to show notification: ' + error.message);
                } else {
                    
                    console.log('Notification Shown.');

                    /*setTimeout(function hideNotification() {
                        console.log('Hiding notification....');
                        hide(); //manually close the notification (you can skip this if you use the autoClose option)
                    }, 5000);*/
                }
            });
        }


        var service = {
            showNotification: showNotification
        };

        return service;
    }
})();

