(function() {
    'use strict';

    angular
        .module('TaskManeger.widgets')
        .controller('AddTaskDialogController', AddTaskDialogController);

    AddTaskDialogController.$inject = [
        '$scope', '$mdDialog', 'datacontext', '$mdMedia'
    ];

    function AddTaskDialogController($scope, $mdDialog, datacontext, $mdMedia) {

        var vm = this;

        vm.isSmallScrean = $mdMedia('sm');
        vm.task = datacontext.getNewTask();

        vm.hide = function() {
            $mdDialog.hide();
        };
        vm.cancel = function() {
            $mdDialog.cancel();
        };
        vm.save = function () {
            vm.task.from = datacontext.getUserFromLocalStorage().name;
            vm.task.status = 'inProgress';
            vm.task.createTime = new Date();
            datacontext.saveNewTask(vm.task);
            $mdDialog.hide('ok');
        };
    }

})();