(function () {
    'use strict';

    angular
        .module('app.tasks')
        .controller('taskCtrl', taskCtrl);

    taskCtrl.$inject = [
        '$rootScope', '$scope', 'logger', '$q',
         'datacontext', '$routeParams', '$window', 'moment',
         'socket', 'cordovaPlugins', 'dropbox', 'appConfig'
    ];

    function taskCtrl($rootScope, $scope, logger, $q,
                      datacontext, $routeParams, $window, moment,
                      socket, cordovaPlugins, dropbox, appConfig) {

        var vm = this;

        vm.taskId = $routeParams.taskId;
        var a = window.location;
        vm.task = datacontext.getTaskByTaskId(vm.taskId);
        vm.user = datacontext.getUserFromLocalStorage();
        vm.imagesPath = cordovaPlugins.getImagesPath();
        vm.taskIsToMe = (vm.task.to._id === vm.user._id);
        vm.taskIsFromMe = (vm.task.from._id === vm.user._id);
        angular.element(document.querySelectorAll('html')).removeClass("hight-auto");
        vm.newCommentText = '';

        if (vm.task.comments === undefined) {
            vm.task.comments = [];
        }

        // login 
        /*socket.emit('join', {
            userId: vm.user._id
        });*/

        vm.goBack = function () {
            $window.history.back();
        }

        vm.openMenu = function ($mdOpenMenu, ev) {
            $mdOpenMenu(ev);
        };
        //dropbox.downloadFile();

        vm.takePic = function () {

            document.addEventListener("deviceready", function () {
                cordovaPlugins.takePicture().then(function (imageData) {

                    var fileName = new Date().toISOString() + '.jpg';

                    //datacontext.saveFileToCache(fileName, imageData);

                    var comment = {
                        from: {
                            name: vm.user.name,
                            _id: vm.user._id,
                            avatarUrl: vm.user.avatarUrl
                        },
                        createTime: new Date(),
                        text: '',
                        imageUrl: fileName
                    };
                    vm.task.comments.push(comment);

                    // convert the base 64 image to blob
                    var blob = b64toBlob(imageData, 'image/jpg');
                    var blobUrl = URL.createObjectURL(blob);

                    var reader = new FileReader();

                    // Closure to capture the file information.
                    reader.onload = (function (file) {

                        //upload file To Dropbox;
                        dropbox.uploadFile(fileName, file).then(function (response) {

                            // get the image Thumbnail
                            dropbox.getThumbnail(fileName, 'w128h128').then(function (response) {
                                comment.fileThumbnail = URL.createObjectURL(response.fileBlob);
                                // after uploading the file send the new comment
                                datacontext.newComment(vm.task._id, comment);                                
                            })
                            .catch(function (error) {
                                logger.error("error while trying to get file Thumbnail", error);
                            });                         
                        })
                        .catch(function (error) {
                            logger.error("error while trying to upload file to dropbox", error);
                        });
                    })(blob);

                }, function (err) {
                    logger.error("error while trying to take a picture", err);
                });
            }, false);
        }

        function b64toBlob(b64Data, contentType, sliceSize) {
            contentType = contentType || '';
            sliceSize = sliceSize || 512;

            var byteCharacters = atob(b64Data);
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);

                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                var byteArray = new Uint8Array(byteNumbers);

                byteArrays.push(byteArray);
            }

            var blob = new Blob(byteArrays, { type: contentType });
            return blob;
        }

        vm.addComment = function () {
            if (vm.task.comments === undefined) {
                vm.task.comments = [];
            }
            var comment = {
                from: {
                    name: vm.user.name,
                    _id: vm.user._id,
                    avatarUrl: vm.user.avatarUrl
                },
                createTime: new Date(),
                text: vm.newCommentText
            };
            vm.task.comments.push(comment);
            datacontext.newComment(vm.task._id, comment);
            vm.newCommentText = '';
        }

        vm.setTaskStatus = function (task, newStatus) {
            task.status = newStatus;
            if (task.status === 'done') {
                task.doneTime = new Date();
            }
            if (task.status === 'seen') {
                task.seenTime = new Date();
            }

            datacontext.updateTask(task).then(function (response) {
                logger.success('המשימה עודכנה בהצלחה!', response.data);
                vm.goBack();
            }, function (error) {
                logger.error('Error while tring to update task ', error);
            });
        };

        vm.getImageSrc = function (imageUrl, comment) {
            var src = datacontext.getFileFromCache(imageUrl);
            if (src !== undefined) {
                return "data:image/jpeg;base64," + src;
            }
            else {
                if (cordovaPlugins.isMobileDevice()) {
                    return comment.fileThumbnail;
                }
                else {
                    // get the image Thumbnail
                    dropbox.getThumbnail(imageUrl, 'w128h128').then(function (response) {
                        comment.fileThumbnail = URL.createObjectURL(response.fileBlob);
                    })
                    .catch(function (error) {
                        logger.error("error while trying to get file Thumbnail", error);
                    });
                    return comment.fileThumbnail;                 
                }
            }
        }
                       
    }

})();