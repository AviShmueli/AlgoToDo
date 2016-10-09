/*jshint esversion: 6 */

var express = require('express');
var path = require('path');
var mongodb = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var mongoUrl = 'mongodb://admin:avi3011algo@ds033996.mlab.com:33996/algotodo_db_01';
var bodyParser = require('body-parser');
var app = express();


var http = require('http');

var server = http.createServer(app);

var io = require('socket.io').listen(server);



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

server.listen(process.env.PORT || 5002, function (err) {
    console.log('avi: running server on port ' + port);
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

// -------- Socket.io --------//
var users = [];
io.on('connection', function (socket) {
    console.log('new connection made');

    //send to the client all the users when Login
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

    // response to the client call for Login and join the chat
    socket.on('join', function (data) {
        socket.userName = data.userName;
        users[socket.userName] = socket;
        var userObj = {
            userName: data.userName,
            socketid: socket.id
        };
        users.push(userObj);
        console.log(userObj.userName + ' just connected!!');
        io.emit('all-users', users);
    });

    //get the new task and save it to MongoClient
    //then send message to the emploee with the task
    socket.on('create-task', function (data) {
        /* ---- curently not in use becuse cano't emit to both the "to" and the "from" clients -------- */
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
        /* ---- curently not in use becuse cano't emit to both the "to" and the "from" clients -------- */
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

});

// -------- DAL ------------- //

app.post('/TaskManeger/newTask', function (req, res) {

    var task = req.body.task;
    var to = '';
    if (users[task.to] !== undefined) {
        to = users[task.to].id;
    }
    //add task to Mongo
    mongodb.connect(mongoUrl, function (err, db) {
        var collection = db.collection('tasks');

        collection.insert(task,
            function (err, results) {

                // send the new task to the employee and return it to the maneger
                if (to !== '') {
                    io.to(to).emit('new-task', results.ops[0]);
                }

                res.send(results.ops[0]);
                db.close();
            });
    });
});

app.post('/TaskManeger/updateTaskStatus', function (req, res) {

    var task = req.body.task;
    var from = '';
    if (users[task.from] !== undefined) {
        from = users[task.from].id;
    }

    //add task to Mongo
    mongodb.connect(mongoUrl, function (err, db) {
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

app.get('/TaskManeger/getTasks', function (req, res) {

    mongodb.connect(mongoUrl, function (err, db) {

        var collection = db.collection('tasks');
        collection.find({}).limit(200).toArray(function (err, result) {
            res.send(result);
            db.close();
        });
        console.log('user asks for all tasks');
    });
});