const gulp = require('gulp');
const webserver = require('gulp-webserver');

gulp.task('run', ['serve'], function () {
  gulp.src('.tmp/serve')
  .pipe(webserver({
    directoryListing: {
      enable: true,
      path: 'tmp'
    }
  }));
});

