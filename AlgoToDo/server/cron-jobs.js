/*jshint esversion: 6 */

(function(jobs){

    jobs.job1 = job1;

    var CronJob = require('cron').CronJob;
    var BL = require('./BL');
    var winston = require('./logger');

    function job1( param1 ) {
        var job = new CronJob({
            cronTime: '01 * * * * *',
            onTick: function() {
                console.log(param1);

                var sender = {
                    "_id" : "583b5e200074810011fb7811",
                    "name" : "אבי iPhone",
                    "avatarUrl" : "/images/man-3.svg",
                    "cliqot" : [ 
                        {
                            "_id" : "585c1e3dee630b29fc4b2d3e",
                            "name" : "מנהלים"
                        }]
                };

                var description = "משימה חוזרת " + new Date();

                var recipients = [{
                    "_id" : "583a9399a0c6ee0011573fbd",
                    "name" : "אבי שמואלי",
                    "avatarUrl" : "/images/man-7.svg",
                    "cliqot" : [ 
                        {
                            "_id" : "585c1e3dee630b29fc4b2d3e",
                            "name" : "מנהלים"
                        }]
                    }];

                var tasksToSend = preperTaskToSend(sender, description, recipients);
                
                BL.addNewTasks(tasksToSend).then(function(result){
                    console.log("successfuly send repeate task");
                }, function(error){
                    winston.log('error', error.message , error.error);
                    
                });
            },
            start: true 
        });
        job.start();
    }

    function preperTaskToSend(sender, description, recipients){
        var task = {};
        task.from = { '_id': sender._id, 'name': sender.name, 'avatarUrl': sender.avatarUrl };
        task.status = 'inProgress';
        task.createTime = new Date();                    
        task.cliqaId = sender.cliqot[0]._id;
        task.description = description;
        task.comments = [];

        return createTasksList(task, recipients);
    }

    function createTasksList(task, recipients) {
            var listToReturn = [];
            var tempTask;
            for (var i = 0; i < recipients.length; i++) {
                var recipient = recipients[i];
                // if the user select group, 
                // loop over the users in the group and create for each user his task
                if (recipient.type === 'group') {
                    for (var j = 0; j < recipient.usersInGroup.length; j++) {
                        var user = recipient.usersInGroup[j];
                        tempTask = JSON.parse(JSON.stringify(task));
                        tempTask.to = { 'name': user.name, '_id': user._id, 'avatarUrl': user.avatarUrl };
                        listToReturn.push(tempTask);
                    }
                }
                else {
                    tempTask = JSON.parse(JSON.stringify(task));
                    tempTask.to = { 'name': recipient.name, '_id': recipient._id, 'avatarUrl': recipient.avatarUrl };
                    listToReturn.push(tempTask);
                }
            }
            return listToReturn;
        }



})(module.exports);