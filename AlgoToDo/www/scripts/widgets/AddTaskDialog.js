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
        vm.task = datacontext.newTask;

        vm.hide = function() {
            $mdDialog.hide();
        };
        vm.cancel = function() {
            $mdDialog.cancel();
        };
        vm.save = function() {
            $mdDialog.hide('ok');
        };
    }

})();