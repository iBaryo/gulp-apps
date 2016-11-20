
var gulp = require('gulp');
var jasmine = require('gulp-jasmine');
var typescript = require('gulp-tsc');
var runSequence = require('run-sequence');

gulp.task('compile', function(){
    return gulp.src(['src/*.ts', 'spec/*.ts'])
        .pipe(typescript({
            "module": "commonjs",
            "target": "es5",
            "sourceMap": false,
            "declaration": true,
            "experimentalDecorators": true

        }))
        .pipe(gulp.dest('./'));
});

gulp.task('test', function() {
    return gulp.src('spec/*.js')
        .pipe(jasmine());
});

gulp.task('default', function() {
    runSequence( 'compile', 'test' );
});