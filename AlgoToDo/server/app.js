/*jshint esversion: 6 */

/*
*
* NOTE: in order to install new packeges,
*       the "npm install" command shold run from
*       algotodo main solution folder and not from the algotodo project folder!!!
*
*/

var express = require('express');
var path = require('path');
var mongodb = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var winston = require('winston');
require('winston-loggly-bulk');
var mongoUrl = 'mongodb://admin:avi3011algo@ds033996.mlab.com:33996/algotodo_db_01';
//var mongoUrl = 'mongodb://localhost:27017/TaskManeger';
var app = express();

var http = require('http');

var server = http.createServer(app);

var io = require('socket.io').listen(server);

var bodyParser = require('body-parser');

var port = process.env.PORT || 5001;

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use(express.static('AlgoToDo/www'));
app.use(express.static('AlgoToDo/bower_components'));
app.use(express.static('AlgoToDo/node_modules'));
app.use(express.static('www'));
app.use(express.static('bower_components'));
app.use(express.static('node_modules'));
app.use(express.static('/www'));
app.use(express.static('/bower_components'));
app.use(express.static('/node_modules'));
app.use(express.static('./www'));
app.use(express.static('./bower_components'));
app.use(express.static('./node_modules'));
app.use(express.static('../www'));
app.use(express.static('../bower_components'));
app.use(express.static('../node_modules'));


/* ----- Loggly ------*/


 winston.add(winston.transports.Loggly, {
    token: "301ae60a-8898-4a29-8dd0-cfd69ba095f5",
    subdomain: "doneit",
    tags: ["Winston-NodeJS"],
    json:true
});

/* ---- Start the server ------ */
server.listen(process.env.PORT || 5001, function (err) {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

/* ----- APN ------ */

//var pfx = path.join(__dirname, './ApnCertificates/sandbox/Certificates.p12');
//var cert = path.join(__dirname, './ApnCertificates/sandbox/cert.pem');
//var key = path.join(__dirname, './ApnCertificates/sandbox/key.pem');


var apn = require('apn');
var APNsAuthKey = path.join(__dirname, './ApnCertificates/APNsAuthKey_JXZ3MBK8YA.p8');
var pfx = path.join(__dirname, './ApnCertificates/production/prod_Certificates.p12');
var cert = path.join(__dirname, './ApnCertificates/production/aps_prod_cert.pem');
var key = path.join(__dirname, './ApnCertificates/production/aps_prod_key.pem');

var apnProviderOptions = {
    token: {
        key: APNsAuthKey,
        keyId: "JXZ3MBK8YA",
        teamId: "TYMZRJ5DHP",
    },   
    cert: cert,
    key: key,
    pfx: pfx,
    roduction: true,
    passphrase: 'avi3011algo',
    heartBeat: 30000
};

var apnProvider;

var createApnProvider = function () {
    apnProvider = new apn.Provider(apnProviderOptions);
};

createApnProvider();

var sendTaskViaApn = function(task, userUnDoneTaskCount, ApnRegistrationId, isUpdate){

    createApnProvider();

    var deviceTokenInHex = Buffer.from(ApnRegistrationId, 'base64').toString('hex');
    
    var note = new apn.Notification();
    
    note.priority = 10;
    note.topic = "com.algotodo.app";
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.contentAvailable = 1;
    
    if(isUpdate){
        note.payload = { 'additionalData': {
            type: "task-update",
            object: task,
            taskId: task._id
        } };
        
        /*note.badge = null;
        note.sound = null;
        note.body = null;
        note.title = undefined;*/
    }
    else {
        note.payload = { 'additionalData': {
            type: "task",
            object: task,
            taskId: task._id
        } };
        
        note.badge = userUnDoneTaskCount;
        note.sound = "ping.aiff";
        note.body = task.description;
        note.title = "משימה חדשה מ" + task.from.name;
        
    }
                      
    // Actually send the message
    apnProvider.send(note, ApnRegistrationId).then(function (response) {
        console.log("send message", note);
                                                 
        if (response.failed.length > 0) {
            console.error("error while sending push notification to apple user: ", response.failed);
            winston.log('error', "error while sending push notification to apple user: ", response.failed);
        }
        else {
            console.log(response.sent);
        }
    });
};

var sendCommentViaApn = function(comment, task, ApnRegistrationId){
    
    createApnProvider();

    var deviceTokenInHex = Buffer.from(ApnRegistrationId, 'base64').toString('hex');
    
    var note = new apn.Notification();
    
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    //note.badge = userUnDoneTaskCount;
    note.priority = 10;
    note.sound = "ping.aiff";
    //note.alert = "משימה חדשה מ" + task.from.name;//"\uD83D\uDCE7 \u2709 You have a new message";
    note.payload = { 'additionalData': {
                            type: "comment",
                            object: comment,
                            taskId: task._id
                        }
                    };
    //note.payload = task ;
    note.topic = "com.algotodo.app";
    note.body =  comment.text !== '' ? "💬 " + comment.text : "  " + " תמונה";
    note.title = "תגובה חדשה מ" + comment.from.name;
    note.contentAvailable = 1;
    
    // Actually send the message
    apnProvider.send(note, ApnRegistrationId).then(function (response) {
                                                   
        if (response.failed.length > 0) {
            console.error("error while sending push notification to apple user: ", response.failed);
            winston.log('error', "error while sending push notification to apple user: ", response.failed);
        }
        else {
            console.log(response.sent);
        }
    });
};

//sendApnMessage({from:{name:'אבי שמואלי'},description: 'יש לך 2 דקות להגיע לפה'},1,"b83a1fe9f784c3a7a1706f8bc4e5c4146be72c74b52b858b85e8df27b54c04f9");

/* ----- GCM ------ */
var gcm = require('node-gcm');

var GcmSender = new gcm.Sender('AIzaSyDPJtKwWeftuwuneEWs-WlLII6LE7lGeMk');

var sendTaskViaGcm = function (task, userUnDoneTaskCount, regToken, isUpdate) {
    console.log("****", task);
    var message;
    if(isUpdate) {
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
    }
    else {
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
    GcmSender.send(message, { registrationTokens: [regToken] }, function (err, response) {
        console.log("send message", message);
        if (err) {
            console.error("error while sending push notification: ", err);
            winston.log('error', "error while sending push notification: ", err);
        }
        else {
            console.log(response);
        }
    });
};

var sendCommentViaGcm = function (comment, task, regToken) {

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
            body: comment.text !== '' ?  comment.text : "📷 " + " תמונה"
        }
    });

    message.addData('notId', task.from._id);
    message.addData('content-available', '1');
    message.addData('image', 'www/images/asiti-logo.png');
    message.addData('style', 'inbox');
    message.addData('summaryText', ' יש לך %n% תגובות חדשות');

    console.log("sending message : ", message);
    console.log("with GcmRegistrationId: ", regToken);

    // Actually send the message
    GcmSender.send(message, { registrationTokens: [regToken] }, function (err, response) {
        console.log("send message", message);
        if (err) {
            console.error("error while sending push notification: ", err);
            winston.log('error', "error while sending push notification: ", err);
        }
        else {
            console.log(response);
        }
    });
};

