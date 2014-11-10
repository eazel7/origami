module.exports = function () {
  var fs = require('fs'),
      formidable = require('formidable'),
      resErrHelper = require('./resErrHelper'),
      async = require('async');
  
  return {
    listPackages: function (req, res) {
      var api = req.api;
      
      api.packages.listPackages(function (err, packages) {
        if (err) {
          console.error(err);
          res.status(418);
          return res.end();
        }
      
        res.json(packages);
      });
    },
    createPackage: function (req, res) {
      var api = req.api;
      
      api.packages.createPackage(req.params.packageName, function (err) {
        if (err) {
          console.error(err);
          res.status(418);
          return res.end();
        }
        
        api.packages.setPackageOwner(req.params.packageName, req.session.user.alias, function (err) {
          if (err) console.log(err);

          res.status(err ? 418 : 200);
          res.end();
        });
      });
    },
    removeFolder: function (req, res) {
      var api = req.api;
      
      var path = req.params.path;
      if (req.params[0]) path = path + req.params[0];
      
      api.packages.removeFolder(req.params.packageName, path, function (err) {
        if (err) console.error(err);
        res.status(err ? 418 : 200);
        res.end();
      });
    },
    uploadAsset: function (req, res) {
      var api = req.api;
      
      var form = new formidable.IncomingForm();
      form.parse(req, function (err, fields, files) {
        async.each(Object.keys(files), function (fileEntry, callback) {
          var file = files[fileEntry],
              filename = req.params.path + (req.params[0] ? req.params[0] : '');
              
          var bytes = fs.readFileSync(file.path);
          
          api.packages.createAsset(req.params.packageName, filename, function (err) {
            api.packages.updateAsset(req.params.packageName, filename, bytes, callback);
          });
        }, function (err) {
          async.each(Object.keys(fields), function (fileEntry, callback) {
            var filename = fileEntry;
                
            var bytes = new Buffer(fields[fileEntry]);
            
            api.packages.createAsset(req.params.packageName, filename, function (err) {
              api.packages.updateAsset(req.params.packageName, filename, bytes, callback);
            });
          }, function (err) {
            res.status(200);
            res.end();        
          });
        });
      });
    },
    removeAsset: function (req, res) {
      var api = req.api;
      
      api.packages.removeAsset(req.params.packageName, req.params.filename, function (err) {
        if (err) console.error(err);
        
        res.status(err ? 418 : 200);
        res.end();
      });
    },
    createFolder: function (req, res) {
      var api = req.api;
      
      api.packages.createFolder(req.params.packageName, req.params.path, function (err) {
        if (err) console.error(err);
        res.status(err ? 418 : 200);
        res.end();
      });
    },
    listFolders: function (req, res) {
      var api = req.api;
      
      api.packages.listFolders(req.params.packageName, function (err, folders) {
        if (err) {
          console.error(err);
          res.status(418);
          return res.end();
        }
        
        res.json(folders);
      });
    },
    removePackage: function (req, res) {
      var api = req.api;
      
      api.packages.removePackage(req.params.packageName, function (err) {
        if (err) console.error(err);
        res.status(err ? 418 : 200);
        res.end();
      });
    },
    serveAsset: function (req, res) {
      var api = req.api;
      
      var path = req.params.path;
      if (req.params[0]) path = path + req.params[0];
      
      api.packages.getAsset(req.params.packageName, path, function (err, buffer) {
        if (err) { res.status(418); return res.end('Not found: ' + JSON.stringify(path)); }
        
        res.status(200);
        
        api.packages.getAssetMetadata(req.params.packageName, path, function (err, metadata) {
          if (metadata.use == 'style') {
            res.set({
              'Content-Type': 'text/css'
            });
          } else if (metadata.use == 'script') {
            res.set({
              'Content-Type': 'application/javascript;charset=utf-8'
            });
          }
                
          res.end(buffer);
        });
      });
    },
    listAssets: function (req, res) {
      var api = req.api;
      
      api.packages.listAssets(req.params.packageName, function (err, assets) {
        res.json(assets);
      });
    },
    getAssetMetadata: function (req, res) {
      var api = req.api;
      
      api.packages.getAssetMetadata(req.params.packageName, req.params.assetName, function (err, metadata) {
        res.json(metadata);
      });
    },
    setAssetMetadata: function (req, res) {
      var api = req.api;
      
      api.packages.setAssetMetadata(req.params.packageName, req.params.assetName, req.body, function (err) {
        res.status(err ? 418 : 200);
        res.end();
      });
    },
    listActivePackages: function (req, res) {
      var api = req.api;
      
      api.packages.getActivePackages(req.params.boxName, function (err, packages) {
        if (err) {
          res.status(418);
          return res.end();
        }
        
        res.json(packages);
      });
    },
    resortPackages: function (req, res) {
      var api = req.api;
      
      api.packages.setActivePackages(req.params.boxName, req.body, function (err) {
        res.status(err ? 418 : 200);
        res.end();
      });
    },
    activatePackage: function (req, res) {
      var api = req.api;
      
      api.packages.activatePackage(req.params.boxName, req.params.package, function (err) {
        res.status(err ? 418 : 200);
        res.end();
      });
    },
    deactivatePackage: function (req, res) {
      var api = req.api;
      
      api.packages.deactivatePackage(req.params.boxName, req.params.package, function (err) {
        res.status(err ? 418 : 200);
        res.end();
      });
    },
    listScripts: function (req, res) {
      var api = req.api;
      
      api.packages.listScripts(req.params.packageName, function (err, scripts) {
        if (err) {
          console.error(err);
          
          res.status(418);
          return res.end();
        }
        
        res.json(scripts);
      });
    },
    listStyles: function (req, res) {
      var api = req.api;
      
      api.packages.listStyles(req.params.packageName, function (err, styles) {
        if (err) {
          console.error(err);
          
          res.status(418);
          return res.end();
        }
        
        res.json(styles);
      });
    },
    setScripts: function (req, res) {
      var api = req.api;
      
      api.packages.setScripts(req.params.packageName, req.body, function (err) {
        if (err) console.error(err);
          
        res.status(err ? 418 : 200);
        return res.end();
      });
    },
    listAngularModules: function (req, res) {
      var api = req.api;
      
      api.packages.listAngularModules(req.params.packageName, function (err, modules) {
        if (err) {
          console.error(err);
          
          res.status(418);
          return res.end();
        }
        
        res.json(modules);
      });
    },
    setAngularModules: function (req, res) {
      var api = req.api;
      
      api.packages.setAngularModules(req.params.packageName, req.body, function (err) {
        if (err) console.error(err);
          
        res.status(err ? 418 : 200);
        return res.end();
      });
    },
    setStyles: function (req, res) {
      var api = req.api;
      
      api.packages.setStyles(req.params.packageName, req.body, function (err) {
        if (err) console.error(err);
          
        res.status(err ? 418 : 200);
        return res.end();
      });
    },
    unzipAsset: function (req, res) {
      var api = req.api;
      
      var path = req.params.assetName;
      if (req.params[0]) path = path + req.params[0];
      
      api.packages.unzipAsset(req.params.packageName, path, function (err) {
        if (err) console.error(err);
          
        res.status(err ? 418 : 200);
        return res.end();
      });
    },
    exportPackage: function (req, res) {
      var api = req.api;
      
      api.packages.exportPackage(req.params.packageName, function (err, exported) {
        if (err) {
          console.error(err);
          
          res.status(418);
          return res.end();
        }

        res.set('Content-Type', 'application/zip, application/octet-stream');
        res.set('Content-Disposition', 'attachment; filename=' + req.params.packageName + '.pack');
        res.send(exported);
        res.end();
      });
    },
    importPackages: function (req, res) {
      var api = req.api;
      
      var form = new formidable.IncomingForm();
      
      form.parse(req, function (err, fields, files) {
        async.each(Object.keys(files), function (fileEntry, callback) {
          var file = files[fileEntry],
              filename = req.params.path + (req.params[0] ? req.params[0] : '');
              
          var bytes = fs.readFileSync(file.path);
          
          api.packages.importPackage(bytes, callback);
        }, function (err) {
          if (err) console.log(err);
          res.status(err ? 418 : 200);
          res.end();        
        });
      });
    },
    getPackageType: function (req, res) {
      var api = req.api;
      
      api.packages.getPackageType(req.params.packageName, function (err, type) {
        if (err) {
          console.error(err);
          res.status(418);
          return res.end();
        }
        res.json({
          type: type
        });
      });
    },
    setPackageType: function (req, res) {
      var api = req.api;
      
      api.packages.setPackageType(req.params.packageName, req.body.type, function (err) {
        if (err) {
          console.error(err);
          res.status(418);
        } else {
          res.status(200);
        }
        
        res.end();
      });
    },
    getPackageOwner: function (req, res) {
      var api = req.api;
      
      api.packages.getPackageOwner(req.params.packageName, function (err, owner) {
        if (err) {
          console.error(err);
          res.status(418);
          return res.end();
        }
        res.json({
          owner: owner
        });
      });
    },
    setPackageOwner: function (req, res) {
      var api = req.api;
      
      api.packages.setPackageOwner(req.params.packageName, req.body.owner, function (err) {
        if (err) {
          console.error(err);
          res.status(418);
        } else {
          res.status(200);
        }
        
        res.end();
      });
    },
    getDependencies: function (req, res) {
      var api = req.api;
      
      api.packages.getDependencies(req.params.packageName, function (err, deps) {
        if (err) {
          console.error(err);
          res.status(418);
        
          res.end();
        } else {
          res.json(deps);
        }
      });
    },
    setDependencies: function (req, res) {
      var api = req.api;
      
      api.packages.setDependencies(req.params.packageName, req.body, function (err) {
        if (err) {
          console.error(err);
          res.status(418);
        } else {
          res.status(200);
        }
        res.end();
      });
    },
    newBlankAsset: function (req, res) {
      var api = req.api;
      
      var path = req.params.path;
      if (req.params[0]) path = path + req.params[0];
      
      if (!path) {
        return resErrHelper(res, new Error('no file name given'));
      }
 
      async.series([function (callback) {
        api.packages.createAsset(req.params.packageName, path, callback, true);
      }, function (callback) {
        api.packages.updateAsset(req.params.packageName, path, new Buffer(''), callback, true);
      }], function (err) {
        if (err) return resErrHelper(res, err);
        
        res.status(200);
        res.end();
      });
    },
    getPackageInfo: function (req, res) {
     var api = req.api;
      
     api.packages.getPackageInfo(req.params.packageName, function (err, info) {
        if (err) return resErrHelper(res, err);
        
        res.json(info);
      });
    },
    setPackageInfo: function (req, res) {
      var api = req.api;
      
      api.packages.setPackageInfo(req.params.packageName, req.body, function (err) {
        if (err) return resErrHelper(res, err);
      
        res.status(200);
        res.end();
      });
    },
    rebuildManifests: function (req, res) {
      var api = req.api;
      
      api.packages.rebuildManifests(function (err) {
        if (err) return resErrHelper(res, err);
      
        res.status(200);
        res.end();
      });
    }
  };
}
