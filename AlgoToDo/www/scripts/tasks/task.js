﻿(function () {
    'use strict';

    angular
        .module('app.tasks')
        .controller('taskCtrl', taskCtrl);

    taskCtrl.$inject = [
        '$rootScope', '$scope', 'logger', 'appConfig',
         'datacontext', '$routeParams', '$window', 'moment',
         'socket'
    ];

    function taskCtrl($rootScope, $scope, logger, appConfig,
         datacontext, $routeParams, $window, moment, socket) {

        var vm = this;

        vm.taskId = $routeParams.taskId;
        vm.task = datacontext.getTaskByTaskId(vm.taskId);
        vm.user = datacontext.getUserFromLocalStorage();
        vm.appDomain = appConfig.appDomain;
        vm.taskIsToMe = (vm.task.to._id === vm.user._id);
        vm.taskIsFromMe = (vm.task.from._id === vm.user._id);
        angular.element(document.querySelectorAll('html')).removeClass("hight-auto");


        if (vm.task.comments === undefined) {
            vm.task.comments = [];
        }

        // login 
        //socket.emit('join', {
        //    userId: vm.user._id
        //});

        vm.goBack = function () {
            $window.history.back();
        }

        vm.openMenu = function ($mdOpenMenu, ev) {
            $mdOpenMenu(ev);
        };

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

    }

})();