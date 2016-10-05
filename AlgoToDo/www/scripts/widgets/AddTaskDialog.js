(function() {
    'use strict';

    angular
        .module('TaskManeger.widgets')
        .controller('AddTaskDialogController', AddTaskDialogController);

    AddTaskDialogController.$inject = [
        '$scope', '$mdDialog', 'datacontext'
    ];

    function AddTaskDialogController($scope, $mdDialog, datacontext) {

        var vm = this;

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