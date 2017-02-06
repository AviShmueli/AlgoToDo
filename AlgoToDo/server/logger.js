(function (logger) {

    logger.log = log;

    var winston = require('winston');
    require('winston-loggly-bulk');

     winston.add(winston.transports.Loggly, {
        token: "301ae60a-8898-4a29-8dd0-cfd69ba095f5",
        subdomain: "doneit",
        tags: ["Winston-NodeJS"],
        json:true
    });

    function log(type, message, object){
        winston.log(type, message, object);
    }

})(module.exports);