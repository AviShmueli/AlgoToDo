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
var mongoUrl = 'mongodb://admin:avi3011algo@ds127059-a0.mlab.com:27059/algotodo_db_01';
//var mongoUrl = 'mongodb://admin:avi3011algo@ds033996.mlab.com:33996/algotodo_db_01';
//var mongoUrl = 'mongodb://localhost:27017/TaskManeger';
var winston = require('./logger');
var BL = require('./BL');

var app = express();

var http = require('http');

var server = http.createServer(app);


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

/* ----- cron  ------ */
var jobs = require('./cron-jobs');

//jobs.job1('1');

/* ---- Start the server ------ */
server.listen(process.env.PORT || 5001, function (err) {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

app.post('/TaskManeger/newTask', function (req, res) {

    BL.addNewTasks(req.body.task).then(function(result){
        res.send(result);
    }, function(error){
        winston.log('error', error.message , error.error);
        res.status(500).send(error); 
    });

});

app.post('/TaskManeger/newComment', function (req, res) {

    var taskId = req.body.taskId;
    var comment = req.body.comment;

    BL.addNewComment(taskId, comment).then(function(result){
        res.send('ok');
    }, function(error){
        winston.log('error', error.message , error.error);
        res.status(500).send(error); 
    });
});

app.post('/TaskManeger/AddNewComments', function (req, res) {
    
    BL.addNewComments(req.body.comments).then(function(result){
        res.send('ok');
    }, function(error){
        winston.log('error', error.message , error.error);
        res.status(500).send(error); 
    });

});

app.post('/TaskManeger/updateTaskStatus', function (req, res) {

    BL.updateTaskStatus(req.body.task).then(function(result) {
        res.send('ok');   
    }, function(error) {
        winston.log('error', error.message , error.error);
        res.status(500).send(error); 
    });
});

app.post('/TaskManeger/updateTasksStatus', function (req, res) {

    BL.updateTasksStatus(req.body.tasks).then(function() {
        res.send('ok');
    }, function(error) {
        winston.log('error', error.message , error.error);
        res.status(500).send(error); 
    });

});

app.post('/TaskManeger/updateUserDetails', function (req, res) {

    var userId = req.body.userId;
    var fieldToUpdate = req.body.fieldToUpdate;
    var valueToUpdate = req.body.valueToUpdate;

    BL.updateUserDetails(userId, fieldToUpdate, valueToUpdate).then(function(result) {
        res.send(result);  
    }, function(error) {
        winston.log('error', error.message , error.error);
        res.status(500).send(error); 
    });

});

app.post('/TaskManeger/registerUser', function (req, res) {
    
    BL.registerUser(req.body.user).then(function(result) {
        res.send(result);   
    }, function(error) {
        winston.log('error', error.message , error.error);
        res.status(500).send(error); 
    });

});

app.get('/TaskManeger/isUserExist', function (req, res) {

    BL.checkIfUserExist(req.query.userPhone).then(function(result) {
        res.send(result); 
    }, function(error) {
        winston.log('error', error.message , error.error);
        res.status(500).send(error); 
    });

});

app.get('/TaskManeger/getTasks', function (req, res) {
    
    var userId = req.query.userId;

    BL.getAllUserTasks(req.query.userId).then(function(result) {
        res.send(result);   
    }, function(error) {
        winston.log('error', error.message , error.error);
        res.status(500).send(error); 
    });

});

app.get('/TaskManeger/searchUsers', function (req, res) {

    var string = req.query.queryString;
    var cliqaId = req.query.userCliqaId;
    
    BL.searchUsers(string, cliqaId).then(function(result) {
        res.send(result);   
    }, function(error) {
        winston.log('error', error.message , error.error);
        res.status(500).send(error); 
    });
    
});

app.get('/TaskManeger/getAllCliqot', function (req, res) {

    BL.getAllCliqot().then(function(result) {
        res.send(result);   
    }, function(error) {
        winston.log('error', error.message , error.error);
        res.status(500).send(error); 
    });

});

app.get('/TaskManeger/getAllTasks', function (req, res) {

    BL.getAllTasks(req.query).then(function(result) {
        res.send(result);   
    }, function(error) {
        winston.log('error', error.message , error.error);
        res.status(500).send(error); 
    });

});

app.get('/TaskManeger/getAllTasksCount', function (req, res) {

    var filter = JSON.parse(req.query.filter);

    BL.getAllTasksCount(filter).then(function(result) {
        res.send(result.toString()); 
    }, function(error) {
        winston.log('error', error.message , error.error);
        res.status(500).send(error); 
    });

});

app.get('/TaskManeger/getAllUsers', function (req, res) {

    BL.getAllUsers(req.query).then(function(result) {
        res.send(result);   
    }, function(error) {
        winston.log('error', error.message , error.error);
        res.status(500).send(error); 
    });
});

app.get('/TaskManeger/getAllUsersCount', function (req, res) {

    var filter = JSON.parse(req.query.filter);

    BL.getAllUsersCount(filter).then(function(result) {
        res.send(result.toString());   
    }, function(error) {
        winston.log('error', error.message , error.error);
        res.status(500).send(error); 
    });

});

app.get('/TaskManeger/getAllVersionInstalled', function (req, res) {
    
    BL.getAllVersionInstalled().then(function(result) {
        res.send(result);   
    }, function(error) {
        winston.log('error', error.message , error.error);
        res.status(500).send(error); 
    });
});

app.get('/TaskManeger/checkIfVerificationCodeMatch', function (req, res) {

    var verificationCode = req.query.verificationCode;
    var userId = req.query.userId;

    BL.checkIfVerificationCodeMatch(userId, verificationCode).then(function(result) {
        res.send(result);   
    }, function(error) {
        winston.log('error', error.message , error.error);
        res.status(500).send(error); 
    });

});