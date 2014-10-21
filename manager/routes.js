'use strict';

/**
 * Application routes
 */
module.exports = function(app, api) {
  var config = api.config,
      express = require('express'),
      env = app.get('env');

  var controllers = require('./controllers')(api);

  controllers.authentication.install(app);

  if (env === 'production') {
    var partialsPath = config.root + '/views/partials';
    console.log(config, partialsPath);
    // Serve partial views in production mode
    app.use('/views/partials', express.static(partialsPath));
  }

  app.route('/')
  .get(controllers.misc.index);
  
  app
  .route('/api/data-transfer')
  .post(controllers.dataTransfer.transfer);
  
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
  .route('/api/masterUser')
  .get(controllers.misc.masterUser);

  app
  .route('/scripts/info.js')
  .get(controllers.config.infoScript);

  app
  .route('/api/boxes')
  .get(controllers.boxes.listBoxes);

  app.use('/api/box/:boxName', function (req, res, next) {
    controllers.authentication.isAllowed(req, function (err, isAllowed) {
      if (isAllowed) return next();

      res.status(400);
      return res.end();
    });
  });
  app
  .route('/api/box/:boxName/info')
  .get(controllers.boxes.getBoxInfo);

  app
  .route('/api/box/:boxName/access')
  .get(controllers.boxes.getBoxAccess);

  app
  .route('/api/box/:boxName/createCollection')
  .post(controllers.boxes.createCollection);

  app
  .route('/api/box/:boxName/packages')
  .get(controllers.packages.listActivePackages);

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
  .route('/api/createBox/:boxName')
  .post(controllers.boxes.createBox);

  app
  .route('/api/box/:boxName/users/:userAlias')
  .post(controllers.users.setRole);

  app
  .route('/api/box/:boxName/users')
  .get(controllers.boxes.listBoxUsers);

  app
  .route('/api/box/:boxName/packagesWithDeps')
  .get(controllers.boxes.getActivePackagesWithDependencies);

  app
  .route('/api/packages')
  .get(controllers.packages.listPackages);

  app
  .route('/api/packages/:packageName/create')
  .post(controllers.packages.createPackage);

  app
  .route('/api/packages/:packageName/delete')
  .post(controllers.packages.removePackage);

  app.route('/api/packages/:packageName/assets')
  .get(controllers.packages.listAssets);

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

  // All undefined api routes should return a 404
  app.route('/api/*')
    .get(function(req, res) {
      res.send(404);
    });

  // Box controller

  var boxCtrl = require('origami-app')(api);

  app.use('/:boxName', function (req, res, next) {
  var boxName = req.params.boxName;
    api.boxes.getBox(boxName, function (err, box) {
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

    api.boxes.getBox(boxName, function (err, box) {
      if (!box) {
        // no box, not this handler
        return next();
      } else {
        controllers.authentication.isAllowed(req, function (err, isAllowed) {
          if (isAllowed) {
            return boxCtrl(boxName, function (err, app) {
              app(req, res, next);
            });
          } else {
            return res.redirect('/login?returnTo=' + encodeURIComponent(req.originalUrl));
          }
        });
      }
    });
  });
};
