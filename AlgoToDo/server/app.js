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
            collection.find({ employee: userName }).limit(200).toArray(function (err, result) {
                socket.emit('users-tasks', result);
                db.close();
            });
            console.log('user asks for all tasks');
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
        var task = data.task;
        var reciver = data.to;

        console.log(task);
        console.log(reciver);

        //add task to Mongo
        var newTask = task;
        mongodb.connect(mongoUrl, function (err, db) {
            var collection = db.collection('tasks');

            collection.insert(task,
                function (err, results) {
                    console.log(results.ops[0]);
                    // send the new task to the employee
                    socket.broadcast.to(reciver).emit('new-task', results.ops[0]);
                });
        });

        // if we whant to brodcast the message to all users
        // socket.broadcast.emit('task-received', data);
    });

});

// -------- DAL ------------- //

app.post('/TaskManeger/newTask', function (req, res) {

    mongodb.connect(mongoUrl, function (err, db) {
        var collection = db.collection('tasks');
        var user = req.body.task;

        console.log(req.body);

        collection.insert(user,
            function (err, results) {
                console.log(results.ops[0]);
                res.send(results.ops[0]);
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