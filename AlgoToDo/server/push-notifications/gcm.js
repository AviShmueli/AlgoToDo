/*jshint esversion: 6 */

(function (gcmModule) {

    gcmModule.sendTaskViaGcm = sendTaskViaGcm;
    gcmModule.sendCommentViaGcm = sendCommentViaGcm;
    gcmModule.sendSmsViaAdminPhone = sendSmsViaAdminPhone;


    var winston = require('../logger');
    var gcm = require('node-gcm');

    var GcmSender = new gcm.Sender('AIzaSyDPJtKwWeftuwuneEWs-WlLII6LE7lGeMk');


    function sendTaskViaGcm (task, userUnDoneTaskCount, regToken, isUpdate) {

        var message;
        if (isUpdate) {
            message = new gcm.Message({
                /*collapseKey: task.from._id,
                priority: 'high',
                delayWhileIdle: true,*/
                data: {
                    additionalData: {
                        type: "task-update",
                        object: task,
                        taskId: task._id
                    },
                    // title: "משימה חדשה מ" + task.from.name,
                    // sound: 'default',
                    // icon: 'www/images/icon.png',
                    // body: task.description,
                    // badge: userUnDoneTaskCount
                }
            });
        } else {
            message = new gcm.Message({
                /*collapseKey: task.from._id,
                priority: 'high',
                delayWhileIdle: true,*/
                data: {
                    additionalData: {
                        type: "task",
                        object: task,
                        taskId: task._id
                    },
                    title: "משימה חדשה מ" + task.from.name,
                    sound: 'default',
                    icon: 'res://ic_menu_paste_holo_light',
                    body: task.description,
                    badge: userUnDoneTaskCount
                }
            });

            message.addData('notId', task.from._id);
            message.addData('content-available', '1');
            message.addData('image', 'www/images/asiti-logo.png');
            message.addData('style', 'inbox');
            message.addData('summaryText', ' יש לך %n% משימות חדשות');
        }


        console.log("sending message : ", message);
        console.log("with GcmRegistrationId: ", regToken);

        // Actually send the message
        GcmSender.send(message, {
            registrationTokens: [regToken]
        }, function (err, response) {
            console.log("send message", message);
            if (err) {
                console.error("error while sending push notification to user: " + task.to || '', err);
                winston.log('error', "error while sending push notification to user: " + task.to || '', err);
            } else {
                console.log(response);
            }
        });
    }

    function sendCommentViaGcm(comment, task, regToken) {

        var message = new gcm.Message({
            /*collapseKey: task.from._id,
            priority: 'high',
            delayWhileIdle: true,*/
            data: {
                additionalData: {
                    type: "comment",
                    object: comment,
                    taskId: task._id
                },
                title: "תגובה חדשה מ" + comment.from.name,
                sound: 'default',
                icon: 'res://ic_menu_start_conversation',
                body: comment.text !== '' ? comment.text : "📷 " + " תמונה"
            }
        });

        //message.addData('notId', task.from._id);
        message.addData('content-available', '1');
        message.addData('image', 'www/images/asiti-logo.png');
        message.addData('style', 'inbox');
        message.addData('summaryText', ' יש לך %n% תגובות חדשות');

        console.log("sending message : ", message);
        console.log("with GcmRegistrationId: ", regToken);

        // Actually send the message
        GcmSender.send(message, {
            registrationTokens: [regToken]
        }, function (err, response) {
            console.log("send message", message);
            if (err) {
                console.error("error while sending push notification to user: " + task.to || '', err);
                winston.log('error', "error while sending push notification to user: " + task.to || '', err);
            } else {
                console.log(response);
            }
        });
    }

    function sendSmsViaAdminPhone(verificationCode, AdminRegToken, user) {

        var message = new gcm.Message({
            data: {
                additionalData: {
                    type: "verificationCode",
                    object: {verificationCode: verificationCode, phoneNumaber: user.phone}
                },
                title: "נשלח קוד זיהוי ל" + user.name,
            }
        });
                
        //message.addData('content-available', '1');
        message.addData('image', 'www/images/asiti-logo.png');

        // Actually send the message
        GcmSender.send(message, { registrationTokens: [AdminRegToken] }, function (err, response) {
            console.log("send message", message);
            if (err) {
                winston.log('error', "error while sending push notification: ", err);
            }
            else {
                console.log(response);
            }
        });
    }

})(module.exports);