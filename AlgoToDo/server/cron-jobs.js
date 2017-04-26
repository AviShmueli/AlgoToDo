/*jshint esversion: 6 */

(function (jobs) {

    jobs.startAllJobs = startAllJobs;
    jobs.startRepeatsTasks = startRepeatsTasks;
    jobs.restartRepeatsTasks = restartRepeatsTasks;
    jobs.stopRepeatsTasks = stopRepeatsTasks;

    var CronJob = require('cron').CronJob;
    var BL = require('./BL');
    var DAL = require('./DAL');
    var logger = require('./logger');
    var moment = require('moment-timezone');
    var deferred = require('deferred');
    var ObjectID = require('mongodb').ObjectID;

    var taskJobMap = {};

    function startAllJobs() {
        DAL.getAllRepeatsTasks().then(function (tasks) {
            startRepeatsTasks(tasks);
        }, function (error) {
            logger.log('error', error.message, error.error);
        });
    }

    function setTime(task) {

        var dateTime = new Date();
        dateTime.setHours(task.hour);
        dateTime.setMinutes(task.minutes);

        var tz = moment().tz(task.zone);
        if (dateTime.getTimezoneOffset() !== -tz._offset) {
            dateTime = new Date(moment(dateTime).add(-tz._offset, 'm')._d);
        }

        console.log("***dateTime***", dateTime.toString());
        return dateTime;
    };



    function startRepeatsTasks(tasks) {

        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];

            if (task.hour !== undefined) {

                var time = setTime(task); //new Date(task.startTime);//
                var hour = time.getHours();
                var minutes = time.getMinutes();
                var days = task.daysRepeat.toString();

                if (taskJobMap[task._id] !== undefined) {
                    taskJobMap[task._id].stop();
                }

                logger.log('info', "start repeates task: " + '00 ' + minutes + ' ' + hour + ' * * ' + days, task);

                var job = new CronJob({
                    cronTime: '00 ' + minutes + ' ' + hour + ' * * ' + days, // Seconds(0-59) Minutes(0-59) Hours(0-23) Day of Month(1-31) Months(0-11) Day of Week:(0-6)
                    context: task,
                    onTick: function () {
                        var _task = this;

                        preperTaskToSend(_task).then(function (tasksToSend) {
                            logger.log("info", "sending repeats task :", tasksToSend);
                            BL.addNewTasks(tasksToSend, true).then(function (result) {
                                console.log("successfuly send repeate tasks");
                            }, function (error) {
                                logger.log('error', error.message, error.error);
                            });
                        });
                    },
                    start: true
                });
                taskJobMap[task._id] = job;
            }
        }

    }

    function restartRepeatsTasks(tasks) {

        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];

            var time = setTime(task); //new Date(task.startTime);
            var hour = time.getHours();
            var minutes = time.getMinutes();
            var days = task.daysRepeat.toString();

            if (taskJobMap[task._id] !== undefined) {
                taskJobMap[task._id].stop();
            }

            var job = new CronJob({
                cronTime: '00 ' + minutes + ' ' + hour + ' * * ' + days, // Seconds(0-59) Minutes(0-59) Hours(0-23) Day of Month(1-31) Months(0-11) Day of Week:(0-6)

                onTick: function () {
                    console.log(task);

                    preperTaskToSend(task).then(function (tasksToSend) {
                        BL.addNewTasks(tasksToSend, true).then(function (result) {
                            console.log("successfuly send repeate task");
                        }, function (error) {
                            logger.log('error', error.message, error.error);
                        });
                    });
                },
                start: true
            });
            taskJobMap[task._id] = job;
        }

    }

    function stopRepeatsTasks(tasksIds) {
        for (var i = 0; i < tasksIds.length; i++) {
            if (taskJobMap[tasksIds[i]] !== undefined) {
                taskJobMap[tasksIds[i]].stop();
            }
        }
    }

    function preperTaskToSend(repeatsTask) {

        var d = deferred();

        var task = {};
        task.from = {
            '_id': repeatsTask.from._id,
            'name': repeatsTask.from.name,
            'avatarUrl': repeatsTask.from.avatarUrl
        };
        task.status = 'inProgress';
        task.createTime = new Date();
        task.cliqaId = repeatsTask.cliqaId;
        task.description = repeatsTask.description;
        task.comments = [];

        if (task.description === 'ספירת העומר') {
            var comment = {
                "from": {
                    '_id': repeatsTask.from._id,
                    'name': repeatsTask.from.name,
                    'avatarUrl': repeatsTask.from.avatarUrl
                },
                "createTime": task.createTime,
                "text": getSfirartHaomerString()
            };
            task.comments = [comment];
        }

        var taskListToreturn = [];
        if (repeatsTask.to.length > 1) {
            task.type = 'group-sub';
        }

        createTasksList(task, repeatsTask.to).then(function (taskListToreturn) {
            if (taskListToreturn.length > 1) {
                taskListToreturn.push(createGroupMainTask(task, repeatsTask.to));
            }

            d.resolve(taskListToreturn);
        });

        return d.promise;
    }

    function createTasksList(task, recipients) {

        var d = deferred();

        var groupsIds = [];
        var listToReturn = [];
        var tempTask;
        for (var i = 0; i < recipients.length; i++) {
            var recipient = recipients[i];
            // if the user select group, 
            // loop over the users in the group and create for each user his task
            if (recipient.type === 'group') {
                groupsIds.push(new ObjectID(recipient._id));
            } else {
                tempTask = JSON.parse(JSON.stringify(task));
                tempTask.to = {
                    'name': recipient.name,
                    '_id': recipient._id,
                    'avatarUrl': recipient.avatarUrl
                };
                listToReturn.push(tempTask);
            }
        }

        if (groupsIds.length > 0) {
            DAL.getUsersByUsersId(groupsIds).then(function (result) {

                var groups = result;

                for (var i = 0; i < groups.length; i++) {
                    var group = groups[i];

                    for (var j = 0; j < group.usersInGroup.length; j++) {
                        var user = group.usersInGroup[j];
                        tempTask = JSON.parse(JSON.stringify(task));
                        tempTask.to = {
                            'name': user.name,
                            '_id': user._id,
                            'avatarUrl': user.avatarUrl
                        };
                        tempTask.type = 'group-sub';
                        listToReturn.push(tempTask);
                    }
                }

                d.resolve(listToReturn);
            });
        } else {
            setTimeout(function () {
                d.resolve(listToReturn);
            }, 0);
        }

        return d.promise;
    }

    var createGroupMainTask = function (task, recipients) {
        var groupTask = JSON.parse(JSON.stringify(task));
        groupTask.type = 'group-main';
        groupTask.to = recipients;
        return groupTask;
    };

    /* ----  Sfirat Haomer Code ---- */

    var getSfirartHaomerString = function () {
        var stringToReturn = '';
        var today = new Date();
        var startDate = new Date("4/12/2017");
        var timeDiff = Math.abs(today.getTime() - startDate.getTime());
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

        var s_dayOnWeek = diffDays % 7,
            aweek = Math.floor(diffDays / 7);
        var bweek = '';

        if (diffDays < 7) {
            stringToReturn = " היום " + diffDays + "ימים לעומר ";
        } else {
            if (aweek === 1) {
                bweek = "שבוע אחד";
            } else if (aweek === 2) {
                bweek = "שני שבועות";
            } else if (aweek === 3) {
                bweek = "שלושה שבועות";
            } else if (aweek === 4) {
                bweek = "ארבעה שבועות";
            } else if (aweek === 4) {
                bweek = "חמישה שבועות";
            } else if (aweek === 4) {
                bweek = "שישה שבועות";
            }
        }

        if (s_dayOnWeek === 0) {
            stringToReturn = " היום " + diffDays + " יום , שהם " + bweek + " לעומר ";
        }
        if (s_dayOnWeek === 1) {
            stringToReturn = "היום " + diffDays + " יום , שהם " + bweek + " ויום אחד לעומר ";
        } else {
            stringToReturn = "היום " + diffDays + " יום , שהם " + bweek + " ו " + s_dayOnWeek + " ימים לעומר ";
        }

        return '🌾' + ' ' + stringToReturn;
    }

})(module.exports);