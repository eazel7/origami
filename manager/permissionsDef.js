return {
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
    listFiles: isBoxUser
  },
  collections: {
    getCollection: anyOf(isBoxAdmin, allOf(isBoxActive, isBoxUser)),
    getCollections: anyOf(isBoxAdmin, allOf(isBoxActive, isBoxUser)),
    createCollection: anyOf(allOf(isBoxDeveloper,isBoxActive),isBoxAdmin),
    createServerCollection: anyOf(allOf(isBoxDeveloper,isBoxActive),isBoxAdmin),
    destroyCollection: anyOf(allOf(isBoxDeveloper,isBoxActive),isBoxAdmin)
  },
  packages: {
    getActivePackagesWithDependencies: isBoxDeveloper,
    activatePackage: isBoxDeveloper,
    dectivatePackage: isBoxDeveloper,
    setActivePackages: isBoxDeveloper, 
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
    listUsersInGroup: isBoxDeveloper
  },
  schedules: {
    stopSchedule: isBoxDeveloper,
    startSchedule: anyOf(isBoxAdmin,allOf(isBoxActive,isBoxDeveloper))
  },
  users: {
    listUsers: isBoxDeveloper,
    listBoxUsers: isBoxDeveloper,
    enableUser: isBoxDeveloper,
    getUserRole: isBoxDeveloper,
    disableUser: isBoxDeveloper,
    isValid: isBoxUser,
    listViews: anyOf(isBoxDeveloper,allOf(isBoxActive, isBoxUser)),
    getView: anyOf(isBoxDeveloper,allOf(isBoxActive, isBoxUser)),
    removeView: allOf(isBoxActive, isBoxDeveloper),
    saveView: allOf(isBoxActive, isBoxDeveloper)
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
  }
};

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
  if (!context.userAlias) return callback('missing user alias', false);
  if (!context.boxName) return callback('missing box name', false);
  
  api.users.getUserRole(context.userAlias, context.boxName, function (err, role) {
    return callback(err, role == 'owner', context.userAlias + 'is owner of ' + boxName);
  });
}

function isBoxAdmin (context, api, callback) {
  if (!context.userAlias) return callback('missing user alias', false);
  if (!context.boxName) return callback('missing box name', false);
  
  api.users.getUserRole(context.userAlias, context.boxName, function (err, role) {
    return callback(err, role == 'owner' || role == 'admin', context.userAlias + 'is admin of ' + context.boxName);
  });
}

function isBoxDeveloper (context, api, callback) {
  if (!context.userAlias) return callback('missing user alias', false);
  if (!context.boxName) return callback('missing box name', false);
  
  api.users.getUserRole(context.userAlias, context.boxName, function (err, role) {
    return callback(err, role == 'owner' || role == 'admin' || role == 'dev', context.userAlias + 'is dev of ' + context.boxName);
  });
}

function isBoxUser (context, api, callback) {
  if (!context.userAlias) return callback('missing user alias', false);
  if (!context.boxName) return callback('missing box name', false);
  
  api.users.getUserRole(context.userAlias, context.boxName, function (err, role) {
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

function addGraphIdToArgumentsFromWorkflowId(paramName, then) {
  return function (context, api, callback) {
    api
    .collections
    .getCollection(context.boxName, '_workflowResults')
    .findOne({
      workflowId: context.arguments[paramName]
    }, function (err, doc) {
      if (err) return callback(err);
      
      if (doc) {
        context.graphId = doc.graphId;
      };
        
      then(context, api, callback);
    });
  };
}