// -------- Socket.io --------//

var users = [];
io.on('connection', function (socket) {

    // response to the client call for Login and join the chat
    socket.on('join', function (data) {
        socket.userId = data.userId;
        users[socket.userId] = socket;
        var userObj = {
            userId: data.userId,
            socketid: socket.id
        };
        users.push(userObj);
        //console.log(userObj.userName + ' just connected!!');
        //io.emit('all-users', users);
    });

    /* //send to the client all the users when Login
    socket.on('get-users', function () {
        socket.emit('all-users', users);
    });

    //send to the client all his tasks
    socket.on('get-tasks', function (data) {
        // get user tasks
        var userName = data.userName;
        mongodb.connect(mongoUrl, function (err, db) {
            var collection = db.collection('tasks');
            collection.find({ to: userName }).limit(200).toArray(function (err, result) {
                socket.emit('users-tasks', result);
                db.close();
            });
        });
    });
    
    //get the new task and save it to MongoClient
    //then send message to the emploee with the task
    socket.on('create-task', function (data) {
        // ---- curently not in use becuse cano't emit to both the "to" and the "from" clients -------- //
        var task = data.task;
        var to = users[task.to].id;
        var from = users[task.from].id;

        //add task to Mongo
        mongodb.connect(mongoUrl, function (err, db) {
            var collection = db.collection('tasks');

            collection.insert(task,
                function (err, results) {
                    //console.log(results.ops[0]);
                    // send the new task to the employee and to the maneger
                    socket.broadcast.to(to).emit('new-task', results.ops[0]); 
                    socket.broadcast.to(from).emit('new-task', results.ops[0]);
                    db.close();
                });
        });

        // if we whant to brodcast the message to all users
        // socket.broadcast.emit('task-received', data);
    });

    //get task and update it in MongoClient
    //then send message to the maneger with the task
    socket.on('update-task', function (data) {
        // ---- curently not in use becuse cano't emit to both the "to" and the "from" clients -------- //
        var task = data.task;

        //update task
        mongodb.connect(mongoUrl, function (err, db) {
            var collection = db.collection('tasks');

            collection.updateOne({ _id: ObjectID(task._id) }, { $set: { 'status': task.status, 'doneTime': task.doneTime, 'seenTime': task.seenTime } },
                function (err, result) {
                    console.log('After:\n');
                    console.log(result);
                    // send the new task to the employee
                    //socket.broadcast.to(reciver).emit('updated-task', results.ops[0]);
                    db.close();
                }); 
        });

        // if we whant to brodcast the message to all users
        // socket.broadcast.emit('task-received', data);
    });
    */
});

