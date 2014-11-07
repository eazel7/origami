module.exports = {
  boxes: {
    createBox: isLoggedIn,
    listBoxes: isLoggedIn,
    listActiveBoxes: isLoggedIn,
    getBox: anyOf(isBoxAdmin,allOf(isBoxUser,isBoxActive)),
    saveInfo: isBoxOwner,
    uploadFile: anyOf(isBoxDeveloper,hasPermission('system.fileUpload')),
    deleteFile: anyOf(isBoxDeveloper,hasPermission('system.deleteUploads')),
    serveFile: allOf(isBoxUser,isBoxActive),
    export: isBoxDeveloper,
    import: isBoxDeveloper,
    listFiles: isBoxUser,
    exportAllBoxes: isMasterUser,
    importBoxes: isMasterUser
  },
  collections: {
    getCollection: anyOf(isBoxAdmin, allOf(isBoxActive, isBoxUser)),
    find: anyOf(isBoxAdmin, allOf(isBoxActive, hasPermission('collections[collectionName].find'))),
    findOne: anyOf(isBoxAdmin, allOf(isBoxActive, hasPermission('collections[collectionName].find'))),
    count: anyOf(isBoxAdmin, allOf(isBoxActive, hasPermission('collections[collectionName].find'))),
    update: anyOf(isBoxAdmin, allOf(isBoxActive, hasPermission('collections[collectionName].update'))),
    insert: anyOf(isBoxAdmin, allOf(isBoxActive, hasPermission('collections[collectionName].insert'))),
    remove: anyOf(isBoxAdmin, allOf(isBoxActive, hasPermission('collections[collectionName].remove'))),
    createCollection: anyOf(allOf(isBoxDeveloper,isBoxActive),isBoxAdmin),
    createServerCollection: anyOf(allOf(isBoxDeveloper,isBoxActive),isBoxAdmin),
    destroyCollection: anyOf(allOf(isBoxDeveloper,isBoxActive),isBoxAdmin)
  },
  packages: {
    getActivePackagesWithDependencies: isBoxUser,
    activatePackage: isBoxDeveloper,
    dectivatePackage: isBoxDeveloper,
    setActivePackages: isBoxDeveloper,
    exportAllPackages: isMasterUser,
    importPackages: isMasterUser
  },
  users: {
    enableUser: isBoxAdmin,
    disableUser: isBoxAdmin
  },
  permissions: {
    createPermissionGroup: isBoxDeveloper,
    listPermissionGroups: isBoxDeveloper,
    describePermissionGroup: anyOf(isBoxDeveloper,hasPermission('groups[groupId].manageUsers')),
    modifyPermissionGroup: isBoxDeveloper,
    deletePermissionGroup: isBoxDeveloper,
    addUserToGroup: anyOf(isBoxDeveloper,hasPermission('groups[groupId].manageUsers')),
    removeUserFromGroup: anyOf(isBoxDeveloper,hasPermission('groups[groupId].manageUsers')),
    listUsersInGroup: isBoxDeveloper,
    setMasterUser: isMasterUser
  },
  schedules: {
    stopSchedule: isBoxDeveloper,
    startSchedule: anyOf(isBoxAdmin,allOf(isBoxActive,isBoxDeveloper))
  },
  users: {
    listUsers: isLoggedIn,
    listBoxUsers: isBoxDeveloper,
    enableUser: isBoxDeveloper,
    getUserRole: isBoxDeveloper,
    disableUser: isBoxDeveloper,
    getUserMetadata: rejectAlways,
    setUserMetadata: rejectAlways,
    isValid: isBoxUser,
    listViews: anyOf(isBoxDeveloper,allOf(isBoxActive, isBoxUser)),
    getView: anyOf(isBoxDeveloper,allOf(isBoxActive, isBoxUser)),
    removeView: allOf(isBoxActive, isBoxDeveloper),
    saveView: allOf(isBoxActive, isBoxDeveloper),
    setCreateBoxQuota: isMasterUser,
    setMasterUser: isMasterUser
  },
  workflows: {
    listPastWorkflows: isBoxDeveloper,
    getWorkflowResult: isBoxDeveloper,
    setWorkflowResult: isBoxDeveloper,
    listRunningWorkflows: isBoxDeveloper,
    getActiveConnections: isBoxDeveloper,
    getOutput: isBoxDeveloper,
    saveWorkflowEndDate: isBoxDeveloper,
    saveWorkflowStartDate: isBoxDeveloper,
    startWorkflow: allOf(isBoxActive, anyOf(isBoxDeveloper, hasPermission('graphs[graphId].startInstances'))),
    stopWorkflow: allOf(isBoxActive, anyOf(isBoxDeveloper, addGraphIdToArgumentsFromWorkflowId('workflowId', hasPermission('graphs[graphId].stopInstances')))),
    listGraphs: isBoxDeveloper,
    saveGraph: allOf(isBoxActive,isBoxDeveloper),
    removeGraph: allOf(isBoxActive, isBoxDeveloper),
    listComponents: allOf(isBoxActive, isBoxDeveloper)
  },
  settings: {
    get: isMasterUser,
    set: isMasterUser
  }
};

