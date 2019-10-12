const gulp = require('gulp');
const browserSync = require('browser-sync');
var url = require('url');
const webserver = require('gulp-webserver');
var proxy = require('proxy-middleware');


gulp.task('run', ['serve'], function () {
  const uri = `http://localhost:4000/api`;
  var proxyOptions = url.parse(uri);
  proxyOptions.route = '/api';
  
  browserSync({
    open: true,
    port: 8080,
    startPath: '/',
    server: {
      baseDir: '.tmp/serve',
      middleware: [proxy(proxyOptions)],
      routes: {
        '/': 'content'
      }
    }
  });
  // return;
  // gulp
  //   .src('.tmp/serve')
  //   .pipe(webserver({
  //     directoryListing: {
  //       enable: true,
  //       path: 'tmp'
  //     },
  //     livereload: true,
  //     proxies: [
  //       {
  //         source: '/api', target: 'http://localhost:4000/'
  //       }
  //     ]
  //   }));
});

