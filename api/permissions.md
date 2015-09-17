# API permissions

> I suggest to create a constructor recieving a permisson check function list and wrapper with the context describing the permissions over the existing API so the API internally keep working the same

### an object describing the permissions to check in the API wrapper:

```
// note the that groups[groupId].manageUsers is a path in the group permission description object
// note that groupId is a parameter in the function
// this might be easily evaluated using:

function evalPermission(permissions, context, callback) {
  return function (context) {
    var globals = {};

    for (var k in permissions) {
      globals[k] = permissions;
    }
    
    

    try {
      return require('vm').runInNewContext('return ' + permission, globals);
    } catch (e) {
      return false;
    }
  }
}

function isAdmin(context, callback) {

}

function or(list) {
  return function (context, callback) {
    var async = require('async'), found, pending = [];
    
    for (var i = 0; i < list.length; i++) pending.push(list[i]);
    
    async.whilst(function () {
      return found || pending.length;
    }, function (callback) {
      found = pending.shift()(context, callback);
    }, function (err) {
      if (err) return callback(err);
      
      return callback(null, found);
    });
  }
}

var permissionChecksDescription = {
  boxes: {
    createBox: isServerAdmin,
    listBoxes: isNotAnonymous,
    listActiveBoxes: isNotAnonymous
  },
  collections: {
    listCollections: isBoxDeveloper
  },
  permissions: {
    createPermissionGroup: isBoxAdmin,
    addUserToGroup: or(isBoxAdmin, belongsGroupWith('groups[groupId].manageUsers'))
  }
};
```

### Express.JS handler to set a req.api API wrapper object