function hasPermission(permission) {
  
  return function (context, api, callback) {
    context.checks.push('has permission ' + permission);

    var vm = require('vm'), allowed;
    
    api.permissions.getEffectivePermissions(context.boxName, context.userAlias, function (err, effectivePermissions) {
      if (err) return callback(err);
      
      var sandbox = {};
      
      for (k in effectivePermissions) {
        sandbox[k] = effectivePermissions[k];
      }
      
      for (k in context.arguments) {
        sandbox[k] = context.arguments[k];
      }
      
      try {
        vm.runInNewContext('result = ' + permission, sandbox, 'permission check.vm');
      } catch (e) {
        return callback(e, sandbox.result);
      }
      
      callback(null, sandbox.result);
    });
    
  };
}

function isBoxActive (context, api, callback) {
  api.boxes.getBox(context.boxName, function (err, doc) {
    context.checks.push('is box active');
    callback(err, doc && doc.info && doc.info.status);
  });
}

function isLoggedIn (context, api, callback) {
  context.checks.push('user is logged in');
  return callback(null, context.userAlias);
}

function isBoxOwner (context, api, callback) {
  context.checks.push('is box owner');
  if (!context.userAlias) return callback('missing user alias', false);
  if (!context.boxName) return callback('missing box name', false);
  
  api.users.getUserRole(context.userAlias, context.boxName, function (err, role) {
    return callback(err, role == 'owner');
  });
}
function isBoxAdmin (context, api, callback) {
  context.checks.push('is box admin');
  if (!context.userAlias) return callback('missing user alias', false);
  if (!context.boxName) return callback('missing box name', false);
  
  api.users.getUserRole(context.userAlias, context.boxName, function (err, role) {
    return callback(err, role == 'owner' || role == 'admin');
  });
}

isBoxAdmin.prototype.reason = 'is box admin';

function isBoxDeveloper (context, api, callback) {
  context.checks.push('is box dev');
  
  if (!context.userAlias) return callback('missing user alias', false);
  if (!context.boxName) return callback('missing box name', false);
  
  api.users.getUserRole(context.userAlias, context.boxName, function (err, role) {
    return callback(err, role == 'owner' || role == 'admin' || role == 'dev');
  });
}

function isBoxUser (context, api, callback) {
  context.checks.push('is box user');
  
  if (!context.userAlias) return callback('missing user alias', false);
  if (!context.boxName) return callback('missing box name', false);
  
  api.users.getUserRole(context.userAlias, context.boxName, function (err, role) {
    return callback(err, !!role);
  });
}

function isMasterUser (context, api, callback) {
  context.checks.push('is master user');
  
  if (!context.userAlias) return callback('missing user alias', false);
  
  api.users.getMasterUser(function (err, alias) {
    return callback(err, alias === context.userAlias);
  });
}

function allOfFor(toCheck, reason) {
  var fn = function (context, api, callback) {
    var allowed = true, queued = [];
    
    context.checks.push('all of [');
    
    for (var j = 0; j < toCheck.length; j++) {
      queued.push(toCheck[j]);
    }
    
    async.until(function () {
      return !allowed || queued.length == 0;
    }, function (callback) {
      var inner = queued.shift();
      
      inner(context, api, function (err, iallowed) {
        if (err) return callback(err);
        
        allowed = iallowed;
        
        callback();
      });
    }, function (err) {
      context.checks.push(']');
      callback(err, allowed);
    });
  };
  
  fn.prototype.reason = reason;
  
  return fn
}

function allOf() {
  var toCheck = [], reasons = [], reason;
  
  for (var i = 0; i < arguments.length; i++) {
    toCheck.push(arguments[i]);
    reasons.push(arguments[i].prototype.reason);
  }
  
  var fn = allOfFor(toCheck);
  
  return fn;
}

function anyOf() {
  var toCheck = [], reasons = [];
  
  for (var i = 0; i < arguments.length; i++) {
    toCheck.push(arguments[i]);
    reasons.push(arguments[i].prototype.reason);
  }
  
  return function (context, api, checkedCallback) {
    context.checks.push('any of [');
    var allowed = false, queued = [];
    
    for (var j = 0; j < toCheck.length; j++) {
      queued.push(toCheck[j]);
    }
    
    async.until(function () {
      return allowed || queued.length === 0;
    }, function (callback) {
      var inner = queued.shift();
      
      inner(context, api, function (err, iallowed) {
        if (err) return callback(err);
        
        allowed = iallowed;

        callback();
      });
    }, function (err) {
      context.checks.push(']');
      checkedCallback(err, allowed);
    });
  };
}

function addGraphIdToArgumentsFromWorkflowId(paramName, then) {
  return function (context, api, callback) {
    context.checks.push('map graphId from argument ' + paramName);
  
    api
    .collections
    .getCollection(context.boxName, '_workflowResults', function (err, collection) {
      if (err) return callback(err);
      
      collection.findOne({
        workflowId: context.arguments[paramName]
      }, function (err, doc) {
        if (err) return callback(err);
        
        if (doc) {
          context.graphId = doc.graphId;
        };
          
        then(context, api, callback);
      });
    });
  };
}

function rejectAlways () {
  return function (context, api, callback) {
    callback(null, false);
  }
}
