var async = require('async'); 

function hasPermission(permission) {
  return function (context, api, callback) {
    callback(null, true);
  }
}

function isBoxActive (context, api, callback) {
  api.boxes.getBox(context.boxName, function (err, doc) {
    callback(err, doc && doc.info && doc.info.status, 'is ' + context.boxName + ' active');
  });
}

function isLoggedIn (context, api, callback) {
  return callback(null, context.userAlias, 'is logged in');
}

function isBoxOwner (context, api, callback) {
  if (!context.userAlias || !context.boxName) {
    return callback('missing user alias or box name', false);
  }
  
  api.users.getUserRole(context.userAlias, context.boxName, function (err, role) {
    console.log('fdsfds' + role);
    return callback(err, role == 'owner', context.userAlias + 'is owner of ' + boxName);
  });
}

function isBoxAdmin (context, api, callback) {
  if (!context.userAlias || !context.boxName) {
    return callback('missing user alias or box name', false);
  }
  
  api.users.getUserRole(context.userAlias, context.boxName, function (err, role) {
    console.log(context.userAlias, context.boxName, role);
    return callback(err, role == 'owner' || role == 'admin', context.userAlias + 'is admin of ' + context.boxName);
  });
}

function isBoxDeveloper (context, api, callback) {
  if (!context.userAlias || !context.boxName) {
    return callback('missing user alias or box name', false);
  }
  
  api.users.getUserRole(context.userAlias, context.boxName, function (err, role) {
    console.log(context.userAlias, context.boxName, role);
    return callback(err, role == 'owner' || role == 'admin' || role == 'dev', context.userAlias + 'is dev of ' + context.boxName);
  });
}

function isBoxUser (context, api, callback) {
  if (!context.userAlias || !context.boxName) {
    return callback('missing user alias or box name', false);
  }
  
  api.users.getUserRole(context.userAlias, context.boxName, function (err, role) {
    console.log(context.userAlias, context.boxName, role);
    return callback(err, !!role, context.userAlias + 'is user of ' + context.boxName);
  });
}

function allOf() {
  var toCheck = [];
  
  for (var i = 0; i < arguments.length; i++) {
    toCheck.push(arguments[i]);
  }
  
  return function (context, api, callback) {
    var allowed = true, queued = [], reason;
    
    for (var j = 0; j < toCheck.length; j++) {
      queued.push(toCheck[j]);
    }
    
    async.until(function () {
      return !allowed || queued.length == 0;
    }, function (callback) {
      var inner = queued.shift();
      
      inner(context, api, function (err, iallowed, ireason) {
        if (err) return callback(err);
        
        allowed = iallowed;
        
        if (!allowed) {
        console.log(ireason);
          reason = 'failed: ' + ireason;
        }
        
        callback();
      });
    }, function (err) {
      callback(err, allowed, reason);
    });
  };
}

function anyOf() {
  var toCheck = [], reason;
  
  for (var i = 0; i < arguments.length; i++) {
    toCheck.push(arguments[i]);
  }
  
  return function (context, api, checkedCallback) {
    var allowed = false, queued = [];
    
    for (var j = 0; j < toCheck.length; j++) {
      queued.push(toCheck[j]);
    }
    
    async.until(function () {
      return allowed || queued.length === 0;
    }, function (callback) {
      var inner = queued.shift();
      
      inner(context, api, function (err, iallowed, ireason) {
        if (err) return callback(err);
        
        allowed = iallowed;

        callback();
      });
    }, function (err) {
      console.log('any of... ' + allowed);
      checkedCallback(err, allowed, reason);
    });
  };
}

function callbackFor(context, realApi, req, res, module, method, impl, origArgments) {
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
  
function wrapFor(shouldCheck, req, res, impl, realApi, module, method) {
  return function () {
    var origArgments = [], context = {};
    
    for (var i = 0; i < arguments.length; i++) {
      origArgments.push(arguments[i]);
    }
    
    if (req.session && req.session.user && req.session.user.alias) {
      context.userAlias = req.session.user.alias;
    }
    
    if (req.params) context.boxName = req.params.boxName;
    
    console.log('wrapped api.' + [module,method].join('.') + ' invoke for ' + JSON.stringify(context));
    
    shouldCheck(context, realApi, callbackFor(context, realApi, req, res, module, method, impl, origArgments));
  }
}


var permissions = {
  boxes: {
    listBoxes: isLoggedIn,
    createBox: isLoggedIn,
    listActiveBoxes: isLoggedIn,
    getBox: anyOf(isBoxAdmin,allOf(isBoxUser,isBoxActive))
  },
  packages: {
    activatePackage: isBoxDeveloper,
    dectivatePackage: isBoxDeveloper,
    setActivePackages: isBoxDeveloper, 
  },
  users: {
    enableUser: isBoxAdmin
  },
  permissions: {
    createPermissionGroup: isBoxDeveloper,
    listPermissionGroups: isBoxDeveloper,
    describePermissionGroup: isBoxDeveloper,
    modifyPermissionGroup: anyOf(isBoxDeveloper,hasPermission('groups[groupId].manageUsers'))
  }
};

module.exports = function wrappedApi(req, res, api) {
  var wrapped = {};
  
  for (var m in api) {
    if (permissions[m]) {
      wrapped[m] = {};
  
      for (var n in api[m]) {
        if (permissions[m][n]) {
          wrapped[m][n] = wrapFor(permissions[m][n], req, res, api[m][n], api, m, n).bind(api);
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

