﻿(function () {
    'use strict';

    angular
        .module('app.tasks')
        .controller('taskCtrl', taskCtrl);

    taskCtrl.$inject = [
        '$rootScope', '$scope', 'logger', '$q', 'storage',
         'datacontext', '$routeParams', '$window', 'moment',
         'socket', 'cordovaPlugins', 'dropbox', 'appConfig'
    ];

    function taskCtrl($rootScope, $scope, logger, $q, storage,
                      datacontext, $routeParams, $window, moment,
                      socket, cordovaPlugins, dropbox, appConfig) {

        var vm = this;

        vm.taskId = $routeParams.taskId.split('&')[0];
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
            window.location = '#/';
        }

        vm.openMenu = function ($mdOpenMenu, ev) {
            $mdOpenMenu(ev);
        };

        vm.takePic = function (sourceType) {

            document.addEventListener("deviceready", function () {
                cordovaPlugins.takePicture(sourceType).then(function (fileUrl) {

                    window.resolveLocalFileSystemURL(fileUrl, function success(fileEntry) {

                        var fileName = new Date().toISOString() + '.jpg';
                        //var dataDirectory = (cordova.platformId.toLowerCase() === 'ios') ? cordova.file.dataDirectory : cordova.file.externalDataDirectory;
                        //var newPath = 'pictures/' + vm.taskId + '/';

                        var comment = {
                            from: {
                                name: vm.user.name,
                                _id: vm.user._id,
                                avatarUrl: vm.user.avatarUrl
                            },
                            createTime: new Date(),
                            text: '',
                            fileName: fileName
                        };

                        storage.saveFileToStorage(vm.taskId, fileName, fileEntry.nativeURL).then(function (newFileUrl) {
                            var tempComment = angular.copy(comment);
                            comment.fileLocalPath = newFileUrl;
                            vm.task.comments.push(comment);
                            addImageToGallery(comment.fileName, comment.fileLocalPath);

                            dropbox.uploadNewImageToDropbox(fileEntry.filesystem.root.nativeURL, fileEntry.name, fileName).then(function () {
                                datacontext.newComment(vm.task._id, tempComment);
                            });
                            cordovaPlugins.cleanupAfterPictureTaken();
                        }, function (error) {
                            logger.error("error while trying to save File to Storage", error);
                        });
                    });                                      
                }, function (err) {
                    logger.error("error while trying to take a picture", err);
                });
            }, false);
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
                datacontext.removeAllTaskImagesFromCache(task);
                cordovaPlugins.cancelNotification(task._id);
            }
            if (task.status === 'seen') {
                task.seenTime = new Date();
            }

            datacontext.updateTask(task).then(function (response) {
                logger.success('המשימה עודכנה בהצלחה!', response.data);
                
            }, function (error) {
                logger.error('Error while tring to update task ', error);
            });

            vm.goBack();
        };

        vm.galleryImages = [];
        vm.galleryImagesLocations = {};
        vm.galleryImagesCounter = 0;

        var setFileLocalPath = function (comment) {
            if (!cordovaPlugins.isMobileDevice()) {
                comment.fileLocalPath = cordovaPlugins.getImagesPath() + "/images/upload-empty.png";
                return;
            }
            if (comment.fileLocalPath.indexOf("upload-empty") === -1) {
                // if this is file you uploaded - the file will be in the cache
                var dataDirectory = (cordova.platformId.toLowerCase() === 'ios') ? cordova.file.dataDirectory : cordova.file.externalDataDirectory;
                var newPath = 'pictures/' + vm.taskId + '/';
                var src = dataDirectory + newPath + comment.fileName;
                comment.fileLocalPath = src;
                addImageToGallery(comment.fileName, src);
            }
            //else {
                /*dropbox.getThumbnail(comment.fileName, 'w128h128')
                    .then(function (response) {
                         var url = URL.createObjectURL(response.fileBlob);
                         comment.fileLocalPath = url;
                         datacontext.saveFileToCache(comment.fileName, url);
                    })
                    .catch(function (error) {
                        logger.error("error while trying to get file Thumbnail", error);
                    });
                dropbox.downloadFile(comment.fileName).then(function (response) {
                        console.log(response);
                        dropbox.getSharedLinkFile(response.url)
                             .then(function (response) {
                                   console.log(response);
                                   var downloadUrl = URL.createObjectURL(response.fileBlob);
                                   comment.fileLocalPath = downloadUrl;
                                   datacontext.saveFileToCache(comment.fileName, downloadUrl);                                   
                              })
                             .catch(function (error) {
                                    logger.error("error while trying to download file from dropbox", error);
                              });
                        })
                    .catch(function (error) {
                        console.error(error);
                    });
                    */
            //}
        }

        var addImageToGallery = function (fileName, fileLocalPath) {           
            var img = new Image();
            img.onload = function () { 
                vm.galleryImages.push({
                    src: fileLocalPath,
                    w: this.width,
                    h: this.height
                });
                vm.galleryImagesLocations[fileName] = vm.galleryImagesCounter++;
            }
            img.src = fileLocalPath;
        }

        var addImageToGallery_Sync = function (fileName, fileLocalPath) {
            var deferred = $q.defer();

            var img = new Image();
            img.onload = function () {
                vm.galleryImages.push({
                    src: fileLocalPath,
                    w: this.width,
                    h: this.height
                });
                vm.galleryImagesLocations[fileName] = vm.galleryImagesCounter++;
                deferred.resolve();
            }
            img.src = fileLocalPath;
            return deferred.promise;
        }
 
        var setImagesLocalPath = function(){
            for(var i = 0; i < vm.task.comments.length; i++){
                if(vm.task.comments[i].fileName !== undefined){
                    setFileLocalPath(vm.task.comments[i]);
                }
            }
        }();
        
        var gallery;

        vm.showGalary = function (comment) {

            var pswpElement = document.querySelectorAll('.pswp')[0];

            /*vm.galleryImages = [
                {
                    src: 'https://photos-1.dropbox.com/t/2/AAC43kVSA1R6MAoqXYgWFmon8pQwLtBVmEYGvO5wUw571w/12/579965904/jpeg/32x32/1/_/1/2/2016-12-11T21%3A23%3A02.851Z.jpg/EJisz4wFGIQBIAcoBw/S3PGdSH1wBffOyyUAzWxN_YkkIgQo78iiZCDJycE6dk?size=1600x1200&size_mode=3',
                    w: 600,
                    h: 400
                },
                {
                    src: 'https://photos-6.dropbox.com/t/2/AAA8rFSk8vNeHrinwCcR3Ol606AGV2uHCu1_KI15F4tsPw/12/579965904/jpeg/32x32/1/_/1/2/avi.jpg/EJisz4wFGEsgBygH/HbMSs18ptds-T-3U_RxSoO1V9hQiAgTbcpTVvPtuqvA?size=1600x1200&size_mode=3',
                    w: 600,
                    h: 400
                }
            ];*/

            var options = {
                index: vm.galleryImagesLocations[comment.fileName] || 0, // start at first slide // 
                closeOnScroll: false,
                closeOnVerticalDrag: false,
                history: false
            };

            // Initializes and opens PhotoSwipe
            gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, /*items*/vm.galleryImages, options);

            if (vm.galleryImagesLocations[comment.fileName] === undefined) {
                addImageToGallery_Sync(comment.fileName, comment.fileLocalPath).then(function () {
                    gallery.options.index = vm.galleryImagesLocations[comment.fileName];
                    gallery.init();
                });
            }
            else {
                gallery.init();
            }

            document.addEventListener("backbutton", backbuttonClickCallback, false);

            gallery.listen('close', function () {
                document.removeEventListener("backbutton", backbuttonClickCallback, false);
            });
        }

        var backbuttonClickCallback = function () {
            gallery.close();
            document.removeEventListener("backbutton", backbuttonClickCallback, false);
        }

        vm.shareImage = function () {
            // e - original click event
            // target - link that was clicked

            // If `target` has `href` attribute and 
            // does not have `download` attribute - 
            // share modal window will popup
            var a = 'target';
        }

        vm.addAlert = function () {
            cordovaPlugins.showDatePicker().then(function (date) {
                vm.task.notificationId = Math.floor((Math.random() * 10000) + 1);
                cordovaPlugins.setLocalNotification(vm.task, date);
            });         
        }
        
        /*dropbox.getThumbnail(, 'w128h128')
                        .then(function (response) {
                            var url = URL.createObjectURL(response.fileBlob);
                            //dataFromServer.object.fileLocalPath = url;

                            storage.saveFileToStorage('2016-12-11T21:23:02.851Z.jpg', response);
                            //datacontext.saveFileToCache(dataFromServer.object.fileName, url);
                            //datacontext.addCommentToTask(dataFromServer.taskId, dataFromServer.object);
                        })
                        .catch(function (error) {
                            logger.error("error while trying to get file Thumbnail", error);
                        });*/

    }

})();
