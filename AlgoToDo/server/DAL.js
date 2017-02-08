/*jshint esversion: 6 */

(function (DAL) {

    DAL.insertNewTasks = insertNewTasks;
    DAL.getUsersByUsersId = getUsersByUsersId;
    DAL.getUnDoneTasksCountByUserId = getUnDoneTasksCountByUserId;
    DAL.insertNewComment = insertNewComment;
    DAL.insertNewComments = insertNewComments;
    DAL.updateTaskStatus = updateTaskStatus;
    DAL.updateTasksStatus = updateTasksStatus;
    DAL.updateUserDetails = updateUserDetails;
    DAL.registerUser = registerUser;
    DAL.checkIfUserExist = checkIfUserExist;
    DAL.getAdminRegistrationId = getAdminRegistrationId;
    DAL.getAllUserTasks = getAllUserTasks;
    DAL.searchUsers = searchUsers;
    DAL.getAllCliqot = getAllCliqot;
    DAL.getAllTasks = getAllTasks;
    DAL.getAllTasksCount = getAllTasksCount;
    DAL.getAllUsers = getAllUsers;
    DAL.getAllUsersCount = getAllUsersCount;
    DAL.getAllVersionInstalled = getAllVersionInstalled;
    DAL.checkIfVerificationCodeMatch = checkIfVerificationCodeMatch;
    DAL.insertNewRepeatsTasks = insertNewRepeatsTasks;

    var deferred = require('deferred');
    var mongodb = require('mongodb').MongoClient;
    var ObjectID = require('mongodb').ObjectID;
    var mongoUrl = 'mongodb://admin:avi3011algo@ds127059-a0.mlab.com:27059/algotodo_db_01';
    //var mongoUrl = 'mongodb://admin:avi3011algo@ds033996.mlab.com:33996/algotodo_db_01';
    //var mongoUrl = 'mongodb://localhost:27017/TaskManeger';

    function getCollection(collectionName) {

        var d = deferred();

        mongodb.connect(mongoUrl, function (err, db) {

            if (err) {
                var errorObj = {
                    message: "error while trying to connect MongoDB",
                    error: err
                };
                d.reject(errorObj);
            }

            d.resolve({
                collection: db.collection(collectionName),
                db: db
            });
        });

        return d.promise;
    }

    function insertNewTasks(tasks) {

        var d = deferred();

        getCollection('tasks').then(function (mongo) {

            mongo.collection.insert(tasks, function (err, results) {

                if (err) {
                    var errorObj = {
                        message: "error while trying to add new Task to DB",
                        error: err
                    };
                    mongo.db.close();
                    d.reject(errorObj);
                }

                mongo.db.close();
                d.resolve(results);

            });
        });

        return d.promise;
    }

    function getUsersByUsersId(usersIds) {

        var d = deferred();

        getCollection('users').then(function (mongo) {

            mongo.collection.find({
                '_id': {
                    $in: usersIds
                }
            }, {
                '_id': true,
                'name': true,
                'GcmRegistrationId': true,
                'ApnRegistrationId': true
            }).toArray(function (err, result) {

                if (err) {
                    var errorObj = {
                        message: "error while trying to find user in DB: ",
                        error: err
                    };
                    mongo.db.close();
                    d.reject(errorObj);
                }

                mongo.db.close();
                d.resolve(result);
            });
        });

        return d.promise;
    }

    function getUnDoneTasksCountByUserId(userId) {

        var d = deferred();

        getCollection('tasks').then(function (mongo) {

            mongo.collection.count({
                'to._id': new ObjectID(userId),
                'status': 'inProgress'
            }, function (err, result) {

                if (err) {
                    var errorObj = {
                        message: "error while trying to get UnDone Tasks Count: ",
                        error: err
                    };
                    mongo.db.close();
                    d.reject(errorObj);
                }

                mongo.db.close();
                d.resolve(result);
            });
        });

        return d.promise;
    }

    function insertNewComment(taskId, comment) {

        var d = deferred();

        getCollection('tasks').then(function (mongo) {

            mongo.collection.findAndModify({
                    _id: new ObjectID(taskId)
                }, [
                    ['_id', 'asc']
                ], {
                    $push: {
                        comments: comment
                    }
                }, {
                    new: true
                },
                function (err, results) {

                    if (err) {
                        var errorObj = {
                            message: "error while trying to add new comment to task:",
                            error: err
                        };
                        mongo.db.close();
                        d.reject(errorObj);
                    }

                    mongo.db.close();
                    d.resolve(results);
                });
        });

        return d.promise;
    }

    function insertNewComments(comments) {

        var d = deferred();

        var commentsNotificationsList = [];

        getCollection('tasks').then(function (mongo) {

            // Initialize the unordered Batch
            var batch = mongo.collection.initializeUnorderedBulkOp({
                useLegacyOps: true
            });

            for (var i = 0; i < comments.length; i++) {
                var commentObj = comments[i];
                if (commentObj.comment.offlineMode !== undefined) {
                    delete commentObj.comment.offlineMode;
                }
                commentObj.comment.from._id = new ObjectID(commentObj.comment.from._id);
                commentObj.comment._id = new ObjectID();

                batch.find({
                    _id: new ObjectID(commentObj.taskId)
                }).updateOne({
                    $push: {
                        comments: commentObj.comment
                    }
                });

                if (commentObj.userIdToNotify !== '') {
                    commentsNotificationsList.push({
                        comment: commentObj.comment,
                        task: {
                            _id: commentObj.taskId
                        },
                        userIdToNotify: new ObjectID(commentObj.userIdToNotify)
                    });
                }
            }

            batch.execute(function (err, result) {

                if (err) {
                    var errorObj = {
                        message: "error while trying to add new comments:",
                        error: err
                    };
                    mongo.db.close();
                    d.reject(errorObj);
                }

                mongo.db.close();
                d.resolve(commentsNotificationsList);
            });
        });

        return d.promise;
    }

    function updateTaskStatus(task) {

        var d = deferred();

        getCollection('tasks').then(function (mongo) {

            mongo.collection.findAndModify({
                    _id: new ObjectID(task._id)
                }, [
                    ['_id', 'asc']
                ], {
                    $set: {
                        'status': task.status,
                        'doneTime': task.doneTime,
                        'seenTime': task.seenTime
                    }
                }, {
                    new: true
                },
                function (err, results) {

                    if (err) {
                        var errorObj = {
                            message: "error while trying to update task status:",
                            error: err
                        };
                        mongo.db.close();
                        d.reject(errorObj);
                    }

                    mongo.db.close();
                    d.resolve(results.value);
                });
        });

        return d.promise;
    }

    function updateTasksStatus(tasks) {

        var d = deferred();

        getCollection('tasks').then(function (mongo) {

            var batch = mongo.collection.initializeUnorderedBulkOp({
                useLegacyOps: true
            });

            for (var i = 0; i < tasks.length; i++) {
                var task = tasks[i];
                batch.find({
                    _id: new ObjectID(task._id)
                }).updateOne({
                    $set: {
                        'status': task.status,
                        'doneTime': task.doneTime,
                        'seenTime': task.seenTime
                    }
                });
            }

            batch.execute(function (err, result) {

                if (err) {
                    var errorObj = {
                        message: "error while trying to update tasks: ",
                        error: err
                    };
                    mongo.db.close();
                    d.reject(errorObj);
                }

                mongo.db.close();
                d.resolve();
            });
        });

        return d.promise;
    }

    function updateUserDetails(userId, updateObj) {

        var d = deferred();

        getCollection('users').then(function (mongo) {

            mongo.collection.findAndModify({
                    _id: new ObjectID(userId)
                }, [
                    ['_id', 'asc']
                ], {
                    $set: updateObj
                }, {
                    new: true
                },
                function (err, result) {
                    if (err) {
                        var errorObj = {
                            message: "error while trying to update user details: ",
                            error: err
                        };
                        mongo.db.close();
                        d.reject(errorObj);
                    }

                    mongo.db.close();
                    d.resolve(result);
                });
        });

        return d.promise;

    }

    function registerUser(user) {

        var d = deferred();

        getCollection('users').then(function (mongo) {

            mongo.collection.insert(user,
                function (err, results) {
                    if (err) {
                        var errorObj = {
                            message: "eerror while trying register new user: ",
                            error: err
                        };
                        mongo.db.close();
                        d.reject(errorObj);
                    }

                    mongo.db.close();
                    d.resolve(results);
                });
        });

        return d.promise;
    }

    function getAdminRegistrationId(adminUserName) {

        var d = deferred();

        getCollection('users').then(function (mongo) {

            mongo.collection.findOne({
                    'name': adminUserName
                }, {
                    'GcmRegistrationId': true
                },
                function (err, result) {
                    if (err) {
                        var errorObj = {
                            message: "error while trying to get Admin Registration Id :",
                            error: err
                        };
                        mongo.db.close();
                        d.reject(errorObj);
                    }

                    mongo.db.close();
                    d.resolve(result.GcmRegistrationId);
                });
        });

        return d.promise;
    }

    function checkIfUserExist(query) {

        var d = deferred();

        getCollection('users').then(function (mongo) {

            mongo.collection.findOne(query, function (err, result) {
                if (err) {
                    var errorObj = {
                        message: "error while trying to check if user Exist:",
                        error: err
                    };
                    mongo.db.close();
                    d.reject(errorObj);
                }

                mongo.db.close();
                d.resolve(result);
            });
        });

        return d.promise;
    }

    function getAllUserTasks(userId) {

        var d = deferred();

        getCollection('tasks').then(function (mongo) {

            mongo.collection.find({
                $or: [{
                    'from._id': new ObjectID(userId)
                }, {
                    'to._id': new ObjectID(userId)
                }]
            }, {
                "sort": ['createTime', 'asc']
            }).toArray(function (err, result) {
                if (err) {
                    var errorObj = {
                        message: "error while trying to get all Tasks:",
                        error: err
                    };
                    mongo.db.close();
                    d.reject(errorObj);
                }

                mongo.db.close();
                d.resolve(result);
            });
        });

        return d.promise;
    }

    function searchUsers(query) {

        var d = deferred();

        getCollection('users').then(function (mongo) {

            mongo.collection.find(query, {
                '_id': true,
                'name': true,
                'avatarUrl': true,
                'type': true,
                'usersInGroup': true
            }).toArray(function (err, result) {

                if (err) {
                    var errorObj = {
                        message: "error while trying search user: ",
                        error: err
                    };
                    mongo.db.close();
                    d.reject(errorObj);
                }

                mongo.db.close();
                d.resolve(result);
            });
        });

        return d.promise;
    }

    function getAllCliqot() {

        var d = deferred();

        getCollection('Cliqot').then(function (mongo) {

            mongo.collection.find({
                name: {
                    '$ne': 'מנהלים'
                }
            }).toArray(
                function (err, result) {
                    if (err) {
                        var errorObj = {
                            message: "error while trying to get All Cliqot: ",
                            error: err
                        };
                        mongo.db.close();
                        d.reject(errorObj);
                    }

                    mongo.db.close();
                    d.resolve(result);
                });
        });

        return d.promise;
    }

    function getAllTasks(filter, options) {

        var d = deferred();

        getCollection('tasks').then(function (mongo) {

            mongo.collection.find(filter, options).sort({
                createTime: -1
            }).toArray(
                function (err, result) {
                    if (err) {
                        var errorObj = {
                            message: "error while trying to get All tasks: ",
                            error: err
                        };
                        mongo.db.close();
                        d.reject(errorObj);
                    }

                    mongo.db.close();
                    d.resolve(result);
                });
        });

        return d.promise;
    }

    function getAllTasksCount(filter) {

        var d = deferred();

        getCollection('tasks').then(function (mongo) {

            mongo.collection.count(filter, function (err, result) {
                if (err) {
                    var errorObj = {
                        message: "error while trying to get All tasks count: ",
                        error: err
                    };
                    mongo.db.close();
                    d.reject(errorObj);
                }

                mongo.db.close();
                d.resolve(result);
            });
        });

        return d.promise;
    }

    function getAllUsers(filter, options) {

        var d = deferred();

        getCollection('users').then(function (mongo) {

            mongo.collection.find(filter, options).sort({
                createTime: -1
            }).toArray(
                function (err, result) {
                    if (err) {
                        var errorObj = {
                            message: "error while trying to get All users:  ",
                            error: err
                        };
                        mongo.db.close();
                        d.reject(errorObj);
                    }

                    mongo.db.close();
                    d.resolve(result);
                });
        });

        return d.promise;
    }

    function getAllUsersCount(filter) {

        var d = deferred();

        getCollection('users').then(function (mongo) {

            mongo.collection.count(filter,
                function (err, result) {
                    if (err) {
                        var errorObj = {
                            message: "error while trying to get All users count: ",
                            error: err
                        };
                        mongo.db.close();
                        d.reject(errorObj);
                    }

                    mongo.db.close();
                    d.resolve(result);
                });
        });

        return d.promise;
    }

    function getAllVersionInstalled(DDD) {

        var d = deferred();

        getCollection('users').then(function (mongo) {

            mongo.collection.distinct("versionInstalled",
                function (err, result) {
                    if (err) {
                        var errorObj = {
                            message: "error while trying to get All users count: ",
                            error: err
                        };
                        mongo.db.close();
                        d.reject(errorObj);
                    }

                    mongo.db.close();
                    d.resolve(result);
                });
        });

        return d.promise;
    }

    function checkIfVerificationCodeMatch(userId, verificationCode) {

        var d = deferred();

        getCollection('users').then(function (mongo) {

            mongo.collection.findOne({  _id: new ObjectID(userId) , verificationCode: verificationCode },
            function (err, result) {
                    if (err) {
                        var errorObj = {
                            message: "error while trying to check if verification code match: ",
                            error: err
                        };
                        mongo.db.close();
                        d.reject(errorObj);
                    }

                    mongo.db.close();
                    d.resolve(result);
                });
        });

        return d.promise;
    }

    function insertNewRepeatsTasks(tasks) {

        var d = deferred();

        getCollection('repeats-tasks').then(function (mongo) {

            mongo.collection.insert(tasks, function (err, results) {

                if (err) {
                    var errorObj = {
                        message: "error while trying to add new repeats Tasks to DB",
                        error: err
                    };
                    mongo.db.close();
                    d.reject(errorObj);
                }

                mongo.db.close();
                d.resolve(results);

            });
        });

        return d.promise;
    }



})(module.exports);

/*

        var d = deferred();

        getCollection('users').then(function (mongo) {

            mongo.collection.findOne({},
            function (err, result) {
                    if (err) {
                        var errorObj = {
                            message: "error while trying to ... ",
                            error: err
                        };
                        mongo.db.close();
                        d.reject(errorObj);
                    }

                    mongo.db.close();
                    d.resolve(result);
                });
        });

        return d.promise;

 */