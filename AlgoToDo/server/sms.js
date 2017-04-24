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


    function sendSms(verificationCode, phone) {

        var d = deferred();

        var params = {
            'src': '972540000000', // Sender's phone number with country code
            'dst' : phone, // Receiver's phone Number with country code
            'text' : "קוד הזיהוי שלך הוא " + verificationCode + '\n' + 'בברכה מערכת Asiti.'/*, 
            'url' : "http://example.com/report/", // The URL to which with the status of the message is sent
            'method' : "GET" // The method used to call the url*/
        };

        p.send_message(params, function (status, response) {
            if (status === 202) {
               logger.log('info', 'Sucsessfuly send SMS via Pvilo To: ' , phone);
               d.resolve();
            }
            else{
                logger.log('error', 'Erorr while trying to send SMS via Pvilo ', null);
                d.reject();
            }
            
        });

        return d.promise;
    }



})(module.exports);