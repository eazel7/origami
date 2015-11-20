/* eslint-disable semi */

var permissions = require('./permissionsDef');

var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(.+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function getArgNames (fn) {
  var argNames = [];
  var fnText = fn.toString().replace(STRIP_COMMENTS, '');
  var argDecl = fnText.match(FN_ARGS);
  var splitted = argDecl[1].split(FN_ARG_SPLIT);

  for (var i = 0; i < splitted.length; i++) {
    var arg = splitted[i];

    arg.replace(FN_ARG, function (all, underscore, name) {
      argNames.push(name);
    });
  }

  return argNames;
}

function callbackFor (context, realApi, onfail, module, method, impl, origArgments, reason) {
  return function (err, allowed) {
    if (err) {
      console.log(context.checks.join(' > '));
      console.error(['error checking', module, method, ':', err, JSON.stringify(context)].join(' '));
      onfail();
    } else if (!allowed) {
      console.log(context.checks.join(' > '));
      console.log('api.' + module + '.' + method + ' for ' + JSON.stringify(context)) + 'rejected';
      onfail();
    } else {
      console.log('Invoking ' + module + '.' + method + '(' + JSON.stringify(origArgments) + ')');
      impl.apply(realApi, origArgments);
    }
  }
}

function wrapFor (shouldCheck, contextProvider, onfail, impl, realApi, module, method) {
  return function () {
    var origArgments = [];
    var context = contextProvider();

    context.arguments = {};
    context.checks = [];

    var argNames = getArgNames(impl);

    for (var i = 0; i < arguments.length; i++) {
      origArgments.push(arguments[i]);
      context.arguments[argNames[i]] = arguments[i];
    }

    shouldCheck(context, realApi, callbackFor(context, realApi, onfail, module, method, impl, origArgments));
  }
}

function APIWrapper () {
};

APIWrapper.prototype.wrap = function (contextProvider, onfail, api) {
  var wrapped = {};

  for (var m in api) {
    if (permissions[m]) {
      wrapped[m] = {};

      for (var n in api[m]) {
        if (permissions[m][n]) {
          wrapped[m][n] = wrapFor(permissions[m][n], contextProvider, onfail, api[m][n], api, m, n).bind(api);
        } else {
          wrapped[m][n] = api[m][n];
        }
      }
    } else if (m !== 'wrapper' && m !== 'config') {
      wrapped[m] = api[m];
    }
  }

  wrapped.isWrapped = true;

  return wrapped;
};

module.exports = APIWrapper;
