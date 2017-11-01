/*jshint esversion: 6 */

(function (apnModule) {

    apnModule.createApnProvider = createApnProvider;
    apnModule.sendTaskViaApn = sendTaskViaApn;
    apnModule.sendCommentViaApn = sendCommentViaApn;
    apnModule.sendBroadcastUpdateAlert = sendBroadcastUpdateAlert;
    apnModule.sendReminderViaApn = sendReminderViaApn;
    apnModule.testPush = testPush;

    //var pfx = path.join(__dirname, './ApnCertificates/sandbox/Certificates.p12');
    //var cert = path.join(__dirname, './ApnCertificates/sandbox/cert.pem');
    //var key = path.join(__dirname, './ApnCertificates/sandbox/key.pem');

    var winston = require('../logger');
    var path = require('path');
    var apn = require('apn');
    var deferred = require('deferred');

    var APNsAuthKey = path.join(__dirname, './ApnCertificates/APNsAuthKey_DY2XKZ998J.p8'); // new
    //var APNsAuthKey = path.join(__dirname, './ApnCertificates/APNsAuthKey_JXZ3MBK8YA.p8');// old
    var pfx = path.join(__dirname, './ApnCertificates/production/prod_Certificates.p12');
    var cert = path.join(__dirname, './ApnCertificates/production/aps_prod_cert.pem');
    var key = path.join(__dirname, './ApnCertificates/production/aps_prod_key.pem');


    var apnProviderOptions = {
        token: {
            key: APNsAuthKey,
            keyId: "DY2XKZ998J",
            teamId: "TYMZRJ5DHP",
        },
        /*cert: cert,
        key: key,
        pfx: pfx,*/
        production: true,
        passphrase: 'avi3011algo',
        heartBeat: 30000
    };

    var apnProvider;

    function createApnProvider() {
        apnProvider = new apn.Provider(apnProviderOptions);
    }

    function sendTaskViaApn(task, userUnDoneTaskCount, ApnRegistrationId, isUpdate) {

        createApnProvider();

        var deviceTokenInHex = Buffer.from(ApnRegistrationId, 'base64').toString('hex');

        var note = new apn.Notification();

        note.priority = 10;
        note.topic = "com.algotodo.app";
        note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        note.contentAvailable = 1;

        if (isUpdate) {
            note.payload = {
                'additionalData': {
                    type: "task-update",
                    object: task,
                    taskId: task._id
                }
            };

            /*note.badge = null;
            note.sound = null;
            note.body = null;
            note.title = undefined;*/
        } else {
            note.payload = {
                'additionalData': {
                    type: "task",
                    object: task,
                    taskId: task._id
                }
            };

            note.badge = userUnDoneTaskCount;
            note.sound = "ping.aiff";
            note.body = task.description;
            note.title = "משימה חדשה מ" + task.from.name;

        }

        // Actually send the message
        apnProvider.send(note, ApnRegistrationId).then(function (response) {
            console.log("send message", note);

            if (response.failed.length > 0) {
                console.error("error while sending push notification to apple user: " + task.to || '', response.failed);
                winston.log('error', "error while sending push notification to apple user: " + task.to || '', response.failed);
            } else {
                console.log(response.sent);
                winston.log("info", "task have been send sucessfuly to user:", task);
            }
        });
    }

    function sendCommentViaApn(comment, task, ApnRegistrationId) {

        createApnProvider();

        var deviceTokenInHex = Buffer.from(ApnRegistrationId, 'base64').toString('hex');

        var note = new apn.Notification();

        note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        //note.badge = userUnDoneTaskCount;
        note.priority = 10;
        note.sound = "ping.aiff";
        //note.alert = "משימה חדשה מ" + task.from.name;//"\uD83D\uDCE7 \u2709 You have a new message";
        note.payload = {
            'additionalData': {
                type: "comment",
                object: comment,
                taskId: task._id
            }
        };
        //note.payload = task ;
        note.topic = "com.algotodo.app";
        note.body = comment.text !== '' ? "💬 " + comment.text : "  " + " תמונה";
        note.title = "תגובה חדשה מ" + comment.from.name;
        note.contentAvailable = 1;

        // Actually send the message
        apnProvider.send(note, ApnRegistrationId).then(function (response) {

            if (response.failed.length > 0) {
                console.error("error while sending push notification to apple user: " + task.to || '', response.failed);
                winston.log('error', "error while sending push notification to apple user: " + task.to || '', response.failed);
            } else {
                console.log(response.sent);
            }
        });
    }

    function sendBroadcastUpdateAlert(usersRegTokens) {

        createApnProvider();

        var note = new apn.Notification();

        note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        note.priority = 10;
        note.sound = "ping.aiff";

        note.payload = {
            'additionalData': {
                type: "updateVersionAlert"
            }
        };
        //note.payload = task ;
        note.topic = "com.algotodo.app";
        note.title = "קיימת גירסה חדשה לאפליקציה";
        note.body = "עדכן את האפליקציה עכשיו";
        note.contentAvailable = 1;

        // Actually send the message
        apnProvider.send(note, usersRegTokens).then(function (response) {

            if (response.failed.length > 0) {
                console.error("error while sending push notification to apple user: " + task.to || '', response.failed);
                winston.log('error', "error while sending push notification to apple user: " + task.to || '', response.failed);
            } else {
                console.log(response.sent);
            }
        });
    }

    function testPush(usersRegTokens) {

        var d = deferred();

        createApnProvider();

        var note = new apn.Notification();

        note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        note.priority = 10;

        note.payload = {
            'additionalData': {
                type: "testPush"
            }
        };
        //note.payload = task ;
        note.topic = "com.algotodo.app";
        note.contentAvailable = 1;

        // Actually send the message
        apnProvider.send(note, usersRegTokens).then(function (response) {

            if (response.failed.length > 0) {
                console.error("error while sending push notification to apple user: ", response.failed);
                winston.log('error', "error while sending push notification to apple user: ", response.failed);
                d.resolve(response);
            } else {
                console.log(response.sent);
                d.resolve(response);
            }
        });

        return d.promise;
    }

    function sendReminderViaApn(task, ApnRegistrationId) {

        createApnProvider();

        var note = new apn.Notification();

        note.priority = 10;
        note.topic = "com.algotodo.app";
        note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        note.contentAvailable = 1;
        note.payload = {
            'additionalData': {
                type: "task-reminder",
                object: task,
                taskId: task._id
            }
        };

        note.badge = userUnDoneTaskCount;
        note.sound = "ping.aiff";
        note.body = task.description;
        note.title = "תזכורת לביצוע משימה"; // + task.from.name;

        // Actually send the message
        apnProvider.send(note, ApnRegistrationId).then(function (response) {
            console.log("send message", note);

            if (response.failed.length > 0) {
                console.error("error while sending push notification to apple user: " + task.to || '', response.failed);
                winston.log('error', "error while sending push notification to apple user: " + task.to || '', response.failed);
            } else {
                console.log(response.sent);
                winston.log("info", "task have been send sucessfuly to user:", task);
            }
        });
    }
    //sendApnMessage({from:{name:'אבי שמואלי'},description: 'יש לך 2 דקות להגיע לפה'},1,"b83a1fe9f784c3a7a1706f8bc4e5c4146be72c74b52b858b85e8df27b54c04f9");

})(module.exports);