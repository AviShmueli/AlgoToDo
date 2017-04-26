(function () {
    'use strict';

    angular
        .module('app.tasks')
        .controller('taskCtrl', taskCtrl);

    taskCtrl.$inject = ['$rootScope', '$scope', 'logger', '$q', 'storage',
         'datacontext', '$routeParams', '$window', 'moment',
         'socket', 'cordovaPlugins', 'dropbox', 'appConfig',
         'localNotifications', 'camera', 'device', '$mdDialog',
         'DAL', '$offlineHandler', '$location', '$timeout',
         'pushNotifications', '$toast'
    ];

    function taskCtrl($rootScope, $scope, logger, $q, storage,
                      datacontext, $routeParams, $window, moment,
                      socket, cordovaPlugins, dropbox, appConfig,
                      localNotifications, camera, device, $mdDialog,
                      DAL, $offlineHandler, $location, $timeout,
                      pushNotifications, $toast) {

        var vm = this;

        vm.taskId = $routeParams.taskId.split('&')[0];
        vm.task = datacontext.getTaskByTaskId(vm.taskId);
        vm.user = datacontext.getUserFromLocalStorage();
        vm.imagesPath = device.getImagesPath();
        vm.taskIsToMe = (vm.task.to._id === vm.user._id);
        vm.taskIsFromMe = (vm.task.from._id === vm.user._id);

        if (vm.task.unSeenResponses > 0) {
            if (device.isMobileDevice()) {           
                $timeout(function () {
                    pushNotifications.clearAllNotifications();
                }, 0);
            }
            $rootScope.newCommentsInTasksInProcessCount =
                $rootScope.newCommentsInTasksInProcessCount !== undefined ?
                $rootScope.newCommentsInTasksInProcessCount - vm.task.unSeenResponses :
                0;
        }
        vm.task.unSeenResponses = 0;

        vm.isIosdDevice = false;
        if (device.isMobileDevice()) {
            vm.isIosdDevice = cordova.platformId === 'ios';
        }

        if (vm.task.comments === undefined) {
            vm.task.comments = [];
        }

        angular.element(document.querySelectorAll('html')).removeClass("hight-auto");

        vm.newCommentText = '';

        vm.goBack = function () {
            window.history.back();
            //$location.path('/tasksList');
        };

        vm.takePic = function (sourceType) {

            document.addEventListener("deviceready", function () {
                camera.takePicture(sourceType).then(function (fileUrl) {

                    window.resolveLocalFileSystemURL(fileUrl, function success(fileEntry) {

                        var fileName = new Date().toISOString().replace(/:/g, "_") + '.jpg';

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
                            datacontext.replaceUsersWithPhoneContact([comment]);
                            vm.task.comments.push(comment);
                            addImageToGallery(comment.fileName, comment.fileLocalPath);

                            //if (vm.task.from._id !== vm.task.to._id) {
                                dropbox.uploadNewImageToDropbox(fileEntry.filesystem.root.nativeURL, fileEntry.name, fileName).then(function () {
                                    DAL.newComment(vm.task._id, tempComment);
                                    camera.cleanupAfterPictureTaken();
                                });
                           // }
                            //else {
                            //    DAL.newComment(vm.task._id, tempComment);
                            //}

                        }, function (error) {
                            logger.error("error while trying to save File to Storage", error);
                        });
                    });
                }, function (err) {
                    if (err.indexOf("Selection cancelled") === -1) {
                        logger.error("error while trying to take a picture", err);
                    }
                });

                device.setStatusbarOverlays();
            }, false);
        };

        vm.addComment = function () {
            if (vm.newCommentText === '') {
                return;
            }
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
            var localCopyOfComment = angular.copy(comment);
            datacontext.replaceUsersWithPhoneContact([localCopyOfComment]);
            vm.task.comments.push(localCopyOfComment);

            var userIdToNotify = '';
            if (vm.task.to._id !== vm.task.from._id) {
                if (vm.task.from._id === comment.from._id) {
                    userIdToNotify = vm.task.to._id;
                }
                else {
                    userIdToNotify = vm.task.from._id;
                }
            }

            DAL.newComment(vm.task._id, comment).then(function () { },
                function (error) {
                    if (error.status === -1) {
                        error.data = "App lost connection to the server";
                    }
                    logger.error('Error while trying to add new comment: ', error.data || error);
                    comment.offlineMode = true;
                    localCopyOfComment.offlineMode = true;
                    if (vm.task._id.indexOf('tempId') === -1) {
                        $offlineHandler.addCommentToCachedNewCommentsList(vm.task._id, comment, userIdToNotify);
                    }
                });
            vm.newCommentText = '';
            vm.btnState = 'mic';
        };

        vm.setTaskStatus = function (task, newStatus) {
            task.status = newStatus;
            if (task.status === 'done') {
                task.doneTime = new Date();
                //datacontext.removeAllTaskImagesFromCache(task);
                //localNotifications.cancelNotification(task._id);
                $toast.showActionToast("המשימה סומנה כבוצע", "בטל", 2000).then(function (response) {
                    if (response == 'ok') {
                        task.doneTime = null;
                        if (task.offlineMode === true) {
                            $offlineHandler.removeTaskFromCachedTasksToUpdateList(task);
                        }
                        vm.setTaskStatus(task, 'inProgress');
                    }
                });
            }
            if (task.status === 'seen') {
                task.seenTime = new Date();
            }

            $timeout(function () {
                var count = datacontext.setMyTaskCount();
                cordovaPlugins.setBadge(count);
            }, 0);

            DAL.updateTask(task).then(function (response) {

            }, function (error) {
                if (error.status === -1) {
                    error.data = "App lost connection to the server";
                }
                logger.error('Error while trying to update task: ', error.data || error);
                task.offlineMode = true;
                $offlineHandler.addTaskToCachedTasksToUpdateList(task);
            });

            vm.goBack();
        };

        vm.galleryImages = [];
        vm.galleryImagesLocations = {};
        vm.galleryImagesCounter = 0;
        vm.showProgress = true;

        var setFileLocalPath = function (comment) {
            if (!device.isMobileDevice() && comment.fileLocalPath === undefined) {
                comment.fileLocalPath = device.getImagesPath() + "/images/upload-empty.png";
                vm.showProgress = true;
            }

            if (comment.fileLocalPath !== undefined && (comment.fileLocalPath.indexOf("upload-empty") !== -1 || comment.fileLocalPath.indexOf(comment.fileName) === -1)) {
                downloadFileFromDropbox(comment);
            }

            if (comment.fileLocalPath === undefined) { // && 
                // if this is file you uploaded - the file will be in the cache
                var dataDirectory = storage.getRootDirectory();
                var newPath = 'Asiti/Asiti Images/' + vm.taskId + '/';
                var src = dataDirectory + newPath + comment.fileName;

                storage.checkIfFileExists(dataDirectory + newPath, comment.fileName).then(function (success) {
                    comment.fileLocalPath = src;
                    addImageToGallery(comment.fileName, src);
                }, function (error) {
                    comment.fileLocalPath = device.getImagesPath() + "/images/upload-empty.png";
                    downloadFileFromDropbox(comment);
                });
            }
        };

        self.downloadTryCount = 0;

        var downloadFileFromDropbox = function (comment) {
            dropbox.getThumbnail(comment.fileName, 'w128h128')
            .then(function (response) {
                var url = URL.createObjectURL(response.fileBlob);
                if (comment.fileLocalPath.indexOf("upload-empty") !== -1) {
                    comment.fileLocalPath = url;
                }
                comment.errorDownloadFile = false;
            })
            .catch(function (error) {
                logger.error("error while trying to get file Thumbnail", error);
                vm.showProgress = false;
                comment.errorDownloadFile = true;
            });

            self.downloadTryCount++;

            dropbox.downloadFile(comment.fileName)
            .then(function (response) {
                if (!device.isMobileDevice()) {
                    comment.errorDownloadFile = false;
                    var uri = response.url.replace("?dl=0", "?dl=1");
                    comment.fileLocalPath = uri;
                    $timeout(function () {
                        addImageToGallery(comment.fileName, uri);
                    }, 0);
                }
                else {
                    storage.saveFileToStorage(vm.task._id, comment.fileName, response.url).then(function (storageFilePath) {
                        comment.errorDownloadFile = false;
                        comment.fileLocalPath = storageFilePath;
                        $timeout(function () {
                            addImageToGallery(comment.fileName, storageFilePath);
                        }, 0);

                        //dropbox.deleteFile(comment.fileName);
                    });
                }
            })
            .catch(function (error) {               
                if (error.error.toString().indexOf('path/not_found/') !== -1 && self.downloadTryCount < 4) {
                    downloadFileFromDropbox(comment)
                }
                else {
                    logger.error("error while trying to download file from dropbox", error);
                    vm.showProgress = false;
                    comment.errorDownloadFile = true;
                }
            });
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
            };
            img.src = fileLocalPath;
        };

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
            };
            img.src = fileLocalPath;
            return deferred.promise;
        };

        var setImagesLocalPath = function () {
            for (var i = 0; i < vm.task.comments.length; i++) {
                if (vm.task.comments[i].fileName !== undefined) {
                    setFileLocalPath(vm.task.comments[i]);
                }
            }
        };

        $timeout(function () {
            setImagesLocalPath();
        }, 200);

        var gallery;

        vm.showGalary = function (comment) {
            
            var pswpElement = document.querySelectorAll('.pswp')[0];

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
        };

        var backbuttonClickCallback = function () {
            gallery.close();
            document.removeEventListener("backbutton", backbuttonClickCallback, false);
        };

        vm.shareImage = function () {
            // e - original click event
            // target - link that was clicked

            // If `target` has `href` attribute and 
            // does not have `download` attribute - 
            // share modal window will popup
            var a = 'target';
        };

        vm.addAlert = function (ev) {

            $mdDialog.show({
                controller: dateTimePickerCtrl,
                templateUrl: 'scripts/widgets/dateTimePicker.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true
            })
            .then(function (answer) {
                var date = new Date();
                switch (answer) {
                    case "15m":
                        setLocalNotification(date.setTime(date.getTime() + 15 * 60000));
                        break;
                    case "30m":
                        setLocalNotification(date.setTime(date.getTime() + 30 * 60000));
                        break;
                    case "1h":
                        setLocalNotification(date.setTime(date.getTime() + 1 * 3600000));
                        break;
                    case "2h":
                        setLocalNotification(date.setTime(date.getTime() + 2 * 3600000));
                        break;
                    case "today12":
                        setLocalNotification(date.setHours(12, 0, 0, 0));
                        break;
                    case "today20":
                        setLocalNotification(date.setHours(20, 0, 0, 0));
                        break;
                    case "tomorow8":
                        date.setDate(date.getDate() + 1);
                        setLocalNotification(date.setHours(8, 0, 0, 0));
                        break;
                    case "tomorow12":
                        date.setDate(date.getDate() + 1);
                        setLocalNotification(date.setHours(12, 0, 0, 0));
                        break;
                    case "tomorow20":
                        date.setDate(date.getDate() + 1);
                        setLocalNotification(date.setHours(20, 0, 0, 0));
                        break;
                    case "custom":
                        openNativeDateTimePicker();
                        break;
                    default:
                        openNativeDateTimePicker();
                        break;
                }
            }, function () {

            });
        };

        function setLocalNotification(date) {
            vm.task.notificationId = Math.floor((Math.random() * 10000) + 1);
            localNotifications.setLocalNotification(vm.task, date);
            cordovaPlugins.showToast('תזכורת נקבעה ' + moment(date).calendar(), 2000);
        }

        function openNativeDateTimePicker() {
            cordovaPlugins.showDatePicker().then(function (date) {
                setLocalNotification(date);
            });
        }

        function dateTimePickerCtrl($scope, $mdDialog) {
            $scope.hide = function () {
                $mdDialog.hide();
            };

            $scope.cancel = function () {
                $mdDialog.cancel();
            };

            $scope.answer = function (answer) {
                $mdDialog.hide(answer);
            };
        }

        vm.sendReminder = function () {
            var confirm = $mdDialog.confirm()
               .parent(angular.element(document.querySelector('#deleteRepeatsTaskContainer')))
               .title('לשלוח תזכורת ל' + vm.task.to.name + '?')
               .ariaLabel('sendReminder')
               .ok('שלח')
               .cancel('בטל');

            $mdDialog.show(confirm).then(function () {
                DAL.sendReminderForTasks([vm.task]);
            }, function () {
            });
        };
    }

})();
