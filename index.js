var _     = require('lodash');
var map   = require('map-stream');
var pp    = require('preprocess');
var path  = require('path');

module.exports = function (options) {
  var opts    = _.merge({}, options);
  var context = _.merge(
    {},
    process.env,
    options ? options.context : {},
    customMergerFor(options)
  );

  function ppStream(file, callback) {
    var contents, extension;

    // TODO: support streaming files
    if (file.isNull()) return callback(null, file); // pass along
    if (file.isStream()) return callback(new Error("gulp-preprocess: Streaming not supported"));

    context.src = file.path;
    context.srcDir = opts.includeBase || path.dirname(file.path);
    context.NODE_ENV = context.NODE_ENV || 'development';

    extension = _.isEmpty(opts.extension) ? getExtension(context.src) : opts.extension;

    contents = file.contents.toString('utf8');
    contents = pp.preprocess(contents, context, {type: extension});
    file.contents = new Buffer(contents);

    callback(null, file);
  }

  return map(ppStream);
};

function getExtension(filename) {
  var ext = path.extname(filename||'').split('.');
  return ext[ext.length - 1];
}

// Allows using 'undefined' values as part of the explicit context passed
// to options, hence allowing override of environment variables, but more
// importantly, re-enabling the use of @ifdef and @ifndef in preprocess
function customMergerFor(options) {
  return function(objVal, sourceVal, key, object, source) {
    var shouldAssign = typeof(options) !== 'undefined' &&
      source === options.context &&
      sourceVal === undefined;

    if (shouldAssign) {
      object[key] = sourceVal;
    }
  };
}
