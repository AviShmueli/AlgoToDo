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

var port = process.env.PORT || 5002;

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
    token: "666c914a-b76a-4aff-8c61-f7d45d681abf",
    subdomain: "algotodo",
    tags: ["AlgoTodo-Node-Server"],
    json: true
});


/* ---- Start the server ------ */
server.listen(process.env.PORT || 5002, function (err) {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

/* ----- GCM ------ */
var gcm = require('node-gcm');

var sender = new gcm.Sender('AIzaSyDPJtKwWeftuwuneEWs-WlLII6LE7lGeMk');
var GcmRegistrationIdsCache = {};

var pushTaskToAndroidUser = function (task) {

    var message = new gcm.Message({
        /*collapseKey: task.from._id,
        priority: 'high',
        delayWhileIdle: true,*/
        data: {
            additionalData: task,
            title: "משימה חדשה מ" + task.from.name,
            sound: 'default',
            icon: 'www/images/icon.png',
            body: task.description,
            badge: "1"
        }
         
    });

    message.addData('notId', task.from._id);
    message.addData('content-available', '1');
    message.addData('image', 'www/images/algologo1.png');
    message.addData('style', 'inbox');
    message.addData('summaryText', 'יש לך %n% משימות חדשות');
    var regToken = '';
    
    // if the user stored in the cache, get the regId from the cache
    if (GcmRegistrationIdsCache[task.to._id] !== undefined) {
        regToken = GcmRegistrationIdsCache[task.to._id].GcmRegistrationId;
        sendMessage(message, regToken);
    }
    else {
        // get user from DB and check if there is regId
        getUserByUserId(task.to._id, function (error, user) {
            if (user.GcmRegistrationId !== undefined) {
                regToken = user.GcmRegistrationId;

                // save the user to the cache
                GcmRegistrationIdsCache[user._id] = { 'userId': user._id, 'userName': user.name, 'GcmRegistrationId': user.GcmRegistrationId };
                sendMessage(message, regToken);
            }
            else {
                // if user dont have regId dont try to send notification via CGM
                // todo: insert here code for sending notification via Apple Notification Service
                return;
            }
        });
        
    }   
};

var sendMessage = function (message, regToken) {

    console.log("sending message : ", message);
    console.log("with GcmRegistrationId: ", regToken);

    var task = message.params.data.additionalData;
    // get the number that will be set to the app icon badge
    getUnDoneTasksCountByUserId(task.to._id, function (error, userUnDoneTaskCount) {
        message.params.data.badge = userUnDoneTaskCount;

        // Actually send the message
        sender.send(message, { registrationTokens: [regToken] }, function (err, response) {
            console.log("send message", message);
            if (err) {
                console.error("error while sending push notification: ", err);
                winston.log('Error', "error while sending push notification: ", err);
            }
            else {
                console.log(response);
            }
        });
    });

};

// -------- Socket.io --------//

var users = [];
io.on('connection', function (socket) {
    console.log('new connection made');

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
    var to = '';
    if (users[task.to._id] !== undefined) {
        to = users[task.to._id].id;
    }

    var toId = task.to._id;
    var fromId = task.from._id;
    task.to._id = ObjectID(toId);
    task.from._id = ObjectID(fromId);

    //add task to Mongo
    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('Error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('tasks');

        collection.insert(task, function (err, results) {

            if (err) {
                winston.log('Error', "error while trying to add new Task: ", err);
            }

            // if the employee is now online send the new task by Socket.io
            console.log("to:", to);
            if (to !== '' && task.to._id !== task.from._id) {
                io.to(to).emit('new-task', results.ops[0]);
            }
            console.log("trying to send new task", task);
            // if this task is not from me to me, send notification to the user
            if (task.to._id !== task.from._id) {
                pushTaskToAndroidUser(task);
            }

            // return the new task to the sender
            res.send(results.ops[0]);

            db.close();
        });
    });
});

app.post('/TaskManeger/updateTaskStatus', function (req, res) {

    var task = req.body.task;
    var from = '';
    if (users[task.from._id] !== undefined) {
        from = users[task.from._id].id;
    }

    //add task to Mongo
    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('Error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('tasks');

        collection.findAndModify({ _id: ObjectID(task._id) }, [['_id', 'asc']], { $set: { 'status': task.status, 'doneTime': task.doneTime, 'seenTime': task.seenTime } }, {new: true},
            function (err, results) {
                
                // send the updated task to the maneger and return it to the employee
                if (from !== '') {
                    io.to(from).emit('updated-task', results);
                }

                res.send(results);
                db.close();
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
            winston.log('Error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('users');

        collection.insert(user, function (err, results) {

            if (err) {
                winston.log('Error', "error while trying register new user: ", err);
            }

            var newUser = results.ops[0];
            if (newUser.GcmRegistrationId !== undefined) {
                GcmRegistrationIdsCache[newUser._id] = { 'userId': user._id, 'userName': newUser.name, GcmRegistrationId: newUser.GcmRegistrationId };
            }
            res.send(newUser);
            db.close();
        });
    });
});

app.get('/TaskManeger/getTasks', function (req, res) {
    
    var userId = req.query.userId;
    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('Error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('tasks');
        collection.find({ $or: [{ 'from._id': new ObjectID(userId) }, { 'to._id': new ObjectID(userId) }] }, { "sort": ['createTime', 'asc'] }).toArray(function (err, result) {

            if (err) {
                winston.log('Error', "error while trying to get all Tasks: ", err);
            }

            res.send(result); 
            db.close();
        });
    });
});

app.get('/TaskManeger/searchUsers', function (req, res) {

    var string = req.query.queryString;
    var query = { 'name': { "$regex": string, "$options": "i" } };

    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('Error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('users');
        collection.find(query, { '_id': true, 'name': true, 'avatarUrl': true }).toArray(function (err, result) {

            if (err) {
                winston.log('Error', "error while trying search user: ", err);
            }

            db.close();
            res.send(result);
        });
    });
});

app.get('/TaskManeger/isUserExist', function (req, res) {

    var userPhone = req.query.userPhone;
    var userEmail = req.query.userEmail;
    
    mongodb.connect(mongoUrl, function (err, db) {
                    
        if (err) {
            winston.log('Error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('users');
        collection.findOne({ 'email': userEmail, 'phone': userPhone }, function (err, result) {

            if (err) {
                winston.log('Error', "error while trying to check if user Exist: ", err);
            }

            db.close();
            if (result === null) {
                res.send('');
            }
            else {
                res.send(result);
            }
        });
    });
});

var getUserByUserId = function (userId, callback) {

    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('Error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('users');
        collection.findOne({ '_id': ObjectID(userId) }, { '_id': true, 'name': true, 'GcmRegistrationId': true }, function (err, result) {
            db.close();
            callback(err, result);
        });
    });
};

var getUnDoneTasksCountByUserId = function (userId, callback) {

    mongodb.connect(mongoUrl, function (err, db) {

        if (err) {
            winston.log('Error', "error while trying to connect MongoDB: ", err);
        }

        var collection = db.collection('tasks');
        collection.count({ 'to._id': ObjectID(userId), 'status': 'inProgress' }, function (err, result) {

            if (err) {
                winston.log('Error', "error while trying to get UnDone Tasks Count: ", err);
            }

            db.close();
            callback(err, result);
        });
    });
};

