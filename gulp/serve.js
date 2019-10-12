'use strict';

const browserSync = require('browser-sync');
const gulp = require('gulp');
const util = require('util');
const url = require('url');
const proxy = require('proxy-middleware');

const config = require('./config');

/**
 * Build project, start watching for all changes and serve it using Browsersync.
 * @gulptask serve
 */
gulp.task('serve', ['watch'], () => {
  initBrowsersync([
    config.paths.serve,
    config.paths.src,
  ]);
});

/**
 * Build production version and serve it using Browsersync.
 * @gulptask serve:dist
 */
gulp.task('serve:dist', ['build'], () => {
  initBrowsersync(config.paths.dist);
});

/**
 * Initialize Browsersync.
 * @see https://browsersync.io/docs
 * @param {string|Array} baseDir
 * @return {void}
 */
function initBrowsersync(baseDir) {
  let routes = null;

  // Rewrite path to `bower_components` if serving sources.
  if (baseDir === config.paths.src ||
      (util.isArray(baseDir) && baseDir.indexOf(config.paths.src) !== -1)) {
    routes = {
      '/bower_components': 'bower_components',
    };
  }
  const env = process.env.NODE_ENV;


  const uri = env === 'development' ? `http://localhost:4000` : '';
  var proxyOptions = url.parse(uri);
  proxyOptions.route = '/api';

  browserSync.init({
    open: true,
    server: {
      baseDir: baseDir,
      middleware: [proxy(proxyOptions)],
      routes: routes
    },
    single: true,
    startPath: '/',
  });
}
