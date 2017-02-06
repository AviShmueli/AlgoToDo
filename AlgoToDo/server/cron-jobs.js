(function(jobs){

    jobs.job1 = job1;

    var CronJob = require('cron').CronJob;


    function job1( param1 ) {
        var job = new CronJob({
            cronTime: '01 * * * * *',
            onTick: function() {
                console.log(param1);
                var tasksToSend = preperTaskToSend();
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
                        tempTask = angular.copy(task);
                        tempTask.to = { 'name': user.name, '_id': user._id, 'avatarUrl': user.avatarUrl };
                        listToReturn.push(tempTask);
                    }
                }
                else {
                    tempTask = angular.copy(task);
                    tempTask.to = { 'name': recipient.name, '_id': recipient._id, 'avatarUrl': recipient.avatarUrl };
                    listToReturn.push(tempTask);
                }
            }
            return listToReturn;
        }



})(module.exports);