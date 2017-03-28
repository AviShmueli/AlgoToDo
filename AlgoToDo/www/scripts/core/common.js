(function () {
    'use strict';

    angular
        .module('app.core')
        .factory('common', common);

    common.$inject = [];

    function common() {

        function arrayObjectIndexOf(myArray, property, searchTerm) {
            for (var i = 0, len = myArray.length; i < len; i++) {
                if (myArray[i][property] === searchTerm) return i;
            }
            return -1;
        }

        return {
            arrayObjectIndexOf: arrayObjectIndexOf
        };

    }
})();
