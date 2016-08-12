const argv = require('minimist')(process.argv.slice(2))

const gulp = require('gulp')
const sass = require('gulp-sass')
const uglify = require('gulp-uglify')
const rename = require('gulp-rename')
const streamify = require('gulp-streamify')
const source = require('vinyl-source-stream')
const del = require('del')

const budo = require('budo')
const browserify = require('browserify')
const babelify = require('babelify').configure({
  presets: ['es2015', 'react'] 
})

const jsEntry = './src/scripts/index.js'

// our CSS pre-processor
gulp.task('sass', function () {
  gulp.src('./src/styles/main.scss')
    .pipe(sass({ 
      outputStyle: argv.production ? 'compressed' : undefined
    }).on('error', sass.logError))
    .pipe(rename('bundle.css'))
    .pipe(gulp.dest('./dist'))
})

// copy html
gulp.task('html', function () {
  gulp.src('src/**/*.html')
    .pipe(gulp.dest('./dist'))
})

// copy assets
gulp.task('assets', function () {
  gulp.src('assets/**')
    .pipe(gulp.dest('./dist'))
});

// clean out dist
gulp.task('clean', function () {
  del(['./dist'])
})

// the development task
gulp.task('watch', ['clean', 'html', 'sass'], function (cb) {
  // copy index.html
  gulp.watch('src/**/*.html', ['html'])

  // watch SASS
  gulp.watch('src/styles/*.scss', ['sass'])

  // dev server
  budo(jsEntry, {
    serve: 'bundle.js',     // endpoint for our <script> tag
    stream: process.stdout, // pretty-print requests
    live: true,             // live reload & CSS injection
    dir: ['dist', 'src'],          // directory to serve
    open: argv.open,        // whether to open the browser
    browserify: {
      transform: babelify   // browserify transforms
    }
  }).on('exit', cb)
})

// the distribution bundle task
gulp.task('bundle', ['clean', 'html', 'assets', 'sass'], function () {
  var bundler = browserify(jsEntry, { transform: babelify })
                  .bundle()
  return bundler
          .pipe(source('index.js'))
          .pipe(streamify(uglify()))
          .pipe(rename('bundle.js'))
          .pipe(gulp.dest('./dist'))
})
