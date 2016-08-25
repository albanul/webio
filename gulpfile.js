/**
 * Created by Alex on 25.08.2016.
 */

var gulp = require('gulp'),
	mocha = require('gulp-mocha'),
	webdriver = require('gulp-webdriver'),
	plumber = require('gulp-plumber');

gulp.task('mocha', function () {
	gulp.src('scripts/tests/tests.js')
		.pipe(mocha());
});

gulp.task('webio', function() {
	gulp.src('wdio.conf.js')
		.pipe(plumber())
		.pipe(webdriver());
});