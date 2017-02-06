(function (socketIO) {

//var io = require('socket.io').listen(server);

/*var users = [];
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
*/
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
    
})(module.exports);