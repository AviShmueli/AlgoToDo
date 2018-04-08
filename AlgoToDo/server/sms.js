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

    p.options.host = 'api.plivo.io';

    /*
    // Twilio Credentials 
    var accountSid = 'AC5a82a1b07a0819d89d8e938e963dde6a';
    var authToken = 'b95532342ca769e166c90ba899d2cf79';

    //require the Twilio module and create a REST client 
    var client = require('twilio')(accountSid, authToken);
    */

    function sendSms(verificationCode, phone) {

        var d = deferred();

        var params = {
            'src': '972540000000', // Sender's phone number with country code
            'dst': phone, // Receiver's phone Number with country code
            'text': "קוד הזיהוי שלך הוא " + verificationCode + '\n' + 'בברכה מערכת ToDo.'
            /*, 
                        'url' : "http://example.com/report/", // The URL to which with the status of the message is sent
                        'method' : "GET" // The method used to call the url*/
        };

        p.send_message(params, function (status, response) {
            if (status === 202) {
                logger.log('info', 'Sucsessfuly send SMS via Pvilo To: ', phone);
                d.resolve();
            } else {
                logger.log('error', 'Erorr while trying to send SMS via Pvilo ', null);
                d.reject();
            }

        });

        /*
        client.messages.create({
            to: phone,
            from: "6206444015",
            body: "קוד הזיהוי שלך הוא " + verificationCode + '\n' + 'בברכה מערכת Asiti.',
        }, function (err, message) {
            if (err === null) {
                logger.log('info', 'Sucsessfuly send SMS via Pvilo To: ', phone);
                d.resolve();
            }
            else{
                logger.log('error', 'Erorr while trying to send SMS via Pvilo ', null);
                d.reject();
            }
            
        });*/

        return d.promise;
    }



})(module.exports);