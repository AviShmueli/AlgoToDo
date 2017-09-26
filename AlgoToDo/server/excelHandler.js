(function (excelHandler) {

    excelHandler.downloadExcel = downloadExcel;

    var deferred = require('deferred');
    var moment = require('moment-timezone');
    moment.locale('he');

    require('source-map-support').install();
    var xl = require('excel4node');
    var Jimp = require("jimp");
    var dropbox = require("./dropbox");
    var fs = require('fs');
    var logger = require('./logger');

    var tasksExcelObjects;
    var photos;
    var worksheetName = 'משימות';

    var getStatusHebString = function (status) {
        switch (status) {
            case 'inProgress':
                return 'בתהליך';
            case 'done':
                return 'בוצע'
            case 'closed':
                return 'נסגר'
            default:
                break;
        }
    }

    var getTotalTaskTime = function (task) {
        if (task.doneTime === undefined) {
            return '';
        }
        var end = new Date(task.doneTime);
        var start = new Date(task.createTime);
        var totalInMillisconds = end.getTime() - start.getTime();
        var totalTime = moment.duration(totalInMillisconds);
        return moment.duration(totalInMillisconds).humanize();
    };

    var getTaskCommentsAsString = function (task) {
        var str = '';
        for (var index = 0; index < task.comments.length; index++) {
            var comment = task.comments[index];
            if (comment.text && comment.text !== '') {
                str += comment.from.name + ': ' + removeUnsuportedChars(comment.text) + '\n';
            }
        }
        return str;
    }

    var getTaskPhotos = function (task) {
        var taskPhotos = [];
        for (var index = 0; index < task.comments.length; index++) {
            var comment = task.comments[index];
            if (comment.fileName && comment.fileName !== '') {
                photos.push(comment.fileName);
                taskPhotos.push(comment.fileName);
            }
        }
        return taskPhotos;
    }

    var removeUnsuportedChars = function (str) {
        var chars, chr;
        if (this.allowSurrogateChars) {
            chars = /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uFFFE-\uFFFF]/;
        } else {
            chars = /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE-\uFFFF]/;
        }
        chr = str.match(chars);
        if (chr) {
            str = str.replace(chr, "");
            //throw new Error("Invalid character (" + chr + ") in string: " + str + " at index " + chr.index);
        }
        return str;
    }

    var createExcelObjects = function (tasksList) {
        tasksExcelObjects = [];
        photos = [];
        for (var index = 0; index < tasksList.length; index++) {
            var task = tasksList[index];
            tasksExcelObjects.push({
                createdDate: new Date(task.createTime),
                from: task.from.name,
                to: task.to.name,
                description: removeUnsuportedChars(task.description),
                status: getStatusHebString(task.status),
                totalTime: getTotalTaskTime(task),
                comments: getTaskCommentsAsString(task),
                photos: getTaskPhotos(task)
            });
        }
    }

    var resolveCount;
    var downloadTasksPhotos = function () {

        var d = deferred();

        var ThumbnailSize = 'w128h128';

        if (!photos || photos.length < 1) {
            d.resolve();
        }

        resolveCount = 0;

        for (var index = 0; index < photos.length; index++) {
            var fileName = photos[index];
            dropbox.getThumbnail(fileName, ThumbnailSize)
                .then(function (entry) {

                    if (!fs.existsSync('./tempFiles')) {
                        fs.mkdirSync('./tempFiles');
                    }

                    fs.writeFile('./tempFiles/' + entry.name, entry.fileBinary, 'binary', function (err) {
                        if (err) {
                            throw err;
                            // error
                            resolveCount++;
                        }
                        resolveCount++;
                        if (resolveCount === photos.length) {
                            d.resolve();
                        }
                    });
                }, function (error) {
                    resolveCount++;
                    logger.log("error", "error while trying to get file from dropbox: ", error);
                });
        }

        return d.promise;
    }

    var deleatePhotos = function () {
        var rimraf = require('rimraf');
        rimraf('tempFiles', function () {
            console.log('done');
        }, function (error) {
            logger.log("error", "error while trying to delete temp folder: ", error);
        });
    }

    function downloadExcel(tasks) {

        var d = deferred();

        try {

            createExcelObjects(tasks);

            downloadTasksPhotos().then(function () {

                var excel = generateWorkbook();
                logger.log("info", "step 8: ", null);
                deleatePhotos();
                logger.log("info", "step 9: ", null);
                d.resolve(excel);
            });
        } catch (error) {
            logger.log("error", "error while trying to create report: ", error);
            d.reject(error);
        }

        return d.promise;
    }

    function generateWorkbook() {
        logger.log("info", "step 1: ", null);
        var wb = new xl.Workbook({
            defaultFont: {
                name: 'Verdana',
                size: 12
            },
            dateFormat: 'd/m/yy hh:mm'
        });


        // Create some styles to be used throughout
        var multiLineStyle = wb.createStyle({
            alignment: {
                wrapText: true,
                vertical: 'top'
            }
        });
        var largeText = wb.createStyle({
            font: {
                name: 'Cambria',
                size: 20
            }
        });
        var medText = wb.createStyle({
            font: {
                name: 'Cambria',
                size: 14,
                color: '#D4762C'
            },
            alignment: {
                vertical: 'center'
            }
        });
        var currencyStyle = wb.createStyle({
            numberFormat: '$##0.00; [Red]($##0.00); $0.00'
        });

        var tasksWS = wb.addWorksheet(worksheetName, {
            pageSetup: {
                fitToWidth: 1
            },
            headerFooter: {
                oddHeader: 'iAmNater invoice',
                oddFooter: 'Invoice Page &P'
            }
        });
        logger.log("info", "step 2: ", null);
        // Set some row and column properties
        tasksWS.row(5).setHeight(45);
        tasksWS.column(1).setWidth(3);
        tasksWS.column(2).setWidth(20);
        tasksWS.column(3).setWidth(20);
        tasksWS.column(5).setWidth(25);
        tasksWS.column(8).setWidth(35);
        tasksWS.column(9).setWidth(15);

        tasksWS.cell(5, 2).string('דו"ח משימות').style(largeText); 
        // tasksWS.cell(5, 3).string('מחסני השוק').style(largeText).style({
        //     font: {
        //         color: '#D4762C'
        //     }
        // });
        logger.log("info", "step 3: ", null);
        // Add a company logo
        console.log(__dirname + "/logo.png");
        fs.readFile(__dirname + "/logo.png", function (err, data) {
            if (err) {
                console.log(err)
            } else {
                console.log("file exists");
            }
        });
        tasksWS.addImage({
            path: __dirname + "/logo.png",
            type: 'picture',
            position: {
                type: 'oneCellAnchor',
                from: {
                    col: 8,
                    colOff: 0,
                    row: 1,
                    rowOff: 0
                },
                to: {
                    col: 9,
                    colOff: 0,
                    row: 2,
                    rowOff: 0
                }
            }
        });

        logger.log("info", "step 4: ", null);

        tasksWS.cell(6, 2, 6, 9).style({
            border: {
                bottom: {
                    style: 'thick',
                    color: '#000000'
                }
            }
        });

        var HeadersFields = {
            createTime: 'תאריך',
            from: 'שולח',
            to: 'נמען',
            description: 'תיאור',
            status: 'סטטוס',
            totalTime: 'זמן ביצוע',
            comments: 'תגובות',
            photos: 'תמונות'
        };

        var keyIndex = 2;
        for (var key in HeadersFields) {
            if (HeadersFields.hasOwnProperty(key)) {
                tasksWS.cell(7, keyIndex++).string(HeadersFields[key]).style({
                    alignment: {
                        horizontal: 'right'
                    },
                    font: {
                        bold: true
                    }
                });
            }
        }
        logger.log("info", "step 5: ", null);
        tasksWS.row(7).filter(2, 9);

        var tasks = tasksExcelObjects;
        var i = 0;
        var rowOffset = 8;
        var oddBackgroundColor = '#F8F5EE';
        for (var index = 0; index < tasks.length; index++) {
            var task = tasks[index];
            var curRow = rowOffset + i;
            if (task !== undefined) {
                tasksWS.cell(curRow, 2).date(task.createdDate).style(multiLineStyle);
                tasksWS.cell(curRow, 3).string(task.from).style(multiLineStyle);
                tasksWS.cell(curRow, 4).string(task.to).style(multiLineStyle);
                tasksWS.cell(curRow, 5).string(task.description).style(multiLineStyle);
                tasksWS.cell(curRow, 6).string(task.status).style({
                    alignment: {
                        horizontal: 'center',
                        wrapText: true,
                        vertical: 'top'
                    }
                });
                tasksWS.cell(curRow, 7).string(task.totalTime).style({
                    alignment: {
                        horizontal: 'center',
                        wrapText: true,
                        vertical: 'top'
                    }
                });
                tasksWS.cell(curRow, 8).string(task.comments).style(multiLineStyle);

                var maxCol = 9;
                for (var j = 0; j < task.photos.length; j++) {
                    var fileName = task.photos[j];

                    //tasksWS.cell(curRow, (9 + j)).string('').style(multiLineStyle);
                    tasksWS.row(curRow).setHeight(128);
                    tasksWS.column(9 + j).setWidth(15);
                    if (9 + j > maxCol) {
                        maxCol = 9 + j;
                    }
                    logger.log("info", "step 6: ", null);
                    tasksWS.addImage({
                        path: './tempFiles/' + fileName,
                        type: 'picture',
                        position: {
                            type: 'oneCellAnchor',
                            from: {
                                col: 9 + j,
                                colOff: 0,
                                row: curRow,
                                rowOff: 0
                            },
                            to: {
                                col: 10 + j,
                                colOff: 0,
                                row: curRow + 1,
                                rowOff: 0
                            }
                        }
                    });
                }

                if (i % 2 === 0) {
                    tasksWS.cell(curRow, 2, curRow, maxCol).style({
                        fill: {
                            type: 'pattern',
                            patternType: 'solid',
                            fgColor: oddBackgroundColor
                        }
                    });
                }
                i++;
            }
        }
        logger.log("info", "step 7: ", null);
        // Add some borders to specific cells
        /* tasksWS.cell(2, 2, 2, 5).style({
             border: {
                 bottom: {
                     style: 'thick',
                     color: '#000000'
                 }
             }
         });

         // Add some data and adjust styles for specific cells
         tasksWS.cell(3, 2, 3, 3, true).string('January 1, 2016').style({
             border: {
                 bottom: {
                     style: 'thin',
                     color: '#D4762C'
                 }
             }
         });
         tasksWS.cell(4, 2, 4, 3, true).string('PAYMENT DUE BY: March 1, 2016').style({
             font: {
                 bold: true
             }
         });

         // style methods can be chained. multiple styles will be merged with last style taking precedence if there is a conflict
         tasksWS.cell(3, 5, 4, 5, true).formula('E31').style(currencyStyle).style({
             font: {
                 size: 20,
                 color: '#D4762C'
             },
             alignment: {
                 vertical: 'center'
             }
         });
         tasksWS.cell(4, 2, 4, 5).style({
             border: {
                 bottom: {
                     style: 'thin',
                     color: '#000000'
                 }
             }
         });

         tasksWS.row(6).setHeight(75);
         tasksWS.cell(6, 2, 6, 5).style(multiLineStyle);

         // set some strings to have multiple font formats within a single cell
         tasksWS.cell(6, 2, 6, 3, true).string([{
                 bold: true
             },
             'Client Name\n',
             {
                 bold: false
             },
             'Company Name Inc.\n1234 First Street\nSomewhere, OR 12345'
         ]);

         tasksWS.cell(6, 4, 6, 5, true).string([{
                 bold: true
             },
             'iAmNater.com\n',
             {
                 bold: false
             },
             '123 Nowhere Lane\nSomewhere, OR 12345'
         ]).style({
             alignment: {
                 horizontal: 'right'
             }
         });*/

        // tasksWS.cell(21, 2, 21, 5).style({
        //     border: {
        //         bottom: {
        //             style: 'thin',
        //             color: '#DCD1B3'
        //         }
        //     }
        // });

        // tasksWS.cell(22, 4).string('Discount');
        // tasksWS.cell(22, 5).number(0.00).style(currencyStyle);

        // tasksWS.cell(23, 4).string('Net Total');
        // tasksWS.cell(23, 5).formula('SUM(E11:E21)').style(currencyStyle);

        // tasksWS.cell(23, 2, 23, 5).style({
        //     border: {
        //         bottom: {
        //             style: 'thin',
        //             color: '#000000'
        //         }
        //     }
        // });

        // tasksWS.row(24).setHeight(20);
        // tasksWS.cell(24, 4, 25, 4, true).string('USD TOTAL').style(medText);
        // tasksWS.cell(24, 5, 25, 5, true).formula('SUM(E22:E23)').style(medText).style(currencyStyle);
        /*****************************************
         * END Create a sample invoice
         *****************************************/


        /*****************************************
         * START Create a filterable list
         *****************************************/

        // var filterSheet = wb.addWorksheet('Filters');

        // for (var i = 1; i <= 10; i++) {
        //     filterSheet.cell(1, i).string('Header' + i);
        // }
        // filterSheet.row(1).filter(1, 10);

        // for (var r = 2; r <= 30; r++) {
        //     for (var c = 1; c <= 10; c++) {
        //         filterSheet.cell(r, c).number(parseInt(Math.random() * 100));
        //     }
        // }
        /*****************************************
         * END Create a filterable list
         *****************************************/

        /*****************************************
         * START Create collapsable lists
         *****************************************/


        // var collapseSheet = wb.addWorksheet('Collapsables', {
        //     pageSetup: {
        //         fitToWidth: 1
        //     },
        //     outline: {
        //         summaryBelow: true
        //     }
        // });

        // var rowOffset = 0;
        // for (var r = 1; r <= 10; r++) {
        //     for (var c = 1; c <= 10; c++) {
        //         collapseSheet.cell(r + rowOffset, c).number(parseInt(Math.random() * 100));
        //     }
        //     collapseSheet.row(r + rowOffset).group(1, true);
        // }
        // for (var i = 1; i <= 10; i++) {
        //     collapseSheet.cell(11, i).formula('SUM(' + xl.getExcelCellRef(rowOffset + 1, i) + ':' + xl.getExcelCellRef(rowOffset + 10, i) + ')');
        // }
        // collapseSheet.cell(11, 1, 11, 10).style({
        //     fill: {
        //         type: 'pattern',
        //         patternType: 'solid',
        //         fgColor: '#C2D6EC'
        //     }
        // });

        // var rowOffset = 11;
        // for (var r = 1; r <= 10; r++) {
        //     for (var c = 1; c <= 10; c++) {
        //         collapseSheet.cell(r + rowOffset, c).number(parseInt(Math.random() * 100));
        //     }
        //     collapseSheet.row(r + rowOffset).group(1, true);
        // }
        // for (var i = 1; i <= 10; i++) {
        //     collapseSheet.cell(22, i).formula('SUM(' + xl.getExcelCellRef(rowOffset + 1, i) + ':' + xl.getExcelCellRef(rowOffset + 10, i) + ')');
        // }
        // collapseSheet.cell(22, 1, 22, 10).style({
        //     fill: {
        //         type: 'pattern',
        //         patternType: 'solid',
        //         fgColor: '#4273B0'
        //     }
        // });



        // var rowOffset = 22;
        // for (var r = 1; r <= 10; r++) {
        //     for (var c = 1; c <= 10; c++) {
        //         collapseSheet.cell(r + rowOffset, c).number(parseInt(Math.random() * 100));
        //     }
        //     collapseSheet.row(r + rowOffset).group(1, true);
        // }
        // for (var i = 1; i <= 10; i++) {
        //     collapseSheet.cell(33, i).formula('SUM(' + xl.getExcelCellRef(rowOffset + 1, i) + ':' + xl.getExcelCellRef(rowOffset + 10, i) + ')');
        // }
        // collapseSheet.cell(33, 1, 33, 10).style({
        //     fill: {
        //         type: 'pattern',
        //         patternType: 'solid',
        //         fgColor: '#C2D6EC'
        //     }
        // });

        // var rowOffset = 33;
        // for (var r = 1; r <= 10; r++) {
        //     for (var c = 1; c <= 10; c++) {
        //         collapseSheet.cell(r + rowOffset, c).number(parseInt(Math.random() * 100));
        //     }
        //     collapseSheet.row(r + rowOffset).group(1, true);
        // }
        // for (var i = 1; i <= 10; i++) {
        //     collapseSheet.cell(44, i).formula('SUM(' + xl.getExcelCellRef(rowOffset + 1, i) + ':' + xl.getExcelCellRef(rowOffset + 10, i) + ')');
        // }
        // collapseSheet.cell(44, 1, 44, 10).style({
        //     fill: {
        //         type: 'pattern',
        //         patternType: 'solid',
        //         fgColor: '#4273B0'
        //     }
        // });



        // var rowOffset = 44;
        // for (var r = 1; r <= 10; r++) {
        //     for (var c = 1; c <= 10; c++) {
        //         collapseSheet.cell(r + rowOffset, c).number(parseInt(Math.random() * 100));
        //     }
        //     collapseSheet.row(r + rowOffset).group(1, true);
        // }
        // for (var i = 1; i <= 10; i++) {
        //     collapseSheet.cell(55, i).formula('SUM(' + xl.getExcelCellRef(rowOffset + 1, i) + ':' + xl.getExcelCellRef(rowOffset + 10, i) + ')');
        // }
        // collapseSheet.cell(55, 1, 55, 10).style({
        //     fill: {
        //         type: 'pattern',
        //         patternType: 'solid',
        //         fgColor: '#C2D6EC'
        //     }
        // });

        // var rowOffset = 55;
        // for (var r = 1; r <= 10; r++) {
        //     for (var c = 1; c <= 10; c++) {
        //         collapseSheet.cell(r + rowOffset, c).number(parseInt(Math.random() * 100));
        //     }
        //     collapseSheet.row(r + rowOffset).group(1, true);
        // }
        // for (var i = 1; i <= 10; i++) {
        //     collapseSheet.cell(66, i).formula('SUM(' + xl.getExcelCellRef(rowOffset + 1, i) + ':' + xl.getExcelCellRef(rowOffset + 10, i) + ')');
        // }
        // collapseSheet.cell(66, 1, 66, 10).style({
        //     fill: {
        //         type: 'pattern',
        //         patternType: 'solid',
        //         fgColor: '#4273B0'
        //     }
        // });
        /*****************************************
         * START Create collapsable lists
         *****************************************/

        /*****************************************
         * START Create Frozen lists
         *****************************************/

        // var frozenSheet = wb.addWorksheet('Frozen');

        // for (var i = 2; i <= 21; i++) {
        //     frozenSheet.cell(1, i).string('Column' + i);
        // }
        // frozenSheet.row(1).freeze();

        // for (var r = 2; r <= 30; r++) {
        //     frozenSheet.cell(r, 1).string('Row' + r);
        //     for (var c = 2; c <= 22; c++) {
        //         frozenSheet.cell(r, c).number(parseInt(Math.random() * 100));
        //     }
        // }
        // frozenSheet.column(1).freeze();

        /*****************************************
         * END Create Frozen lists
         *****************************************/

        /*****************************************
         * START Create Split sheet
         *****************************************/

        // var splitSheet = wb.addWorksheet('SplitSheet', {
        //     'sheetView': {
        //         'pane': {
        //             'activePane': 'bottomRight',
        //             'state': 'split',
        //             'xSplit': 2000,
        //             'ySplit': 3000
        //         }
        //     }
        // });

        // for (var r = 1; r <= 30; r++) {
        //     for (var c = 1; c <= 20; c++) {
        //         splitSheet.cell(r, c).number(parseInt(Math.random() * 100));
        //     }
        // }

        /*****************************************
         * END Create Split
         *****************************************/

        /*****************************************
         * START Create Selectable Options list
         *****************************************/
        // var optionsSheet = wb.addWorksheet('Selectable Options');

        // optionsSheet.cell(1, 1).string('Booleans');
        // optionsSheet.cell(1, 2).string('Option List');
        // optionsSheet.cell(1, 3).string('Numbers 1-10');

        // optionsSheet.addDataValidation({
        //     type: 'list',
        //     allowBlank: true,
        //     prompt: 'Choose from dropdown',
        //     error: 'Invalid choice was chosen',
        //     sqref: 'A2:A10',
        //     formulas: [
        //         'true,false'
        //     ]
        // });

        // optionsSheet.addDataValidation({
        //     type: 'list',
        //     allowBlank: true,
        //     prompt: 'Choose from dropdown',
        //     promptTitle: 'Choose from dropdown',
        //     error: 'Invalid choice was chosen',
        //     showInputMessage: true,
        //     sqref: 'B2:B10',
        //     formulas: [
        //         'option 1,option 2,option 3'
        //     ]
        // });

        // optionsSheet.addDataValidation({
        //     errorStyle: 'stop',
        //     error: 'Number must be between 1 and 10',
        //     type: 'whole',
        //     operator: 'between',
        //     allowBlank: 1,
        //     sqref: 'C2:C10',
        //     formulas: [1, 10]
        // });
        /*****************************************
         * END Create Selectable Options list
         *****************************************/

        /*****************************************
         * START final sheet
         *****************************************/

        // var funSheet = wb.addWorksheet('fun', {
        //     pageSetup: {
        //         orientation: 'landscape'
        //     },
        //     sheetView: {
        //         zoomScale: 120
        //     }
        // });

        // funSheet.cell(1, 1).string('Release 1.0.0! Finally done.');
        // funSheet.addImage({
        //     path: './sampleFiles/thumbsUp.jpg',
        //     type: 'picture',
        //     position: {
        //         type: 'absoluteAnchor',
        //         x: 0,
        //         y: '10mm'
        //     }
        // });


        /*****************************************
         * END final sheet
         *****************************************/

        return wb;
    }




})(module.exports);