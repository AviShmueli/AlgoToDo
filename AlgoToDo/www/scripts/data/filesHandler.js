(function () {
    'use strict';

    angular
        .module('app')
        .service('filesHandler', filesHandler);

    filesHandler.$inject = ['FileSaver', 'Blob'];

    function filesHandler(FileSaver, Blob) {

        var scope = this;
        

        var downloadAsCSV = function (orderList, fileds, fileName) {
            scope.reportFields = fileds;
            scope.filename = fileName;

            var strData = convertObjListToStrData(orderList);   
            downloadFile(strData);         
        }

        var convertObjListToStrData = function (objList) {
            scope.fields = [];
            scope.header = [];
            scope.separator = ',';

            angular.forEach(scope.reportFields, function (field, key) {
                if (!field || !key) {
                    throw new Error('error json report fields');
                }

                scope.fields.push(key);
                scope.header.push(field);
            });

            var bodyData = _bodyData(objList);
            var strData = _convertToExcel(bodyData);

            return strData;
        }

        var downloadFile = function (strData) {

            var blob = new Blob([strData], {
                //type: "text/plain;charset=utf-8"
                type: "application/vnd.openxmlformat-officedocument.spreadsheetml.sheet;"
            });

            FileSaver.saveAs(blob, scope.filename + '.xls');
        }

        function _bodyData(data) {
            var body = "";
            angular.forEach(data, function (dataItem) {
                var rowItems = [];

                angular.forEach(scope.fields, function (field) {
                    if (field.indexOf('.')) {
                        field = field.split(".");
                        var curItem = dataItem;

                        // deep access to obect property
                        angular.forEach(field, function (prop) {
                            if (curItem !== null && curItem !== undefined) {
                                curItem = curItem[prop];
                            }
                        });

                        data = curItem;
                    } else {
                        data = dataItem[field];
                    }

                    var fieldValue = data !== null ? data : ' ';

                    if (fieldValue !== undefined && angular.isObject(fieldValue)) {
                        fieldValue = _objectToString(fieldValue);
                    }

                    if (typeof fieldValue == 'string') {
                        //rowItems.push('"' + fieldValue.replace(/"/g, '""') + '"');
                        rowItems.push(fieldValue.replace(/"/g, '""'));
                    } else {
                        rowItems.push(fieldValue);
                    }
                });

                body += rowItems.join(scope.separator) + '\n';
            });

            return body;
        }

        function _convertToExcel(body) {
            return scope.header.join(scope.separator) + '\n' + body;
        }

        function _objectToString(object) {
            var output = '';
            angular.forEach(object, function (value, key) {
                output += key + ':' + value + ' ';
            });

            return '"' + output + '"';
        }


        var service = {
            downloadAsCSV: downloadAsCSV
        };

        return service;
    }

})();