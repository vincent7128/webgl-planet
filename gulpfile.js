var gulp = require('gulp'),
    clean = require('gulp-clean'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    css = require('gulp-clean-css'),
    gulpsync = require('gulp-sync')(gulp),
    replace = require('gulp-replace'),
    fs = require('fs'),
    PROJECT,
    DATE;

gulp.task('clean', function() {
    return gulp.src(['dist', 'index.html'], {
            read: false
        })
        .pipe(clean({
            force: true
        }));
});

gulp.task('build-js', function() {
    return gulp.src([
            'node_modules/gl-matrix/dist/gl-matrix.js',
            'node_modules/text-image/src/text-image.js',
            'node_modules/color-object/src/color.js',
            'src/js/' + PROJECT.name + '.js'
        ])
        .pipe(concat(PROJECT.name + '.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js/'));
});

gulp.task('build-css', function() {
    return gulp.src('src/css/' + PROJECT.name + '.css')
        .pipe(css())
        .pipe(gulp.dest('dist/css/'));
});

gulp.task('gh-pages-replace', function() {
    return gulp.src([
            'demo/index.html',
            'demo/countries.html',
            'demo/antimeridian.html',
        ])
        .pipe(replace('%_VERSION_%', PROJECT.version))
        .pipe(replace('%_DATE_%', DATE.toUTCString()))
        .pipe(gulp.dest('demo'));
});

gulp.task('gh-pages-copy', function() {
    return gulp.src('demo/index.html')
        .pipe(gulp.dest('.'));
});

gulp.task('init', function() {
    PROJECT = JSON.parse(fs.readFileSync('./package.json'));
    DATE = new Date();
})

gulp.task('build', gulpsync.sync([
    'init',
    'clean',
    'build-js',
    'build-css',
]));

gulp.task('gh-pages', gulpsync.sync([
    'build',
    'gh-pages-replace',
    'gh-pages-copy'
]));