// -------- DAL ------------- //

app.post('/TaskManeger/newTask', function (req, res) {

    var task = req.body.task;
    var tasks;
    // handel the old version
    if(Array.isArray(task)){
        tasks = task;
    }
    else {
       tasks = [task]; 
    }

    /*var to = '';
    if (users[task.to._id] !== undefined) {
        to = users[task.to._id].id;
    }*/
    var recipientsIds = [];
    for (var i = 0, len = tasks.length; i < len; i++) {
        tasks[i].to._id = new ObjectID(tasks[i].to._id);
        tasks[i].from._id = new ObjectID(tasks[i].from._id);
        recipientsIds.push(tasks[i].to._id);
    }

    /*var toId = task.to._id;
    var fromId = task.from._id;
    task.to._id = ObjectID(toId);
    task.from._id = ObjectID(fromId);*/

    //add tasks to Mongo
    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('tasks');

        collection.insert(tasks, function (err, results) {

            if (err) {
                winston.log('error', "error while trying to add new Task: ", err);
            }

            // if the employee is now online send the new task by Socket.io
            /*console.log("to:", to);
            if (to !== '' && task.to._id !== task.from._id) {
                io.to(to).emit('new-task', results.ops[0]);
            }*/
            var newTasks = results.ops;
            console.log("trying to send new tasks", newTasks);
            
            // if this task is not from me to me, send notification to the user
            //if (task.to._id !== task.from._id) {
                pushTaskToUsersDevice(newTasks, recipientsIds);
            //}
            db.close();
            // return the new task to the sender
            res.send(results.ops);       
        });
    });
});

app.post('/TaskManeger/newComment', function (req, res) {

    var taskId = req.body.taskId;
    var comment = req.body.comment;

    var fromId = comment.from._id;
    comment.from._id = new ObjectID(fromId);
    comment._id = new ObjectID();
    //add task to Mongo
    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('tasks');

        collection.findAndModify({ _id: new ObjectID(taskId) }, [['_id', 'asc']],
            { $push: { comments: comment } },{new: true},
            function (err, results) {

                if (err) {
                    winston.log('error', "error while trying to add new Task: ", err);
                }
                var task = results.value;
                
                var userIdToNotify = '';
                var ioIdToNotify = '';
                if (task.from._id.equals(comment.from._id)) {
                    userIdToNotify = task.to._id;
                }
                else {
                    userIdToNotify = task.from._id;
                }

                if (users[userIdToNotify] !== undefined) {
                    ioIdToNotify = users[userIdToNotify].id;
                }
                
                // if the employee is now online send the new task by Socket.io
                if (userIdToNotify !== '' && !task.to._id.equals(task.from._id)) {
                    //io.to(ioIdToNotify).emit('new-comment', { taskId: task._id, newComment: comment });
                }

                // if this task is not from me to me, send notification to the user
                if (!task.to._id.equals(task.from._id)) {
                    pushCommentToUserDevice(comment, task, userIdToNotify);
                }

                // return the new task to the sender
                //res.send(results.ops[0]);
                db.close();
                res.send('ok');
            });
        });
});

