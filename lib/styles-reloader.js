/* jshint node: true */
'use strict';

var path = require('path');

// default reload css extensions
var styleExtensions = ['css', 'scss', 'sass', 'less', 'styl'];
var reloadCssPattern = new RegExp('\.(' + styleExtensions.join('|') + ')$');

var noop = function(){};

module.exports = function StylesReloader(options){
  var options = options;
  var fsWatcher = options.watcher;
  var ui = options.ui;
  var _isRunning = false;
  var lsProxy = options.ssl ? require('https') : require('http');

  // build app style pattern
  var vendorStylePath = path.join(options.project.root, 'vendor', '*');
  var vendorStylePattern = new RegExp('^' + vendorStylePath);
  var appStyleResource = options.project.pkg.name + '.css';

  // livereload hostname
  var liveReloadHostname = [
    (options.ssl ? 'https://' :'http://'),
    (options.liveReloadHost || options.host || 'localhost'),
    ':',
    options.liveReloadPort
  ].join('');


  function shouldReload(filePath){
    return filePath.match(reloadCssPattern);
  };

  function getReloadResource(filePath){
    return filePath.match(vendorStylePattern) ? "vendor.css" : appStyleResource;
  };

  function fileDidChange(results){
    var filePath = results.filePath || '';

    // notify livereload server if needed
    if (shouldReload(filePath)){
      var reloadResource = getReloadResource(filePath);
      ui.writeLine('Reloading ' + reloadResource + ' only from: ' + filePath);
      lsProxy.get(liveReloadHostname + '/changed?files=' + reloadResource)
          .on('error', noop);
    }
  };

  function mergeReloadFilters(){
    options.project.liveReloadFilterPatterns.push(reloadCssPattern);
  };

  return {

    run: function(){
      if (!options.liveReload) {
        ui.writeLine('StylesReloader is disabled');
        return;
      }

      if (this.isRunning()){
        return;
      }

      ui.writeLine('StylesReloader watches ' + styleExtensions.join('|'));
      if (fsWatcher) {
        mergeReloadFilters();
        fsWatcher.on('change', fileDidChange.bind(this));
        _isRunning = !_isRunning;
      }
    },

    isRunning: function(){
      return _isRunning;
    }
  };
};
