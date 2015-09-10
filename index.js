var fs      = require('fs');
var path    = require('path');
var _       = require('lodash');
var Promise = require('bluebird');
Promise.promisifyAll(fs);

function InsertTagWebpackPlugin(options){
  this.options = options || {};
}

InsertTagWebpackPlugin.prototype.apply = function(compiler){
  var self = this,
    options = self.options;
  compiler.plugin('emit', function(compilation, compileCallback){
    var webpackStatsJson = compilation.getStats().toJson(),
      filename = path.resolve(process.cwd(), options.filename),
      destname = path.resolve(process.cwd(), options.destname),
      chunks = options.chunks || [];

    fs.readFileAsync(filename, 'utf8')
      .then(function(htmlContent){
        var htmlWebpackPluginFiles = self.htmlWebpackPluginAssets(compilation, webpackStatsJson, options.chunks, options.excludeChunks),
          html = self.insertTagIntoHtml(htmlContent, htmlWebpackPluginFiles);

        fs.writeFileAsync(destname, html, 'utf8')
          .catch(function(){
            return Promise.reject(new Error('InsertTagWebpackPlugin: Unable to write HTML template "' + destname + '"'));
          });
      })
      .catch(function(e){
        console.dir(e);
        return Promise.reject(new Error('InsertTagWebpackPlugin: Unable to read HTML template "' + filename + '"'));
      });
  });
};

InsertTagWebpackPlugin.prototype.htmlWebpackPluginAssets = function(compilation, webpackStatsJson, includedChunks, excludedChunks){
  var self = this,
    publicPath = typeof compilation.options.output.publicPath !== 'undefined' ?
      compilation.options.output.publicPath :
      path.relative(path.dirname(self.options.filename), '.'),
    assets = {
      chunks: {},
      js: [],
      css: []
    };

  if (publicPath.length && publicPath.substr(-1, 1) !== '/') {
    publicPath += '/';
  }

  var chunks = webpackStatsJson.chunks.sort(function orderEntryLast(a, b) {
    if (a.entry !== b.entry) {
      return b.entry ? 1 : -1;
    } else {
      return b.id - a.id;
    }
  });

  for (var i = 0; i < chunks.length; i++) {
    var chunk = chunks[i];
    var chunkName = chunk.names[0];

    if(chunkName === undefined) {
      continue;
    }

    if (Array.isArray(includedChunks) && includedChunks.indexOf(chunkName) === -1) {
      continue;
    }
    if (Array.isArray(excludedChunks) && excludedChunks.indexOf(chunkName) !== -1) {
      continue;
    }

    assets.chunks[chunkName] = {};

    // Prepend the public path to all chunk files
    var chunkFiles = [].concat(chunk.files).map(function(chunkFile) {
      return publicPath + chunkFile;
    });

    var entry = chunkFiles[0];
    assets.chunks[chunkName].size = chunk.size;
    assets.chunks[chunkName].entry = entry;
    assets.js.push(entry);

    // Gather all css files
    var css = chunkFiles.filter(function(chunkFile){
      return /^.css($|\?)/.test(path.extname(chunkFile));
    });
    assets.chunks[chunkName].css = css;
    assets.css = assets.css.concat(css);
  }

  assets.css = _.uniq(assets.css);

  return assets;
};

InsertTagWebpackPlugin.prototype.insertTagIntoHtml = function(html, htmlWebpackPluginFiles){
  var assets = htmlWebpackPluginFiles,
    chunks = Object.keys(assets.chunks),
    styles = [],
    scripts = [];

  chunks.forEach(function(chunkName) {
    styles = styles.concat(assets.chunks[chunkName].css);
    scripts.push(assets.chunks[chunkName].entry);
  });

  scripts = scripts.map(function(scriptPath) {
    return '<script src="' + scriptPath + '"></script>';
  });
  styles = styles.map(function(stylePath) {
    return '<link href="' + stylePath + '" rel="stylesheet">';
  });

  html = html.replace(/(<\/body>)/i, function (match) {
    return scripts.join('') + match;
  });

  return html;
};

module.exports = InsertTagWebpackPlugin;













