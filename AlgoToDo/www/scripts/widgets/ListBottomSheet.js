(function() {
    'use strict';

    angular
        .module('app.widgets')
        .controller('ListBottomSheetCtrl', ListBottomSheetCtrl);

    ListBottomSheetCtrl.$inject = [
        '$scope', '$mdBottomSheet'
    ];

    function ListBottomSheetCtrl($scope, $mdBottomSheet) {

        var vm = this;

        vm.items = [{
            name: 'שתף',
            icon: 'share'
        }, {
            name: 'הרשאות',
            icon: 'upload'
        }, {
            name: 'ייצא',
            icon: 'copy'
        }, {
            name: 'הדפס',
            icon: 'print'
        }, ];

        vm.listItemClick = function($index) {
            var clickedItem = vm.items[$index];
            $mdBottomSheet.hide(clickedItem);
        };
    }
})();