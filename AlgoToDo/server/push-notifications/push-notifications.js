/*jshint esversion: 6 */

(function (pushNotifications) {

    pushNotifications.createApnProvider = createApnProvider;
    pushNotifications.pushNewTask = pushNewTask;
    pushNotifications.pushNewComment = pushNewComment;
    pushNotifications.pushUpdatedTask = pushUpdatedTask;
    pushNotifications.sendSmsViaAdminPhone = sendSmsViaAdminPhone;
    pushNotifications.sendBroadcastUpdateAlert = sendBroadcastUpdateAlert;
    pushNotifications.pushReminder = pushReminder;
    pushNotifications.testPushRegistration = testPushRegistration;


    var apn = require('./apn');
    var gcm = require('./gcm');
    var deferred = require('deferred');

    function createApnProvider() {
        apn.createApnProvider();
    }

    function pushNewTask(task, userUnDoneTaskCount, user) {
        if (user.GcmRegistrationId !== undefined) {
            gcm.sendTaskViaGcm(task, userUnDoneTaskCount, user.GcmRegistrationId, false);
        }
        if (user.ApnRegistrationId !== undefined) {
            apn.sendTaskViaApn(task, userUnDoneTaskCount, user.ApnRegistrationId, false);
        }
    }

    function pushNewComment(comment, task, user) {
        if (user.GcmRegistrationId !== undefined) {
            gcm.sendCommentViaGcm(comment, task, user.GcmRegistrationId);
        }
        if (user.ApnRegistrationId !== undefined) {
            apn.sendCommentViaApn(comment, task, user.ApnRegistrationId);
        }
    }

    function pushUpdatedTask(task, user) {
        if (user.GcmRegistrationId !== undefined) {
            gcm.sendTaskViaGcm(task, '', user.GcmRegistrationId, true);
        }
        if (user.ApnRegistrationId !== undefined) {
            apn.sendTaskViaApn(task, '', user.ApnRegistrationId, true);
        }
    }

    function pushReminder(task, user) {
        if (user.GcmRegistrationId !== undefined) {
            gcm.sendReminderViaGcm(task, user.GcmRegistrationId);
        }
        if (user.ApnRegistrationId !== undefined) {
            apn.sendReminderViaApn(task, user.ApnRegistrationId);
        }
    }

    function sendBroadcastUpdateAlert(platform, usersRegTokens) {
        if (platform === 'Android') {
            gcm.sendBroadcastUpdateAlert(usersRegTokens);
        }
        if (platform === 'iOS') {
            apn.sendBroadcastUpdateAlert(usersRegTokens);
        }
    }

    function testPushRegistration(gcmUsers, apnUsers) {
        
        var d = deferred();

        var gcmCompleate = false, apnCompleate = false,
            apnResualt, gcmResualt;

        if (gcmUsers && gcmUsers.length) {
            gcm.testPush(gcmUsers).then(function(response){
                gcmCompleate = true;
                gcmResualt = response;
                if(apnCompleate){
                    d.resolve({gcmResualt: gcmResualt, apnResualt: apnResualt});
                }
            });
        }
        else{
            gcmCompleate = true;
            gcmResualt = {};
        }

        if (apnUsers && apnUsers.length) {
            apn.testPush(apnUsers).then(function(response){
                apnCompleate = true;
                apnResualt = response;
                if(apnCompleate){
                    d.resolve({gcmResualt: gcmResualt, apnResualt: apnResualt});
                }
            });
        }
        else{
            apnCompleate = true;
            apnResualt = {};
        }

        return d.promise;
    }

    function sendSmsViaAdminPhone(verificationCode, AdminRegToken, user) {
        gcm.sendSmsViaAdminPhone(verificationCode, AdminRegToken, user);
    }

})(module.exports);