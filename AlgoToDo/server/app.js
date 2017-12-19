/*jshint esversion: 6 */

/*
 *
 * NOTE: in order to install new packeges,
 *       the "npm install" command shold run from
 *       algotodo main solution folder and not from the algotodo project folder!!!
 *
 */

var express = require('express');
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

// *********
// IMPORTANT: uncomment this if deploy to production!!!
// *********
/*setTimeout(function(){
    jobs.startAllJobs();
    console.log("*** start all cron jobs! ***");
},0);*/



// /* ---- Start the server ------ */
server.listen(process.env.PORT || 5001, function (err) {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

app.post('/TaskManeger/newTask', function (req, res) {

    BL.addNewTasks(req.body.task, false).then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.sendStatus(500).send(error);
    });

});

app.post('/TaskManeger/newComment', function (req, res) {

    var taskId = req.body.taskId;
    var comment = req.body.comment;

    BL.addNewComment(taskId, comment).then(function (result) {
        res.send('ok');
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });
});

app.post('/TaskManeger/AddNewComments', function (req, res) {

    BL.addNewComments(req.body.comments).then(function (result) {
        res.send('ok');
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.post('/TaskManeger/updateTaskStatus', function (req, res) {

    BL.updateTaskStatus(req.body.task).then(function (result) {
        res.send('ok');
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });
});

app.post('/TaskManeger/updateTasksStatus', function (req, res) {

    BL.updateTasksStatus(req.body.tasks).then(function () {

        res.send('ok');
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.post('/TaskManeger/updateUserDetails', function (req, res) {

    var userId = req.body.userId;
    var fieldToUpdate = req.body.fieldToUpdate;
    var valueToUpdate = req.body.valueToUpdate;

    BL.updateUserDetails(userId, fieldToUpdate, valueToUpdate).then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.post('/TaskManeger/registerUser', function (req, res) {

    BL.registerUser(req.body.user).then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.get('/TaskManeger/isUserExist', function (req, res) {

    BL.checkIfUserExist(req.query.userPhone).then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.get('/TaskManeger/getTasks', function (req, res) {

    BL.getAllUserTasks(req.query.userId, req.query.lastServerSync).then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.get('/TaskManeger/getTasksInProgress', function (req, res) {

    BL.getTasksInProgress(req.query.userId, req.query.lastServerSync).then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.get('/TaskManeger/getDoneTasks', function (req, res) {
    var userId = req.query.userId;
    var page = req.query.page || 0;
    var lastServerSync = req.query.lastServerSync;

    BL.getDoneTasks(userId, page, lastServerSync).then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.get('/TaskManeger/searchUsers', function (req, res) {

    var string = req.query.queryString;
    var cliqaId = req.query.userCliqaId;

    BL.searchUsers(string, cliqaId).then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.get('/TaskManeger/getAllCliqot', function (req, res) {

    BL.getAllCliqot().then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.get('/TaskManeger/getAllTasks', function (req, res) {

    BL.getAllTasks(req.query).then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.get('/TaskManeger/getAllTasksCount', function (req, res) {

    var filter = JSON.parse(req.query.filter);

    BL.getAllTasksCount(filter).then(function (result) {
        res.send(result.toString());
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.get('/TaskManeger/getAllUsers', function (req, res) {

    BL.getAllUsers(req.query).then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });
});

app.get('/TaskManeger/getAllUsersCount', function (req, res) {

    var filter = JSON.parse(req.query.filter);

    BL.getAllUsersCount(filter).then(function (result) {
        res.send(result.toString());
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.get('/TaskManeger/getAllVersionInstalled', function (req, res) {

    BL.getAllVersionInstalled().then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });
});

app.get('/TaskManeger/checkIfVerificationCodeMatch', function (req, res) {

    var verificationCode = req.query.verificationCode;
    var userId = req.query.userId;

    BL.checkIfVerificationCodeMatch(userId, verificationCode).then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.post('/TaskManeger/addNewRepeatsTasks', function (req, res) {

    BL.addNewRepeatsTasks(req.body.tasks).then(function (result) {
        jobs.startRepeatsTasks(result);
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.post('/TaskManeger/updateRepeatsTasks', function (req, res) {

    BL.updateRepeatsTasks(req.body.tasks).then(function (result) {
        jobs.startRepeatsTasks(req.body.tasks);
        res.send('ok');
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.post('/TaskManeger/deleteRepeatsTasks', function (req, res) {

    BL.deleteRepeatsTasks(req.body.tasks).then(function (result) {
        jobs.stopRepeatsTasks(result);
        res.send('ok');
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.get('/TaskManeger/getUsersRepeatsTasks', function (req, res) {

    BL.getUsersRepeatsTasks(req.query.userId).then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.post('/TaskManeger/createNewCliqa', function (req, res) {

    BL.createNewCliqa(req.body.cliqaName).then(function (result) {
        res.send('ok');
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.post('/TaskManeger/reSendVerificationCodeToUser', function (req, res) {

    BL.reSendVerificationCodeToUser(req.body.userId, req.body.admin).then(function (result) {
        res.send('ok');
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.post('/TaskManeger/sendBroadcastUpdateAlert', function (req, res) {

    BL.sendBroadcastUpdateAlert(req.body.paltform, req.body.version).then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.post('/TaskManeger/sendReminderForTasks', function (req, res) {

    BL.sendReminderForTasks(req.body.tasks).then(function (result) {
        res.send('ok');
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.post('/TaskManeger/getUsersByPhoneNumbers', function (req, res) {

    BL.getUsersByPhoneNumbers(req.body.phoneNumbers).then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.post('/TaskManeger/addNewGroup', function (req, res) {

    BL.addNewGroup(req.body.group).then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.post('/TaskManeger/deleteGroups', function (req, res) {

    BL.deleteGroups(req.body.groupIds).then(function (result) {
        res.send('ok');
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.get('/TaskManeger/getUsersInCliqa', function (req, res) {

    BL.getUsersInCliqa(req.query.cliqaId).then(function (result) {
        res.send(result);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.post('/TaskManeger/addUsersToCliqa', function (req, res) {

    BL.addUsersToCliqa(req.body.cliqa, req.body.users).then(function () {
        res.send('ok');
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});

app.get('/TaskManeger/generateReport', function (req, res) {
    
    BL.generateReport(req.query, io, io_m).then(function (excelFile) {
        excelFile.write('MyExcel.xlsx', res);
    }, function (error) {
        winston.log('error', error.message, error.error);
        res.status(500).send(error);
    });

});



app.post('/TaskManeger/testPushRegistration', function (req, res) {
    
        BL.testPushRegistration(req.body.users).then(function (response) {
            res.send(response);
        }, function (error) {
            winston.log('error', error.message, error.error);
            res.status(500).send(error);
        });
    
    });




// ----- socket.io ------ //
var io_m = require('./socket.io');
var io = io_m.listen(server);
