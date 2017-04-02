(function (sms) {

    sms.sendSms = sendSms;

    var logger = require('./logger');
    var moment = require('moment-timezone');
    var deferred = require('deferred');
    var plivo = require('plivo');
    
    var p = plivo.RestAPI({
        authId: 'MAY2I0ZJZIZTZMNTU0MT',
        authToken: 'ZDUxNjNhOWNlNjliYWVjNGYyNDhlYTc4MWExNTE0'
    });


    function sendSms() {

        var d = deferred();

        var params = {
            'src': '972542240608', // Sender's phone number with country code
            'dst' : '972549256856', // Receiver's phone Number with country code
            'text' : "קוד הזיהוי שלך הוא 8899", 
            'url' : "http://example.com/report/", // The URL to which with the status of the message is sent
            'method' : "GET" // The method used to call the url
        };

        p.send_message(params, function (status, response) {
            console.log('Status: ', status);
            console.log('API Response:\n', response);
            console.log('Message UUID:\n', response['message_uuid']);
            console.log('Api ID:\n', response['api_id']);
            d.resolve();
        });

        return d.promise;
    }



})(module.exports);