app.post('/TaskManeger/updateTaskStatus', function (req, res) {
    var task = req.body.task;
    /*var from = '';
    if (users[task.from._id] !== undefined) {
        from = users[task.from._id].id;
    }*/

    //add task to Mongo
    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('tasks');

        collection.findAndModify({ _id: new ObjectID(task._id) }, [['_id', 'asc']], 
        { $set: { 'status': task.status, 'doneTime': task.doneTime, 'seenTime': task.seenTime } }, {new: true},
            function (err, results) {
                /*// send the updated task to the maneger and return it to the employee
                if (from !== '') {
                    io.to(from).emit('updated-task', results.value);
                }*/
                
                // if this task is not from me to me, send notification to the user
                if (task.to._id !== task.from._id) {
                    pushUpdatetdTaskToUsersDevice(results.value, task.from._id);
                }
                db.close();
                res.send(results.value);

            });
    });
});

app.post('/TaskManeger/updateUserDetails', function (req, res) {

    var userId = req.body.userId;
    var fieldToUpdate = req.body.fieldToUpdate;
    var valueToUpdate = req.body.valueToUpdate;

    //add task to Mongo
    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('users');
        var updateObj = {};
        updateObj[fieldToUpdate] = valueToUpdate;
        collection.findAndModify({ _id: new ObjectID(userId) }, [['_id', 'asc']], { $set: updateObj }, {new: true},
            function (err, results) {
                db.close();
                res.send(results);                 
            });
    });
});

app.post('/TaskManeger/registerUser', function (req, res) {

    var user = req.body.user;
    if (user.hasOwnProperty('_id')) {
        delete user._id;
    }
    console.log("the user just register to the app: ", user);
    console.log("with GcmRegistrationId: ", user.GcmRegistrationId);

    //add user to Mongo
    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('users');

        collection.insert(user, function (err, results) {

            if (err) {
                winston.log('error', "error while trying register new user: ", err);
            }

            var newUser = results.ops[0];
            /*if (newUser.GcmRegistrationId !== undefined) {
                GcmRegistrationIdsCache[newUser._id] = { 'userId': user._id, 'userName': newUser.name, GcmRegistrationId: newUser.GcmRegistrationId };
            }*/
            if(newUser.type !== 'apple-tester'){
                sendVerificationCodeToUser(newUser);
            }
            db.close();
            res.send(newUser);
        });
    });
});

app.get('/TaskManeger/getTasks', function (req, res) {
    
    var userId = req.query.userId;
    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('tasks');
        collection.find({
                $or: [
                        { 'from._id': new ObjectID(userId) },
                        { 'to._id': new ObjectID(userId) }
                ]
            }, { "sort": ['createTime', 'asc'] }).toArray(function (err, result) {

            if (err) {
                winston.log('error', "error while trying to get all Tasks: ", err);
            }

            db.close();
            res.send(result); 
        });
    });
});

app.get('/TaskManeger/searchUsers', function (req, res) {

    var string = req.query.queryString;
    var cliqaId = req.query.userCliqaId;
    var query = {};

    if(cliqaId !== undefined){
        query = {$and: [
                        { 'name': { "$regex": string, "$options": "i" } },
                        { 'cliqot._id': new ObjectID(cliqaId)}
                       ]
                };
    }
    else{
        query = { 'name': { "$regex": string, "$options": "i" } };
    }

    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('users');
        collection.find(query, { '_id': true, 'name': true, 'avatarUrl': true, 'type': true, 'usersInGroup': true }).toArray(function (err, result) {

            if (err) {
                winston.log('error', "error while trying search user: ", err);
            }

            db.close();
            res.send(result);
        });
    });
});

app.get('/TaskManeger/isUserExist', function (req, res) {

    var userPhone = req.query.userPhone;
    var userName = req.query.userName;
    var userEmail = req.query.userEmail;
    
    var query = userName === undefined || userName === null ? { 'email': userEmail, 'phone': userPhone } : { 'name': userName, 'phone': userPhone };

    mongodb.connect(mongoUrl, function (err, db) {
                    
        if (err) {
            winston.log('error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('users');
        collection.findOne(query , function (err, result) {

            if (err) {
                winston.log('error', "error while trying to check if user Exist: ", err);
            }

            db.close();
            if (result === null) {
                res.send('');
            }
            else {
                res.send(result);
                if(result.type !== 'apple-tester'){
                    sendVerificationCodeToUser(result);
                }               
            }
        });
    });
});

var getUsersByUsersId = function (usersIds, callback) {

    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('users');
        collection.find({ '_id': { $in: usersIds} }, { '_id': true, 'name': true, 'GcmRegistrationId': true, 'ApnRegistrationId': true }).toArray(function (err, result) {
            db.close();
            callback(err, result);
        });
    });
};

