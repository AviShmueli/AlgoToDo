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
    DAL.getAllRepeatsTasks = getAllRepeatsTasks;
    DAL.getUsersRepeatsTasks = getUsersRepeatsTasks;
    DAL.updateRepeatsTasks = updateRepeatsTasks;
    DAL.deleteRepeatsTasks = deleteRepeatsTasks;
    DAL.getDoneTasks = getDoneTasks;
    DAL.getTasksInProgress = getTasksInProgress;
    DAL.getGroupSubTasksInProgress = getGroupSubTasksInProgress;
    DAL.createNewCliqa = createNewCliqa;
    DAL.addNewCliqaToAdmins = addNewCliqaToAdmins;
    DAL.getAllOldVersionUsers = getAllOldVersionUsers;
    DAL.getUsersByPhoneNumbers = getUsersByPhoneNumbers;
    DAL.addNewGroup = addNewGroup;
    DAL.deleteGroups = deleteGroups;
    DAL.getUsersInCliqa = getUsersInCliqa;
    DAL.addUsersToCliqa = addUsersToCliqa;


    var deferred = require('deferred');
    var mongodb = require('mongodb').MongoClient;
    var ObjectID = require('mongodb').ObjectID;
    var mongoUrl = 'mongodb://admin:avi3011algo@ds127059-a0.mlab.com:27059/algotodo_db_01?replicaSet=rs-ds127059';
    //var mongoUrl = 'mongodb://admin:avi3011algo@ds033996.mlab.com:33996/algotodo_db_01';
    //var mongoUrl = 'mongodb://localhost:27017/TaskManeger';
    var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

    function getCollection(collectionName) {

        var d = deferred();

        try {
            mongodb.connect(mongoUrl, function (err, db) {

                if (err) {
                    var errorObj = {
                        message: "error while trying to connect MongoDB",
                        error: err
                    };
                    d.reject(errorObj);
                }
                if (db) {
                    d.resolve({
                        collection: db.collection(collectionName),
                        db: db
                    });
                }
            });
        } catch (error) {
            d.reject(error);
        }

        return d.promise;
    }

    function insertNewTasks(tasks) {

        // TODO: convert createTime to date object

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
                'ApnRegistrationId': true,
                'usersInGroup': true,
                'avtarUrl': true
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

        // TODO: convert createTime to date object

        var d = deferred();

        getCollection('tasks').then(function (mongo) {

            mongo.collection.findAndModify({
                    _id: new ObjectID(taskId)
                }, [
                    ['_id', 'asc']
                ], {
                    $push: {
                        comments: comment
                    },
                    $set: {
                        lastModified: new Date()
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

        // TODO: convert createTime to date object

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
                    },
                    $set: {
                        lastModified: new Date()
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

        // TODO: convert createTime to date object

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
                        'seenTime': task.seenTime,
                        'lastModified': new Date()
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

        // TODO: convert createTime to date object

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
                        'seenTime': task.seenTime,
                        'lastModified': new Date()
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

    function getAllUserTasks(userId, lastServerSync) {

        var d = deferred();

        getCollection('tasks').then(function (mongo) {

            var query = {
                $or: [{
                    'from._id': new ObjectID(userId)
                }, {
                    'to._id': new ObjectID(userId)
                }]
            };

            if (lastServerSync !== undefined) {
                var lastServerSyncDate = new Date(lastServerSync);
                query['lastModified'] = {
                    '$gte': lastServerSyncDate
                };
            }

            mongo.collection.find(query, {
                "sort": ['lastModified', 'asc']
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

    function getTasksInProgress(userId, lastServerSync) {

        var d = deferred();

        var query = {
            $or: [{
                'from._id': new ObjectID(userId)
            }, {
                'to._id': new ObjectID(userId)
            }],
            status: 'inProgress'
        };

        if (lastServerSync !== undefined) {
            var lastServerSyncDate = new Date(lastServerSync);
            query['lastModified'] = {
                '$gte': lastServerSyncDate
            };
        }

        getCollection('tasks').then(function (mongo) {

            mongo.collection.find(query, {
                "sort": ['lastModified', 'asc']
            }).toArray(function (err, result) {
                if (err) {
                    var errorObj = {
                        message: "error while trying to get all inProgress Tasks:",
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

    function getDoneTasks(userId, page, lastServerSync) {

        var d = deferred();

        page = parseInt(page)
        var query = {
            $or: [{
                status: 'done'
            }, {
                status: 'closed'
            }],
            $or: [{
                'from._id': new ObjectID(userId)
            }, {
                'to._id': new ObjectID(userId)
            }]
        };

        if (page === 0 && lastServerSync !== undefined) {
            var lastServerSyncDate = new Date(lastServerSync);
            query['lastModified'] = {
                '$gte': lastServerSyncDate
            };
        }

        getCollection('tasks').then(function (mongo) {

            mongo.collection.find(query, {
                skip: page,
                limit: 20
            }).sort({
                doneTime: -1
            }).toArray(function (err, result) {
                if (err) {
                    var errorObj = {
                        message: "error while trying to get all Done Tasks:",
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
                'usersInGroup': true,
                'phone': true,
                'creatorId': true
                //'cliqot': true
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

    function getAllVersionInstalled() {

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

            mongo.collection.findOne({
                    _id: new ObjectID(userId),
                    verificationCode: verificationCode
                },
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

        // TODO: convert createTime to date object

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
                d.resolve(results.ops);

            });
        });

        return d.promise;
    }

    function deleteRepeatsTasks(tasksIds) {

        var d = deferred();

        getCollection('repeats-tasks').then(function (mongo) {

            mongo.collection.remove({
                '_id': {
                    $in: tasksIds
                }
            }, function (err, results) {

                if (err && results.result.n === tasksIds.length) {
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

    function getAllRepeatsTasks() {

        var d = deferred();

        getCollection('repeats-tasks').then(function (mongo) {

            mongo.collection.find({}).toArray(function (err, results) {

                if (err) {
                    var errorObj = {
                        message: "error while trying to get all repeats Tasks from DB",
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

    function getUsersRepeatsTasks(userId) {

        var d = deferred();

        getCollection('repeats-tasks').then(function (mongo) {

            mongo.collection.find({
                creatorId: userId
            }).toArray(function (err, results) {

                if (err) {
                    var errorObj = {
                        message: "error while trying to get all users repeats Tasks from DB",
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

    function updateRepeatsTasks(tasks) {

        var d = deferred();

        getCollection('repeats-tasks').then(function (mongo) {

            var batch = mongo.collection.initializeUnorderedBulkOp({
                useLegacyOps: true
            });

            for (var i = 0; i < tasks.length; i++) {
                var task = JSON.parse(JSON.stringify(tasks[i]));
                var id = task._id;
                delete task._id;
                batch.find({
                    _id: new ObjectID(id)
                }).updateOne({
                    $set: task
                });
            }

            batch.execute(function (err, result) {

                if (err && result.getRawResponse().nModified === tasks.length) {
                    var errorObj = {
                        message: "error while trying to update repeats tasks: ",
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

    function getGroupSubTasksInProgress(mainTaskId) {
        var d = deferred();

        getCollection('tasks').then(function (mongo) {

            mongo.collection.count({
                    groupMainTaskId: mainTaskId,
                    $nor: [{
                        status: 'done'
                    }, {
                        status: 'closed'
                    }]
                },
                function (err, result) {
                    if (err) {
                        var errorObj = {
                            message: "error while trying to get Group SubTasks InProgress",
                            error: err
                        };
                        mongo.db.close();
                        d.reject(errorObj);
                    }

                    mongo.db.close();
                    d.resolve({
                        count: result,
                        id: mainTaskId
                    });
                });
        });

        return d.promise;
    }

    function createNewCliqa(cliqaName) {

        var d = deferred();

        getCollection('Cliqot').then(function (mongo) {

            mongo.collection.insert({
                name: cliqaName
            }, function (err, results) {

                if (err) {
                    var errorObj = {
                        message: "error while trying to add new Cliqa to DB",
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

    function addNewCliqaToAdmins(newCliqa) {

        getCollection('users').then(function (mongo) {

            mongo.collection.updateMany({
                    type: 'system-admin'
                }, {
                    $push: {
                        cliqot: newCliqa
                    }
                },
                function (err, result) {
                    if (err) {
                        var errorObj = {
                            message: "error while trying to update user details: ",
                            error: err
                        };
                        mongo.db.close();
                    }

                    mongo.db.close();
                });
        });
    }

    function getAllOldVersionUsers(platform, latestVersion) {

        var d = deferred();

        getCollection('users').then(function (mongo) {

            mongo.collection.find({
                'device.platform': platform,
                versionInstalled: {
                    '$ne': latestVersion
                }
            }, {
                ApnRegistrationId: true,
                GcmRegistrationId: true
            }).toArray(
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

    function getUsersByPhoneNumbers(phoneNumbers) {
        var d = deferred();

        getCollection('users').then(function (mongo) {

            mongo.collection.find({
                'phone': {
                    $in: phoneNumbers
                }
            }, {
                '_id': true,
                'name': true,
                'avatarUrl': true,
                'type': true,
                'usersInGroup': true,
                'phone': true
                //'cliqot': true
            }).toArray(
                function (err, result) {
                    if (err) {
                        var errorObj = {
                            message: "error while trying to get Users By Phone Numbers ",
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

    function addNewGroup(group) {
        var d = deferred();

        getCollection('users').then(function (mongo) {

            mongo.collection.save(group,
                function (err, result) {
                    if (err) {
                        var errorObj = {
                            message: "error while trying to add new Group ",
                            error: err
                        };
                        mongo.db.close();
                        d.reject(errorObj);
                    }

                    mongo.db.close();
                    d.resolve(result.ops);
                });
        });

        return d.promise;
    }

    function deleteGroups(groupIds) {
        var d = deferred();

        getCollection('users').then(function (mongo) {

            mongo.collection.remove({
                    '_id': {
                        $in: groupIds
                    }
                },
                function (err, result) {
                    if (err) {
                        var errorObj = {
                            message: "error while trying to remove Group ",
                            error: err
                        };
                        mongo.db.close();
                        d.reject(errorObj);
                    }

                    mongo.db.close();
                    d.resolve(result.ops);
                });
        });

        return d.promise;
    }

    function getUsersInCliqa(cliqaId) {

        var d = deferred();

        getCollection('users').then(function (mongo) {

            mongo.collection.find({
                'cliqot._id': new ObjectID(cliqaId),
                cliqot: {
                    $exists: true
                }
            }, {
                '_id': true,
                'name': true,
                'avatarUrl': true,
                'type': true,
                'usersInGroup': true,
                'phone': true,
                'creatorId': true
                //'cliqot': true
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


    function addUsersToCliqa(cliqa, users) {

        var d = deferred();

        getCollection('users').then(function (mongo) {

            // Initialize the unordered Batch
            var batch = mongo.collection.initializeUnorderedBulkOp({
                useLegacyOps: true
            });

            cliqa._id = new ObjectID(cliqa._id);

            for (var i = 0; i < users.length; i++) {
                var user = users[i];

                batch.find({
                    _id: new ObjectID(user._id)
                }).updateOne({
                    $push: {
                        cliqot: cliqa
                    }
                });

                // TODO: 1. notify user that he has been aded to cliqa.
                //       2. mark the cliqa status in the user as pending
                //       2.1 in the cliqa page show that he in pending state
                //       2.2 in user make indication about the invitation and an option to acsept the invitation
                //       3. add option to acsept invitation
                //       3.1 change cliqa status in user to active 
                //       3.2 notify manager and cliqa members about new member in the cliqa 
                //       3.3 in user add to allUsersList all the members in the cliqa

                // if (user.userIdToNotify !== '') {
                //     commentsNotificationsList.push({
                //         comment: user.comment,
                //         task: {
                //             _id: user.taskId
                //         },
                //         userIdToNotify: new ObjectID(user.userIdToNotify)
                //     });
                // }
            }

            batch.execute(function (err, result) {

                if (err) {
                    var errorObj = {
                        message: "error while trying to add users to cliqa:",
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