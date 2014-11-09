'use strict';

var wrappedApi = require('./api-wrapper');

/**
 * Application routes
 */
module.exports = function(app, rawApi) {
  var config = rawApi.config,
      express = require('express'),
      env = app.get('env');

  var controllers = require('./controllers')();

  controllers.authentication.install(app, rawApi);

  if (env === 'production') {
    var partialsPath = config.root + '/views/partials';
    console.log(config, partialsPath);
    // Serve partial views in production mode
    app.use('/views/partials', express.static(partialsPath));
  }

  function loginRequired(req, res, next) {
    if (!req.session.user) return res.redirect('/login?returnTo=' + encodeURIComponent(req.originalUrl));
    
    return next();
  }

  app.use('/:boxName', function (req, res, next) {
    var boxName = req.params.boxName;
    
    rawApi.boxes.getBox(boxName, function (err, box) {
      if (!box) {
        // no box, not this handler
        return next();
      } else if (req.originalUrl === '/' + boxName) {
        return res.redirect(req.originalUrl + '/');
      } else {
        return next();
      }
    });
  });
  
  app.use('/:boxName/', function (req, res, next) {
    var boxName = req.params.boxName;

    rawApi.boxes.getBox(boxName, function (err, box) {
      if (!box) {
        // no box, not this handler
        return next();
      } else if (!box.info || !box.info.status) {
        res.status(503);
        return res.redirect('/#/box-inactive/' + encodeURIComponent(boxName));
      } else {
        controllers.authentication.isAllowed(rawApi, req, function (err, isAllowed) {
          if (isAllowed) {
            var boxApp = express();
      
            boxApp.use(function requestApiInjector(req, res, next) {
              req.api = wrappedApi(function () {
                return {
                  userAlias: req.session.user.alias,
                  boxName: boxName
                };
              }, res, rawApi);
              
              next();
            });
            
            return require('origami-app')(boxName, boxApp, function (err) {
              boxApp(req, res, next);
            });
          } else {
            return res.redirect('/login?returnTo=' + encodeURIComponent(req.originalUrl));
          }
        });
      }
    });
  });
  
  app.use('/:boxName/', function (req, res, next) {
    var boxName = req.params.boxName;

    rawApi.boxes.getBox(boxName, function (err, box) {
      if (!box) {
        // no box, not this handler
        return next();
      } else if (!box.info || box.info.status !== true) {
        res.status(503);
        return res.redirect('/#/box-inactive/' + encodeURIComponent(boxName));
      } else if (box.info && box.info.public === true) {
        var boxApp = express();
  
        boxApp.use(function requestApiInjector(req, res, next) {
          req.api = wrappedApi(function () {
            return {
              userAlias: req.session.user.alias,
              boxName: boxName
            };
          }, res, rawApi);
          
          next();
        });
        
        return require('origami-app')(boxName, boxApp, function (err) {
          boxApp(req, res, next);
        });
      } else {
        next();
      }
    });
  });
  
  app.use(function requestApiInjector(req, res, next) {
    req.api = wrappedApi(function () {
      var ctx = {};
      
      if (req.session && req.session.user) ctx.userAlias = req.session.user.alias;
      if (req.params) ctx.boxName = req.params.boxName;
      
      return ctx;
    }, res, rawApi);
    
    next();
  });
  
  app.route('/')
  .get(loginRequired, controllers.misc.index);
  
  app
  .route('/api/data-transfer')
  .post(controllers.dataTransfer.transfer);
  
  app
  .route('/api/my-roles')
  .get(controllers.users.getMyRoles);
  
  app
  .route('/api/my-boxes')
  .get(controllers.users.getMyBoxes);
  
  app
  .route('/api/box/:boxName/destroy-collection/:collectionName')
  .post(controllers.boxes.destroyCollection);

  // Server API Routes
  app
  .route('/api/users')
  .get(controllers.users.listUsers);

  app
  .route('/api/users/:userAlias')
  .get(controllers.users.getUser);

  app
  .route('/api/randomName')
  .get(controllers.misc.randomName);

  app
  .route('/api/master-user')
  .get(controllers.misc.getMasterUser);

  app
  .route('/api/master-user')
  .put(controllers.misc.setMasterUser);

  app
  .route('/scripts/info.js')
  .get(controllers.config.infoScript);

  app
  .route('/api/boxes')
  .get(controllers.boxes.listBoxes);

  app
  .route('/api/box/:boxName/info')
  .get(controllers.boxes.getBoxInfo);

  app
  .route('/api/box/:boxName/access')
  .get(controllers.boxes.getBoxAccess);

  app
  .route('/api/box/:boxName/export')
  .get(controllers.boxes.exportBox);

  app
  .route('/api/box/:boxName/import')
  .post(controllers.boxes.importBox);

  app
  .route('/api/box/:boxName/createCollection')
  .post(controllers.boxes.createCollection);

  app
  .route('/api/box/:boxName/packages')
  .get(controllers.packages.listActivePackages);

  app
  .route('/api/box/:boxName/permissionGroup')
  .get(controllers.permissions.listPermissionGroups);

  app
  .route('/api/box/:boxName/permissionGroup')
  .post(controllers.permissions.createPermissionGroup);

  app
  .route('/api/box/:boxName/permissionGroup/:groupId')
  .get(controllers.permissions.describePermissionGroup);

  app
  .route('/api/box/:boxName/permissionGroup/:groupId')
  .put(controllers.permissions.modifyPermissionGroup);

  app
  .route('/api/box/:boxName/permissionGroup/:groupId')
  .delete(controllers.permissions.deletePermissionGroup);

  app
  .route('/api/box/:boxName/permissionGroup/:groupId/users')
  .get(controllers.permissions.listUsersInGroup);

  app
  .route('/api/box/:boxName/permissionGroup/:groupId/users/:alias')
  .post(controllers.permissions.addUserToGroup);

  app
  .route('/api/box/:boxName/permissionGroup/:groupId/users/:alias')
  .delete(controllers.permissions.removeUserFromGroup);

  app
  .route('/api/box/:boxName/packages/resort')
  .post(controllers.packages.resortPackages);

  app
  .route('/api/box/:boxName/packages/:package/activate')
  .post(controllers.packages.activatePackage);

  app
  .route('/api/box/:boxName/packages/:package/deactivate')
  .post(controllers.packages.deactivatePackage);

  app
  .route('/api/box/:boxName/info')
  .post(controllers.boxes.saveBoxInfo);

  app
  .route('/api/isNameFree/:boxName')
  .get(controllers.boxes.isNameFree);

  app
  .route('/api/box/:boxName/views')
  .get(controllers.views.getViews);

  app
  .route('/api/box/:boxName/graphs')
  .get(controllers.workflows.listGraphs);

  app
  .route('/api/createBox/:boxName')
  .post(controllers.boxes.createBox);

  app
  .route('/api/box/:boxName/users/:userAlias')
  .post(controllers.users.setRole);

  app
  .route('/api/box/:boxName/users/:alias')
  .get(controllers.permissions.getUserEffectivePermissions);

  app
  .route('/api/box/:boxName/users')
  .get(controllers.boxes.listBoxUsers);

  app
  .route('/api/box/:boxName/stats/usage')
  .post(controllers.boxes.getUsageStatistics);

  app
  .route('/api/box/:boxName/stats/errors')
  .post(controllers.boxes.getErrorStatistics);

  app
  .route('/api/box/:boxName/packagesWithDeps')
  .get(controllers.boxes.getActivePackagesWithDependencies);

  app
  .route('/api/box/:boxName/remoteDbs')
  .get(controllers.boxes.listRemoteDbs);

  app
  .route('/api/box/:boxName/remoteDbs')
  .post(controllers.boxes.setRemoteDb);

  app
  .route('/api/packages')
  .get(controllers.packages.listPackages);

  app
  .route('/api/rebuild-manifests')
  .post(controllers.packages.rebuildManifests);

  app
  .route('/api/packages/:packageName/create')
  .post(controllers.packages.createPackage);

  app
  .route('/api/packages/:packageName/info')
  .get(controllers.packages.getPackageInfo);

  app
  .route('/api/packages/:packageName/info')
  .put(controllers.packages.setPackageInfo);

  app
  .route('/api/packages/:packageName/owner')
  .get(controllers.packages.getPackageOwner);

  app
  .route('/api/packages/:packageName/delete')
  .post(controllers.packages.removePackage);

  app.route('/api/packages/:packageName/assets')
  .get(controllers.packages.listAssets);

  app.route('/api/packages/:packageName/new-blank-asset/:path*')
  .post(controllers.packages.newBlankAsset);

  app.route('/api/packages/:packageName/folders')
  .get(controllers.packages.listFolders);

  var formidable = require('formidable');
  
  app
  .route('/api/packages/:packageName/create-folder/:path*')
  .post(controllers.packages.createFolder);
  
  app
  .route('/api/packages/:packageName/remove-folder/:path*')
  .post(controllers.packages.removeFolder);
  
  app
  .route('/api/packages/:packageName/assets/:path*')
  .post(controllers.packages.uploadAsset);

  app
  .route('/api/packages/:packageName/scripts')
  .get(controllers.packages.listScripts);
  app
  .route('/api/packages/:packageName/export')
  .get(controllers.packages.exportPackage);
  
  app
  .route('/api/export/all-packages')
  .get(controllers.misc.exportAllPackages);
  
  app
  .route('/api/export/all-boxes')
  .get(controllers.misc.exportAllBoxes);

  app
  .route('/api/packages/:packageName/scripts')
  .post(controllers.packages.setScripts);

  app
  .route('/api/packages/:packageName/package-type')
  .get(controllers.packages.getPackageType);

  app
  .route('/api/packages/:packageName/package-type')
  .post(controllers.packages.setPackageType);

  app
  .route('/api/packages/:packageName/dependencies')
  .get(controllers.packages.getDependencies);

  app
  .route('/api/packages/:packageName/dependencies')
  .post(controllers.packages.setDependencies);

  app
  .route('/api/packages/import')
  .post(controllers.packages.importPackages);

  app
  .route('/api/packages/:packageName/angular-modules')
  .get(controllers.packages.listAngularModules);

  app
  .route('/api/packages/:packageName/angular-modules')
  .post(controllers.packages.setAngularModules);

  app
  .route('/api/packages/:packageName/styles')
  .get(controllers.packages.listStyles);

  app
  .route('/api/packages/:packageName/styles')
  .post(controllers.packages.setStyles);

  app.route('/api/packages/:packageName/assets/:path*')
  .get(controllers.packages.serveAsset);
  
  app
  .route('/api/packages/:packageName/asset-metadata/:assetName*')
  .get(controllers.packages.getAssetMetadata);
  
  app
  .route('/api/packages/:packageName/asset-metadata/:assetName*')
  .post(controllers.packages.setAssetMetadata);
  
  app
  .route('/api/packages/:packageName/unzip-asset/:assetName*')
  .post(controllers.packages.unzipAsset);

  app
  .route('/api/packages/:packageName/remove-asset/:filename*')
  .post(controllers.packages.removeAsset);
  
  
  app.use('/api/box-api/:boxName', function (req, res, next) {
    var boxName = req.params.boxName, boxApi = require('origami-app/boxApiHandlers')(boxName);
    
    var apiApp = express();
  
    apiApp.use(function (req, res, next) {
      req.api = wrappedApi(function () {
        var ctx = {};
        
        if (req.session && req.session.user) ctx.userAlias = req.session.user.alias;
        ctx.boxName = boxName;
        
        return ctx;
      }, res, rawApi);
      
      next();
    });        
    
    apiApp.get('/collections', boxApi.getCollections);
    apiApp.post('/collection/:collection/find', boxApi.findInCollection);
    apiApp.post('/collection/:collection/count', boxApi.countInCollection);
    apiApp.post('/collection/:collection/findOne', boxApi.findOneInCollection);
    apiApp.post('/collection/:collection/insert', boxApi.insertInCollection);
    apiApp.post('/collection/:collection/update', boxApi.updateInCollection);
    apiApp.post('/collection/:collection/remove', boxApi.removeInCollection);
    
    return apiApp(req, res, next);
  });  

  // All undefined api routes should return a 404
  app.route('/api/*')
  .get(function(req, res) {
    res.send(404);
  });

  // Box controller
};
