/*jshint esversion: 6 */

(function (BL) {

    BL.addNewTasks = addNewTasks;
    BL.addNewComment = addNewComment;
    BL.addNewComments = addNewComments;
    BL.updateTaskStatus = updateTaskStatus;
    BL.updateTasksStatus = updateTasksStatus;
    BL.updateUserDetails = updateUserDetails;
    BL.registerUser = registerUser;
    BL.checkIfUserExist = checkIfUserExist;
    BL.getAllUserTasks = getAllUserTasks;
    BL.searchUsers = searchUsers;
    BL.getAllCliqot = getAllCliqot;
    BL.getAllTasks = getAllTasks;
    BL.getAllTasksCount = getAllTasksCount;
    BL.getAllUsers = getAllUsers;
    BL.getAllUsersCount = getAllUsersCount;
    BL.getAllVersionInstalled = getAllVersionInstalled;
    BL.checkIfVerificationCodeMatch = checkIfVerificationCodeMatch;
    BL.addNewRepeatsTasks = addNewRepeatsTasks;
    BL.getUsersRepeatsTasks = getUsersRepeatsTasks;
    BL.updateRepeatsTasks = updateRepeatsTasks;
    BL.deleteRepeatsTasks = deleteRepeatsTasks;
    BL.getTasksInProgress = getTasksInProgress;
    BL.getDoneTasks = getDoneTasks;

    var ObjectID = require('mongodb').ObjectID;
    var deferred = require('deferred');
    var DAL = require('./DAL');
    var winston = require('./logger');
    var pushNotifications = require('./push-notifications/push-notifications');


    function addNewTasks(tempTask, pushToSenderAnyway) {

        var d = deferred();

        var tasks;
        // handel the old version
        if (Array.isArray(tempTask)) {
            tasks = tempTask;
        } else {
            tasks = [tempTask];
        }

        var groupMainTask;
        var groupMainTaskIndex;
        var recipientsIds = [];
        for (var i = 0, len = tasks.length; i < len; i++) {
            var task = tasks[i];
            if (task._id !== undefined && task._id.indexOf('tempId') !== -1) {
                task.offlineId = task._id;
                delete task._id;
            }
            if (task.offlineMode !== undefined) {
                delete task.offlineMode;
            }
            if (task.comments.length > 0) {
                for (var index = 0; index < task.comments.length; index++) {
                    var comment = task.comments[index];
                    if (comment.offlineMode !== undefined) {
                        delete comment.offlineMode;
                    }

                    comment.createTime = new Date();
                    comment.from._id = new ObjectID(comment.from._id);
                    comment._id = new ObjectID();
                }
            }

            task.createTime = new Date();
            task.from._id = new ObjectID(task.from._id);

            if (task.type === 'group-main') {
                groupMainTask = task;
                groupMainTaskIndex = i;
            } else {
                task.to._id = new ObjectID(task.to._id);
                recipientsIds.push(task.to._id);
            }

        }

        // if this is a group task
        if (groupMainTask !== undefined && groupMainTaskIndex !== undefined) {
            // remove the main task from the list
            tasks.splice(groupMainTaskIndex, 1);

            // insert the main task, then set his id to all the subs tasks
            DAL.insertNewTasks([groupMainTask]).then(function (results) {

                var mainTask = results.ops[0];

                // if the task created by the server (repeats task)
                if (pushToSenderAnyway) {
                    pushTasksToUsersDevice([mainTask], [groupMainTask.from._id], pushToSenderAnyway);
                }

                // set the main task id to all the subs tasks
                for (var index = 0; index < tasks.length; index++) {
                    var task = tasks[index];
                    task.groupMainTaskId = mainTask._id;
                }

                // insert the subs tasks
                DAL.insertNewTasks(tasks).then(function (results) {
                    pushTasksToUsersDevice(results.ops, recipientsIds, pushToSenderAnyway);
                    results.ops.push(mainTask);
                    d.resolve(results.ops);
                }, function (error) {
                    d.reject(error);
                });

            }, function (error) {
                d.reject(error);
            });
        } else {
            DAL.insertNewTasks(tasks).then(function (results) {
                pushTasksToUsersDevice(results.ops, recipientsIds, pushToSenderAnyway);
                d.resolve(results.ops);
            }, function (error) {
                d.reject(error);
            });
        }
        return d.promise;
    }

    function addNewComment(taskId, comment) {

        var d = deferred();

        comment.from._id = new ObjectID(comment.from._id);
        comment._id = new ObjectID();

        DAL.insertNewComment(taskId, comment).then(function (results) {
            var task = results.value;

            var userIdToNotify = '';
            //var ioIdToNotify = '';
            if (task.from._id.equals(comment.from._id)) {
                userIdToNotify = task.to._id;
            } else {
                userIdToNotify = task.from._id;
            }

            /*if (users[userIdToNotify] !== undefined) {
                ioIdToNotify = users[userIdToNotify].id;
            }*/

            // if the employee is now online send the new task by Socket.io
            /*if (userIdToNotify !== '' && !task.to._id.equals(task.from._id)) {
                io.to(ioIdToNotify).emit('new-comment', { taskId: task._id, newComment: comment });
            }*/

            // if this task is not from me to me, send notification to the user
            if (!task.to._id.equals(task.from._id)) {
                pushCommentToUserDevice(comment, task, userIdToNotify);
            }

            d.resolve();
        }, function (error) {
            d.deferred(error);
        });

        return d.promise();
    }

    function addNewComments(comments) {

        var d = deferred();

        DAL.insertNewComments(comments).then(function (commentsNotificationsList) {
            for (var i = 0; i < commentsNotificationsList.length; i++) {
                var commentNotification = commentsNotificationsList[i];
                pushCommentToUserDevice(commentNotification.comment, commentNotification.task, commentNotification.userIdToNotify);
            }
            d.resolve();
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function updateTaskStatus(task) {

        var d = deferred();

        /*var from = '';
        if (users[task.from._id] !== undefined) {
            from = users[task.from._id].id;
        }*/
        if (task.status === 'done') {
            task.doneTime = new Date();
            //localNotifications.cancelNotification(task._id);
        }
        if (task.status === 'seen') {
            task.seenTime = new Date();
        }

        DAL.updateTaskStatus(task).then(function (result) {
            /*// send the updated task to the maneger and return it to the employee
            if (from !== '') {
                io.to(from).emit('updated-task', results.value);
            }*/

            // if this task is not from me to me, send notification to the user
            if (task.to._id !== task.from._id) {
                if (task.status === 'done') {
                    pushUpdatetdTaskToUsersDevice(result, task.from._id);
                }
                /*if (task.status === 'inProgress') {
                    pushTasksToUsersDevice([result], [result.to._id]);
                }*/
            }
            d.resolve();
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function updateTasksStatus(tasks) {

        var d = deferred();

        DAL.updateTasksStatus(tasks).then(function () {
            for (var i = 0; i < tasks.length; i++) {
                var task = tasks[i];

                // if this task is not from me to me, send notification to the user
                if (task.to._id !== task.from._id) {
                    if (task.status === 'done') {
                        pushUpdatetdTaskToUsersDevice(task, task.from._id);
                    }
                    if (task.status === 'inProgress') {
                        pushTasksToUsersDevice([task], [task.to._id], false);
                    }
                }
            }
            d.resolve();
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function updateUserDetails(userId, fieldToUpdate, valueToUpdate) {

        var d = deferred();

        var updateObj = {};
        updateObj[fieldToUpdate] = valueToUpdate;

        DAL.updateUserDetails(userId, updateObj).then(function (result) {
            d.resolve(result);
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function registerUser(user) {

        var d = deferred();

        var cliqa = JSON.parse(user.cliqot[0]);
        cliqa._id = new ObjectID(cliqa._id);
        user.cliqot = [cliqa];

        if (user.hasOwnProperty('_id')) {
            delete user._id;
        }

        DAL.registerUser(user).then(function (result) {
            var newUser = result.ops[0];

            if (newUser.type === 'apple-tester') {
                d.resolve(newUser);
            } else {
                sendVerificationCodeToUser(newUser).then(function () {
                    d.resolve(newUser);
                }, function (error) {
                    d.deferred(error);
                });
            }
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function checkIfUserExist(userPhone) {
        var d = deferred();

        var query = {
            'phone': userPhone
        };

        DAL.checkIfUserExist(query).then(function (user) {
            if (user === null) {
                d.resolve('');
            } else {
                if (user.type !== 'apple-tester' && user.type !== 'admin') {
                    sendVerificationCodeToUser(user);
                }
                d.resolve(user);
            }
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function getAllUserTasks(userId) {

        var d = deferred();

        DAL.getAllUserTasks(userId).then(function (result) {
            d.resolve(result);
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function getDoneTasks(userId, page) {

        var d = deferred();

        DAL.getDoneTasks(userId, page).then(function (result) {
            d.resolve(result);
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function getTasksInProgress(userId) {

        var d = deferred();

        DAL.getTasksInProgress(userId).then(function (result) {
            d.resolve(result);
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function searchUsers(string, cliqaId) {

        var d = deferred();

        var query = {};

        if (cliqaId !== undefined) {
            query = {
                $and: [{
                    'name': {
                        "$regex": string,
                        "$options": "i"
                    }
                }, {
                    'cliqot._id': new ObjectID(cliqaId)
                }]
            };
        } else {
            query = {
                'name': {
                    "$regex": string,
                    "$options": "i"
                }
            };
        }

        DAL.searchUsers(query).then(function (result) {
            d.resolve(result);
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function getAllCliqot() {

        var d = deferred();

        DAL.getAllCliqot().then(function (result) {
            d.resolve(result);
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function getAllTasks(query) {

        var d = deferred();

        var order = query.order,
            limit = parseInt(query.limit),
            page = query.page,
            filter = JSON.parse(query.filter);

        var options = {
            "limit": limit,
            "skip": (page - 1) * limit
        };

        DAL.getAllTasks(filter, options).then(function (result) {
            d.resolve(result);
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function getAllTasksCount(filter) {

        var d = deferred();

        DAL.getAllTasksCount(filter).then(function (result) {
            d.resolve(result);
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function getAllUsers(query) {

        var d = deferred();

        var order = query.order,
            limit = parseInt(query.limit),
            page = query.page,
            filter = JSON.parse(query.filter);

        var options = {
            "limit": limit,
            "skip": (page - 1) * limit
        };

        if (filter.cliqa !== undefined) {
            filter['cliqot._id'] = new ObjectID(filter.cliqa);
            delete filter['cliqa'];
        }

        DAL.getAllUsers(filter, options).then(function (result) {
            d.resolve(result);
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function getAllUsersCount(filter) {

        var d = deferred();

        if (filter.cliqa !== undefined) {
            filter['cliqot._id'] = new ObjectID(filter.cliqa);
            delete filter['cliqa'];
        }

        DAL.getAllUsersCount(filter).then(function (result) {
            d.resolve(result);
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function getAllVersionInstalled() {

        var d = deferred();

        DAL.getAllVersionInstalled().then(function (result) {
            d.resolve(result.sort().reverse());
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function checkIfVerificationCodeMatch(userId, verificationCode) {

        var d = deferred();

        DAL.checkIfVerificationCodeMatch(userId, verificationCode).then(function (result) {
            if (result !== null) {
                d.resolve('ok');
            } else {
                d.resolve('notMatch');
            }
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function addNewRepeatsTasks(tasks) {

        var d = deferred();

        DAL.insertNewRepeatsTasks(tasks).then(function (result) {
            d.resolve(result);
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function updateRepeatsTasks(tasks) {

        var d = deferred();

        DAL.updateRepeatsTasks(tasks).then(function () {
            d.resolve();
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function deleteRepeatsTasks(tasks) {

        var d = deferred();

        var tasksIds = [];
        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            tasksIds.push(new ObjectID(task._id));
        }

        DAL.deleteRepeatsTasks(tasksIds).then(function () {
            d.resolve(tasksIds);
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }

    function getUsersRepeatsTasks(userId) {

        var d = deferred();

        DAL.getUsersRepeatsTasks(userId).then(function (results) {
            d.resolve(results);
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }



    /* ---- Private Methods --- */

    function insertNewTasksAndSendToUser(tasks, recipientsIds, pushToSenderAnyway) {
        var d = deferred;

        DAL.insertNewTasks(tasks).then(function (results) {
            // if the employee is now online send the new task by Socket.io
            /*console.log("to:", to);
            if (to !== '' && task.to._id !== task.from._id) {
                io.to(to).emit('new-task', results.ops[0]);
            }*/
            var newTasks = results.ops;
            console.log("trying to send new tasks", newTasks);

            // if this task is not from me to me, send notification to the user
            //if (task.to._id !== task.from._id) {
            pushTasksToUsersDevice(newTasks, recipientsIds, pushToSenderAnyway);
            //}

            // return the new task to the sender
            d.resolve(results.ops);
        }, function (error) {
            d.reject(error);
        });

        return d.promise;
    }

    function pushCommentToUserDevice(comment, task, userIdToNotify) {

        // get user from DB and check if there GcmRegId or ApnRegId
        DAL.getUsersByUsersId([userIdToNotify]).then(function (result) {
            if (Array.isArray(result) && result.length === 1) {
                var user = result[0];

                pushNotifications.pushNewComment(comment, task, user);
            }
        }, function (error) {
            winston.log('error', error.message, error.err);
        });
    }

    function pushTasksToUsersDevice(tasks, recipientsIds, pushToSenderAnyway) {

        // get user from DB and check if there GcmRegId or ApnRegId
        DAL.getUsersByUsersId(recipientsIds).then(function (users) {

            tasks.forEach(function (task, index) {
                if (pushToSenderAnyway || !task.to._id.equals(task.from._id)) {
                    var user = users.find(x => x._id.equals(task.to._id));
                    // get the number that will be set to the app icon badge
                    DAL.getUnDoneTasksCountByUserId(task.to._id).then(function (userUnDoneTaskCount) {
                        pushNotifications.pushNewTask(task, userUnDoneTaskCount, user);
                    }, function (error) {
                        winston.log('error', error.message, error.err);
                    });
                }
            });
        }, function (error) {
            winston.log('error', error.message, error.err);
        });
    }

    function pushUpdatetdTaskToUsersDevice(task, recipientId) {

        // get user from DB and check if there GcmRegId or ApnRegId
        DAL.getUsersByUsersId([new ObjectID(recipientId)]).then(function (users) {
            if (users.length > 0) {
                var user = users[0];
                pushNotifications.pushUpdatedTask(task, user);
            }
        }, function (error) {
            winston.log('error', error.message, error.err);
        });
    }

    function sendVerificationCodeToUser(user) {

        var d = deferred();

        var verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
        var updateObj = {
            'verificationCode': verificationCode
        };

        DAL.updateUserDetails(user._id, updateObj).then(function (result) {

            DAL.getAdminRegistrationId('אבי שמואלי').then(function (GcmRegistrationId) {

                pushNotifications.sendSmsViaAdminPhone(verificationCode, GcmRegistrationId, user);

                d.resolve();
            }, function (error) {
                d.deferred(error);
            });
        }, function (error) {
            d.deferred(error);
        });

        return d.promise;
    }


})(module.exports);

/*

function CCCC(DDD){
    
    var d = deferred();

    DAL.AAA().then(function(result) {
        d.resolve(result);
    }, function(error) {
        d.deferred(error);
    });

    return d.promise;
}

*/