```
function WebRequestApiProvider(config, realApi) {
  // a usual Express.JS request handler
  // which fills the req.api object with a contextualized one

  return function (req, res, next) {
    var user;

    if (req.session.user) user = req.session.user.alias;

    apiKey = req.headers["apikey"];
    
    var context = {
      user: user,
      apiKey: apiKey
    };
    
    req.api = new ApiWrapper(config, context, realApi);
    
    next();
  }
};

// before registering the route handlers
app.use(PermissionChecker(permissionChecksDescription));

### Web request handler

> note we don't call a global API object but the one provider in the req object

```
function (req, res) {
  req.api.listBoxes(req.params.boxName, req.session.user.alias, function (err) {
    if (err) {
      console.error(err);
      res.status(418);
      res.end();
    }
    
    res.status(200);
    res.end();
  });
}
```

## Boxes

### createBox: function (boxName, owner, callback)

### listBoxes: function (callback)

### listActiveBoxes: function (callback)

### getBox function (name, callback)

### saveInfo: function (boxName, info, callback)

### uploadFile: function (boxName, buffer, callback)

### deleteFile: function (boxName, id, callback)

### listFiles: function (boxName, callback)

### serveFile: function (boxName, id, callback)

### export: function (boxName, callback)

### import: function (boxName, bytes, callback)

## Collections

### getCollection: function (boxName, collectionName, callback)

### getCollections: function (boxName, callback)

### createCollection: function (boxName, collectionName, callback)

### createServerCollection: function (boxName, collectionName, callback)

### destroyCollection: function (boxName, collectionName, callback)

## Packages

### getActivePackagesWithDependencies: function (boxName, callback)

### getDependencies: function (packageName, callback)

### setDependencies: function (packageName, dependencies, callback, silent)

### getPackageType: function (packageName, callback)

### getActivePackages: function (boxName, callback)

### getPackageOwner: function (packageName, callback)

### setPackageOwner: function (packageName, alias, callback)

### getPackageInfo: function (packageName, callback)

### setPackageInfo: function (packageName, info, callback)

### setPackageType: function (packageName, packageType, callback, silent)

### getActivePackages: function (boxName, callback)

### removeFolder: function (packageName, folder, callback)

### setActivePackages: function (boxName, packages, callback)

### activatePackage: function (boxName, package, callback)

### deactivatePackage: function (boxName, package, callback)

### listPackages: function(callback)

### createFolder: function (packageName, folderName, callback)

### listFolders: function (packageName, callback)

### createPackage: function(name, callback)

### removePackage: function(packageName, callback)

### listAssets: function(packageName, callback)

### createAsset: function(packageName, assetPath, callback, silent)

### updateAsset: function(packageName, assetPath, bytes, callback, silent)

### removeAsset: function(packageName, assetPath, callback)

### getAsset: function(packageName, assetPath, callback)

### listScripts: function (packageName, callback)

### listScripts: function (packageName, callback)

### listAngularModules: function (packageName, callback)

### setAngularModules: function (packageName, angularModules, callback, silent)

### setStyles: function (packageName, styles, callback, silent)

### setScripts: function (packageName, scripts, callback, silent)

### getAssetMetadata: function(packageName, assetPath, callback)

### unzipAsset: function(packageName, assetPath, callback)

### importPackage: function(zippedBuffer, importCallback)

### setAssetMetadata: function(packageName, assetPath, newMetadata, callback, silent)

### exportPackage: function (packageName, callback)

## Permissons

### checkPermission: function (context, callback)

### listPermissionGroups: function (boxName, callback)

### describePermissionGroup: function (boxName, groupId, callback)

### createPermissionGroup: function (boxName, groupName, callback)

### modifyPermissionGroup: function (boxName, groupId, newPermissions, callback)

### deletePermissionGroup: function (boxName, groupId, callback)

### addUserToGroup: function (boxName, groupId, alias, callback)

### removeUserFromGroup: function (boxName, groupId, alias, callback)

### listUsersInGroup: function (boxName, groupId, callback)

## Remote DBs

### getCollection: function (box, name, collectionName, callback)

### listForBox: function (box, callback)

### unsetForBox: function (box, name, callback)

### setForBox: function (box, name, url, callback)

## Schedules:

### ensureSchedules: function (callback)

### stopSchedule: function (boxName, id, callback)

### startSchedule: function (boxName, id, callback)

## Settings:

### get: function (key, callback)

### set: function (key, value, callback)

## Stats:

### getBoxUsage: function (boxName, from, to, collection, callback)

### getBoxErrors: function (boxName, from, to, callback)

## Users:

### listUsers: function (callback)

### listBoxUsers: function (boxName, callback)

### getUser: function (userAlias, callback)

### enableUser: function (userAlias, boxName, role, callback)

### registerUser: function (userAlias, displayName, callback)

### getUserRole: function (userAlias, boxName, callback)

### disableUser: function (userAlias, boxName, callback)

### isValid: function (userAlias, callback)

### forgetUser: function (userAlias, callback)

### getOwnedBoxes: function (userAlias, callback)

### getAllowedBoxes: function (userAlias, callback)

### getUserMetadata: function (userAlias, callback)

### setUserMetadata: function (userAlias, metadata, callback)

## Views:

### listViews: function (boxName, callback)

### getView: function (boxName, viewName, callback)

### removeView: function (boxName, viewName, callback)

### saveView: function (boxName, viewName, template, callback)

## Workflows:

### listPastWorkflows: function (boxName, graphId, callback)

### getWorkflowResult: function (boxName, workflowId, callback)

### setWorkflowResult: function (boxName, workflowId, graphId, err, result, callback)

### listRunningWorkflows: function (boxName, callback)

### getActiveConnections: function (workflowId, callback)

### getOutput: function (workflowId, callback)

### saveWorkflowEndDate: function (boxName, workflowId, graphId, callback)

### saveWorkflowStartDate: function (boxName, workflowId, graphId, callback)

### startWorkflow: function (boxName, graphId, params, callback)

### stopWorkflow: function (workflowId, callback)

### listGraphs: function (boxName, callback)

### saveGraph: function (boxName, graph, callback)

### removeGraph: function (boxName, graphId, callback)

### listComponents: function (callback)


