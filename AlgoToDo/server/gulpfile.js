var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var nodemon = require('gulp-nodemon');

var jsFiles = ['*.js']; //, 'bower_components/**/*.js'

gulp.task('style', function() {
    return gulp.src(jsFiles)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish', {
            verbose: true
        }))
        .pipe(jscs());
});

gulp.task('inject', function() {
    var wiredep = require('wiredep').stream;
    var inject = require('gulp-inject');

    var injectSrc = gulp.src(['./src/client/Content/*.css', './src/client/*/*.js'], {
        read: false
    });
    var injectOptions = {
        ignorePath: '/src/client'
    };

    var options = {
        bowerJson: require('../bower.json'),
        directory: './bower_components',
        ignorePath: '../../bower_components'
    };

    return gulp.src('./src/client/*.*')
        .pipe(wiredep(options))
        //.pipe(inject(injectSrc, injectOptions))
        .pipe(gulp.dest('./src/client'));
});

gulp.task('serve', ['style', 'inject'], function() {
    var options = {
        script: 'app.js',
        delayTime: 1,
        env: {
            'PORT': 5001
        },
        watch: jsFiles
    };

    return nodemon(options)
        .on('restart', function(ev) {
            console.log('Restarting...');
        });
});