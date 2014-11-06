var async = require('async'); 

var permissions = require('./permissionsDef');

var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(.+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function getArgNames(fn) {
  var argNames = [],
      fnText = fn.toString().replace(STRIP_COMMENTS, ''),
      argDecl = fnText.match(FN_ARGS),
      splitted = argDecl[1].split(FN_ARG_SPLIT);
      
  for (var i = 0; i < splitted.length; i++) {
    var arg = splitted[i];
    
    arg.replace(FN_ARG, function(all, underscore, name){
      argNames.push(name);
    });
  }
  
  return argNames;
}


function callbackFor(context, realApi, res, module, method, impl, origArgments) {
  return function (err, allowed, reason) {
    if (err) {
      console.error(['error checking', module, method,':', err].join(' '));
      res.status(418);
      res.end();
    } else if (!allowed) {
      console.error([JSON.stringify(context),'not allowed for', module, method].join(' '));
      res.status(405);
      res.send('Insufficient user permissions to perform this action');
      console.log(reason);
      res.end();
    } else {
      impl.apply(realApi, origArgments);
    }
  }
}
  
function wrapFor(shouldCheck, contextProvider, res, impl, realApi, module, method) {
  return function () {
    var origArgments = [], context = contextProvider();
    
    context.arguments = {};
    
    var argNames = getArgNames(impl);
    
    for (var i = 0; i < arguments.length; i++) {
      origArgments.push(arguments[i]);
      context.arguments[argNames[i]] = arguments[i];
    }
    
    console.log('wrapped api.' + [module,method].join('.') + ' invoke for ' + JSON.stringify(context));
    
    shouldCheck(context, realApi, callbackFor(context, realApi, res, module, method, impl, origArgments));
  }
}

module.exports = function wrappedApi(contextProvider, res, api) {
  var wrapped = {};
  
  for (var m in api) {
    if (permissions[m]) {
      wrapped[m] = {};
  
      for (var n in api[m]) {
        if (permissions[m][n]) {
          wrapped[m][n] = wrapFor(permissions[m][n], contextProvider, res, api[m][n], api, m, n).bind(api);
        } else {
          wrapped[m][n] = api[m][n];
        }
      }
    } else {
      wrapped[m] = api[m];
    }
  }

  wrapped.isWrapped = true;

  return wrapped;
}

