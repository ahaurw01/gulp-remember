'use strict';

var through = require('through2'),
    util = require('gulp-util'),
    pluginName = 'gulp-remember', // name of our plugin for error logging purposes
    caches = {}, // will hold named file caches
    defaultName = '_default'; // name to give a cache if not provided

/**
 * Return a through stream that will:
 *   1. Remember all files that ever pass through it.
 *   2. Add all remembered files back into the stream when not present.
 * @param cacheName {string} Name to give your cache.
 *                           Caches with different names can know about different sets of files.
 */
function gulpRemember(cacheName) {
  var cache; // the files we've ever put our hands on in the current stream

  if (cacheName !== undefined && typeof cacheName !== 'number' && typeof cacheName !== 'string') {
    throw new util.PluginError(pluginName, 'Usage: require("gulp-remember")(name); where name is undefined, number or string');
  }
  cacheName = cacheName || defaultName; // maybe need to use a default cache
  caches[cacheName] = caches[cacheName] || {files: {}, history: {}}; // maybe initialize the named cache
  cache = caches[cacheName];

  function transform(file, enc, callback) {
    cache.files[file.path] = file; // add file to our cache

    (file.history || []).forEach(function (path) {
      cache.history[path] = file.path;
    });

    callback();
  }

  function flush(callback) {
    // add all files we've ever seen back into the stream
    for (var path in cache.files) {
      if (cache.files.hasOwnProperty(path)) {
        this.push(cache.files[path]); // add this file back into the current stream
      }
    }
    callback();
  }

  return through.obj(transform, flush);
}

/**
 * Forget about a file.
 * A warning is logged if either the named cache or file do not exist.
 *
 * @param cacheName {string} name of the cache from which to drop the file
 * @param path {string} path of the file to forget
 */
gulpRemember.forget = function (cacheName, path) {
  if (arguments.length === 1) {
    path = cacheName;
    cacheName = defaultName;
  }
  if (typeof cacheName !== 'number' && typeof cacheName !== 'string') {
    throw new util.PluginError(pluginName, 'Usage: require("gulp-remember").forget(cacheName, path); where cacheName is undefined, number or string and path is a string');
  }
  if (caches[cacheName] === undefined) {
    util.log(pluginName, '- .forget() warning: cache ' + cacheName + ' not found');
  } else if (caches[cacheName].files[path] === undefined) {
    util.log(pluginName, '- .forget() warning: file ' + path + ' not found in cache ' + cacheName);
  } else {
    (caches[cacheName].files[path].history || []).forEach(function (path) {
      delete caches[cacheName].history[path];
    });
    delete caches[cacheName].files[path];
  }
};

/**
 * Forget about a file using its history.
 * A warning is logged if either the named cache or file do not exist.
 *
 * @param cacheName {string} name of the cache from which to drop the file
 * @param path {string} path of the file to forget
 */
gulpRemember.forgetUsingHistory = function (cacheName, path) {
  if (arguments.length === 1) {
    path = cacheName;
    cacheName = defaultName;
  }
  if (typeof cacheName !== 'number' && typeof cacheName !== 'string') {
    throw new util.PluginError(pluginName, 'Usage: require("gulp-remember").forgetUsingHistory(cacheName, path); where cacheName is undefined, number or string and path is a string');
  }
  if (caches[cacheName] === undefined) {
    return util.log(pluginName, '- .forgetUsingHistory() warning: cache ' + cacheName + ' not found');
  }
  if (caches[cacheName].files[path] !== undefined) {
    return gulpRemember.forget(cacheName, path);
  }
  if (caches[cacheName].history[path] === undefined) {
    return util.log(pluginName, '- .forgetUsingHistory() warning: file ' + path + ' not found in cache ' + cacheName);
  }
  return gulpRemember.forget(cacheName, caches[cacheName].history[path]);
};

/**
 * Forget all files in one cache.
 * A warning is logged if the cache does not exist.
 *
 * @param cacheName {string} name of the cache to wipe
 */
gulpRemember.forgetAll = function (cacheName) {
  if (arguments.length === 0) {
    cacheName = defaultName;
  }
  if (typeof cacheName !== 'number' && typeof cacheName !== 'string') {
    throw new util.PluginError(pluginName, 'Usage: require("gulp-remember").forgetAll(cacheName); where cacheName is undefined, number or string');
  }
  if (caches[cacheName] === undefined) {
    util.log(pluginName, '- .forget() warning: cache ' + cacheName + ' not found');
  } else {
    caches[cacheName] = {files: {}, history: {}};
  }
};

/**
 * Return a raw cache by name.
 * Useful for checking state. Manually adding or removing files is NOT recommended.
 *
 * @param cacheName {string} name of the cache to retrieve
 */
gulpRemember.cacheFor = function (cacheName) {
  if (arguments.length === 0) {
    cacheName = defaultName;
  }
  if (typeof cacheName !== 'number' && typeof cacheName !== 'string') {
    throw new util.PluginError(pluginName, 'Usage: require("gulp-remember").cacheFor(cacheName); where cacheName is undefined, number or string');
  }
  return (caches[cacheName] || {}).files;
};

/**
 * Return a raw history by name.
 * Useful for checking state. Manually adding or removing files is NOT recommended.
 *
 * @param cacheName {string} name of the cache to retrieve
 */
gulpRemember.historyFor = function (cacheName) {
  if (arguments.length === 0) {
    cacheName = defaultName;
  }
  if (typeof cacheName !== 'number' && typeof cacheName !== 'string') {
    throw new util.PluginError(pluginName, 'Usage: require("gulp-remember").historyFor(cacheName); where cacheName is undefined, number or string');
  }
  return (caches[cacheName] || {}).history;
};

module.exports = gulpRemember;
