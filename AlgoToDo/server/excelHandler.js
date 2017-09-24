(function (excelHandler) {

    excelHandler.downloadExcel = downloadExcel;

    var deferred = require('deferred');
    var moment = require('moment-timezone');
    moment.locale('he');

    require('source-map-support').install();
    var xl = require('excel4node');
    var Jimp = require("jimp");
    var dropbox = require("./dropbox");

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
                str += comment.from.name + ': ' + comment.text + '\n';
            }
        }
        return str;
    }


    var https = require('https');
    var fs = require('fs');
    var request = require('request');

    var download = function (uri, filename, callback) {
        request.head(uri, function (err, res, body) {
            console.log('content-type:', res.headers['content-type']);
            console.log('content-length:', res.headers['content-length']);

            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    };

    var getTaskPhotos = function (task) {
        var str = '';
        for (var index = 0; index < task.comments.length; index++) {
            var comment = task.comments[index];
            if (comment.fileName && comment.fileName !== '') {
                str += comment.from.name + ': ' + comment.fileName + ', ';
            }
        }
        return str;
    }

    dropbox.downloadFile('2017-09-17T18_58_01.290Z.jpg', function (entry) {
        var a = 1;
        // Jimp.read("./file.jpg", function (err, lenna) {
        //     if (err) throw err;
        //     lenna.resize(128, 128) // resize
        //         .quality(60) // set JPEG quality
        //         .greyscale() // set greyscale
        //         .write("file-small-bw.jpg"); // save
        //     // d.resolve(generateWorkbook());

        // });
    },function(error){
        var b = 2;
    });

    function downloadExcel() {

        var d = deferred();
        //https://www.dropbox.com/s/4ho2j0sfc5zwtm5/2017-09-17T18_48_42.864Z.jpg?dl=1
        //https://www.dropbox.com/s/pb0hks4ixe4qjj4/2017-09-17T18_58_01.290Z.jpg?dl=1
        download('https://www.dropbox.com/s/pb0hks4ixe4qjj4/2017-09-17T18_58_01.290Z.jpg?dl=1', 'file.jpg', function () {

            // open a file called "lenna.png"
            Jimp.read("./file.jpg", function (err, lenna) {
                if (err) throw err;
                lenna.resize(128, 128) // resize
                    .quality(60) // set JPEG quality
                    .greyscale() // set greyscale
                    .write("file-small-bw.jpg"); // save

                setTimeout(function () {
                    d.resolve(generateWorkbook());
                }, 0);

            });
        });




        // var file = fs.createWriteStream("file.jpg");
        // var request = https.get("https://www.dropbox.com/s/3o48o6gcq5s75sm/2017-01-30T08_52_53.540Z.jpg?dl=1", function(response) {
        //     response.on('data', (_d) => {
        //         _d.pipe(file);
        //         d.resolve(generateWorkbook()) ;
        //       });  
        // });

        return d.promise;
    }

    function generateWorkbook() {
        var wb = new xl.Workbook({
            defaultFont: {
                name: 'Verdana',
                size: 12
            },
            dateFormat: 'd/m/yy hh:mm'
        });

        /*****************************************
         * START Create a sample invoice
         *****************************************/

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

        // Set some row and column properties
        tasksWS.row(5).setHeight(45);
        tasksWS.column(1).setWidth(3);
        tasksWS.column(2).setWidth(20);
        tasksWS.column(3).setWidth(20);
        tasksWS.column(5).setWidth(25);
        tasksWS.column(8).setWidth(35);
        tasksWS.column(9).setWidth(35);

        tasksWS.cell(5, 2).string('משימות').style(largeText);
        tasksWS.cell(5, 3).string('מחסני השוק').style(largeText).style({
            font: {
                color: '#D4762C'
            }
        });

        // var Volume = require('memfs');
        // //Volume.mkdirpSync(process.cwd());
        // process.chdir('/');
        // Volume.writeFileSync('/logo2.png', './sampleFiles/logo.png');


        // //var vol2 = Volume.fromJSON({'/foo': 'bar 2'});
        // var a = Volume.readFileSync('/logo2.png'); // bar 2



        // Add a company logo
        tasksWS.addImage({
            path: './sampleFiles/logo.png',
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

        tasksWS.row(7).filter(2, 9);

        var tasks = require('../sampleFiles/invoiceData.json');
        var i = 0;
        var rowOffset = 8;
        var oddBackgroundColor = '#F8F5EE';
        for (var index = 0; index < tasks.length; index++) {
            var task = tasks[index];
            var curRow = rowOffset + i;
            if (task !== undefined) {
                // tasksWS.cell(curRow, 2).number(task.units).style({
                //     alignment: {
                //         horizontal: 'left'
                //     }
                // });
                tasksWS.cell(curRow, 2).date(new Date(task.createTime)).style(multiLineStyle);
                tasksWS.cell(curRow, 3).string(task.from.name).style(multiLineStyle);
                tasksWS.cell(curRow, 4).string(task.to.name).style(multiLineStyle);
                tasksWS.cell(curRow, 5).string(task.description).style(multiLineStyle);
                tasksWS.cell(curRow, 6).string(getStatusHebString(task.status)).style({
                    alignment: {
                        horizontal: 'center',
                        wrapText: true,
                        vertical: 'top'
                    }
                });
                tasksWS.cell(curRow, 7).string(getTotalTaskTime(task)).style({
                    alignment: {
                        horizontal: 'center',
                        wrapText: true,
                        vertical: 'top'
                    }
                });
                tasksWS.cell(curRow, 8).string(getTaskCommentsAsString(task)).style(multiLineStyle);
                tasksWS.cell(curRow, 9).string(getTaskPhotos(task)).style(multiLineStyle);
                if (index === 3) {


                    tasksWS.addImage({
                        path: './file-small-bw.jpg',
                        type: 'picture',
                        position: {
                            type: 'oneCellAnchor',
                            from: {
                                col: 9,
                                colOff: 0,
                                row: curRow,
                                rowOff: 0
                            },
                            to: {
                                col: 10,
                                colOff: 0,
                                row: curRow + 1,
                                rowOff: 0
                            }
                        }
                    });

                    // tasksWS.cell(curRow, 4).number(task.unitCost).style(currencyStyle);
                    //tasksWS.cell(curRow, 5).formula(xl.getExcelCellRef(rowOffset + i, 2) + '*' + xl.getExcelCellRef(rowOffset + 1, 4)).style(currencyStyle);
                }
                if (i % 2 === 0) {
                    tasksWS.cell(curRow, 2, curRow, 9).style({
                        fill: {
                            type: 'pattern',
                            patternType: 'solid',
                            fgColor: oddBackgroundColor
                        }
                    });
                }
                i++;
            }

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

    }


})(module.exports);