/*jshint esversion: 6 */

(function(jobs){

    jobs.startAllJobs = startAllJobs;
    jobs.startRepeatsTasks = startRepeatsTasks;
    jobs.restartRepeatsTasks = restartRepeatsTasks;
    jobs.stopRepeatsTasks = stopRepeatsTasks;

    var CronJob = require('cron').CronJob;
    var BL = require('./BL');
    var DAL = require('./DAL');
    var logger = require('./logger');
    
    var taskJobMap = {};

    function startAllJobs(){
        DAL.getAllRepeatsTasks().then(function(tasks){
            startRepeatsTasks( tasks );
        }, function (error){
            logger.log('error', error.message , error.error);
        });
    }

    function startRepeatsTasks( tasks ) {
        
        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            
            var time = new Date(task.startTime);
            var hour = time.getHours();
            var minutes = time.getMinutes();
            var days = task.daysRepeat.toString();

            if (taskJobMap[task._id] !== undefined) {
                taskJobMap[task._id].stop();
            }

            //logger.log('info', "start repeates task: " + '00 ' + minutes + ' ' + hour +  ' * * ' + days , task);

            var job = new CronJob({
                cronTime: '00 ' + minutes + ' ' + hour +  ' * * ' + days, // Seconds(0-59) Minutes(0-59) Hours(0-23) Day of Month(1-31) Months(0-11) Day of Week:(0-6)
                context: task,
                onTick: function() {
                    var _task = this;
                    
                    var tasksToSend = preperTaskToSend(_task);
                    logger.log("info","sending repeats task :", tasksToSend);
                    BL.addNewTasks(tasksToSend, true).then(function(result){
                        console.log("successfuly send repeate tasks");
                    }, function(error){
                        logger.log('error', error.message , error.error);                       
                    });
                },
                start: true 
            });
            taskJobMap[task._id] = job;
        }
        
    }

    function restartRepeatsTasks( tasks ) {
        
        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            
            var time = new Date(task.startTime);
            var hour = time.getHours();
            var minutes = time.getMinutes();
            var days = task.daysRepeat.toString();
            
            if (taskJobMap[task._id] !== undefined) {
                taskJobMap[task._id].stop();
            }

            var job = new CronJob({
                cronTime: '00 ' + minutes + ' ' + hour +  ' * * ' + days, // Seconds(0-59) Minutes(0-59) Hours(0-23) Day of Month(1-31) Months(0-11) Day of Week:(0-6)
                
                onTick: function() {
                    console.log(task);

                    var tasksToSend = preperTaskToSend(task);
                    
                    BL.addNewTasks(tasksToSend, true).then(function(result){
                        console.log("successfuly send repeate task");
                    }, function(error){
                        logger.log('error', error.message , error.error);                       
                    });
                },
                start: true 
            });
            taskJobMap[task._id] = job;
        }
        
    }

    function stopRepeatsTasks(tasksIds){
        for (var i = 0; i < tasksIds.length; i++) {        
            if (taskJobMap[tasksIds[i]] !== undefined) {
                taskJobMap[tasksIds[i]].stop();
            }
        }
    }

    function preperTaskToSend(repeatsTask){
        var task = {};
        task.from = { '_id': repeatsTask.from._id, 'name': repeatsTask.from.name, 'avatarUrl': repeatsTask.from.avatarUrl };
        task.status = 'inProgress';
        task.createTime = new Date();                    
        task.cliqaId = repeatsTask.cliqaId;
        task.description = repeatsTask.description;
        task.comments = [];

        var taskListToreturn = [];
        if (repeatsTask.to.length > 1) {
            task.type = 'group-sub';
        }

        taskListToreturn = createTasksList(task, repeatsTask.to);

        if (taskListToreturn.length > 1) {
            taskListToreturn.push(createGroupMainTask(task,repeatsTask.to));
        }

        return taskListToreturn;
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
                        tempTask.type = 'group-sub';
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

        var createGroupMainTask = function (task, recipients) {
            var groupTask = JSON.parse(JSON.stringify(task));
            groupTask.type = 'group-main';
            groupTask.to = recipients;
            return groupTask;
        };



})(module.exports);