var getUnDoneTasksCountByUserId = function (userId, callback) {

    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('tasks');
        collection.count({ 'to._id': new ObjectID(userId), 'status': 'inProgress' }, function (err, result) {

            if (err) {
                winston.log('error', "error while trying to get UnDone Tasks Count: ", err);
            }

            db.close();
            callback(err, result);
        });
    });
};

var pushTaskToUsersDevice = function (tasks, recipientsIds) {

    // get user from DB and check if there GcmRegId or ApnRegId
    getUsersByUsersId(recipientsIds, function (error, users) {

        tasks.forEach(function(task, index){
            if (!task.to._id.equals(task.from._id)) {
                var user = users.find(x => x._id.equals(task.to._id));
                // get the number that will be set to the app icon badge
                getUnDoneTasksCountByUserId(task.to._id, function (error, userUnDoneTaskCount) {
                    if (user.GcmRegistrationId !== undefined) {
                        sendTaskViaGcm(task, userUnDoneTaskCount, user.GcmRegistrationId, false);
                    }
                    if (user.ApnRegistrationId !== undefined) {
                        sendTaskViaApn(task, userUnDoneTaskCount, user.ApnRegistrationId, false);
                    }
                });
            }
        });
    });
};

var pushCommentToUserDevice = function (comment, task, userIdToNotify) {

    // get user from DB and check if there GcmRegId or ApnRegId
    getUsersByUsersId([userIdToNotify], function (error, result) {
        if(Array.isArray(result) && result.length === 1) {
            var user = result[0];        
        
            if (user.GcmRegistrationId !== undefined) {
                sendCommentViaGcm(comment, task, user.GcmRegistrationId);
            }
            if (user.ApnRegistrationId !== undefined) {
                sendCommentViaApn(comment, task, user.ApnRegistrationId);
            }
        }
    });
};

var pushUpdatetdTaskToUsersDevice = function (task, recipientId) {

    // get user from DB and check if there GcmRegId or ApnRegId
    getUsersByUsersId([new ObjectID(recipientId)], function (error, users) {
        if(users.length > 0){
            var user = users[0];
                      
        if (user.GcmRegistrationId !== undefined) {
            sendTaskViaGcm(task, '', user.GcmRegistrationId, true);
        }
        if (user.ApnRegistrationId !== undefined) {
            sendTaskViaApn(task, '', user.ApnRegistrationId, true);
        }
                      }
    });
};

app.get('/TaskManeger/getAllCliqot', function (req, res) {

    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('Cliqot');
        collection.find({name: {'$ne': 'מנהלים'}}).toArray(function (err, result) {

            if (err) {
                winston.log('error', "error while trying to get All Cliqot: ", err);
            }

            db.close();
            res.send(result);
        });
    });
});

var sendVerificationCodeToUser = function(user){
    
    var verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('users');
        collection.findOne({ 'name': 'אבי שמואלי' }, { 'GcmRegistrationId': true }, function (err, result) {
            db.close();
            sendSmsViaAdminPhone(verificationCode, result.GcmRegistrationId, user);
        });
       
        collection.findAndModify({ _id: new ObjectID(user._id) }, [['_id', 'asc']],
            { $set: { 'verificationCode': verificationCode } },{new: true},
            function (err, results) {

                if (err) {
                    winston.log('error', "error while trying to save verification Code to user: ", err);
                }

                db.close();
            });

    });
};

var sendSmsViaAdminPhone = function (verificationCode, AdminRegToken, user) {

    var message = new gcm.Message({
        data: {
            additionalData: {
                type: "verificationCode",
                object: {verificationCode: verificationCode, phoneNumaber: user.phone}
            },
            // comment those lines for cilent otifications
            //title: "שולח קוד אימות",
            //sound: 'default',
            //icon: 'res://ic_menu_paste_holo_light',
            //body: "שולח קוד אימות למשתמש " + user.name,
        }
    });
            
    message.addData('content-available', '1');
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
};

app.get('/TaskManeger/checkIfVerificationCodeMatch', function (req, res) {

    var verificationCode = req.query.verificationCode;
    var userId = req.query.userId;

    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('users');
        collection.findOne({  _id: new ObjectID(userId) , verificationCode: verificationCode },
            function (err, result) {

                if (err) {
                    winston.log('error', "error while trying to add new Task: ", err);
                }               
                db.close();
                if(result !== null){
                    res.send('ok');
                }
                else{
                    res.send('notMatch');
                }
            });
    });
});