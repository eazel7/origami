module.exports = function (config, callback) {
  var Grid = require('mongodb').Grid,
      async = require('async'),
      path = require('path');
      
  function createManifest(allAssets) {
    return 'CACHE MANIFEST\n#' +
           + String(new Date().valueOf()) + '\n\n' +
           allAssets
           .join('\n') + '\n\n' +
           '/api/identity\n' +
           'scripts/info.js\n' +
           'scripts.json\n' +
           'styles.json\n' +
           'angular-modules.json\n' +
           '/socket.io/socket.io.js\n' +
           'NETWORK:\n' +
           '*';
  }
  
  require('./connect')(config.mongo, function (err, db) {
    function updateBoxesManifest(boxDependencyResolver, callback) {

        db.collection("boxes")
        .find({})
        .toArray(function (err, affectedBoxes) {
          if (err) {
            console.error(err);
            return callback(err);
          }
          
          var boxes = [];
          
          for (var i = 0; i < affectedBoxes.length; i++) boxes.push(affectedBoxes[i]);
          
          async.eachSeries(affectedBoxes, function (box, callback) {
            var allAssets = [],
                allScripts = [],
                allStyles = [],
                allAngularModules = [];
            
            boxDependencyResolver(box.name, function (err, activePackages) {
              async.eachSeries(activePackages || [], function (packageName, callback) {
                db
                .collection('packages')
                .findOne({
                  name: packageName
                }, function (err, doc) {
                  if (!doc) {
                    console.error("Skip missing package " + packageName);
                    return callback();
                  }
                
                  var paths = [];
                  if (doc.angularModules) {
                    for (var i = 0; i < doc.angularModules.length; i++) {
                      if (allAngularModules.indexOf(doc.angularModules[i]) === -1) {
                        allAngularModules.push(doc.angularModules[i]);
                      }
                    }
                  }
                  
                  if (doc && doc.scripts) {
                    for (var i = 0; i < doc.scripts.length; i++) {
                      if (doc.packageType !== 'local') {
                        allScripts.push("/api/packages/" + packageName + "/assets/" + doc.scripts[i]);
                      } else {
                        allScripts.push(doc.scripts[i]);
                      }
                    }
                  }
                  
                  if (doc && doc.styles) {
                    for (var i = 0; i < doc.styles.length; i++) {
                      if (doc.packageType !== 'local') {
                        allStyles.push("/api/packages/" + packageName + "/assets/" + doc.styles[i]);
                      } else {
                        allStyles.push(doc.styles[i]);
                      }
                    }
                  }
                  
                  db.collection("package_assets.files")
                  .find({
                    'metadata.package': packageName,
                    'metadata.use': {
                      $ne: null
                    }
                  })
                  .toArray(function (err, docs) {
                    if (err) return callback (err);
                    
                    for (var i = 0; i < docs.length; i++) {
                      if (doc.packageType !== 'local') {
                        allAssets.push("/api/packages/" + packageName + "/assets/" + docs[i].metadata.path);
                      } else {
                        allAssets.push(docs[i].metadata.path);
                      }
                    }
                    
                    callback();
                  });
                });
              }, function (err) {
                if (err) return callback(err);
                
                db.collection('boxes')
                .update({
                  name: box.name
                }, {
                  $set: {
                    "manifest": createManifest(allAssets),
                    "styles": allStyles,
                    "scripts": allScripts,
                    "angularModules": allAngularModules
                  }
                }, { w: 1 }, function (err) {
                  callback(err);
                });
            });
          });
        }, callback);
      });
    }
  
    var self = {
      getActivePackagesWithDependencies: function (boxName, callback) {
        self.getActivePackages(boxName, function (err, activePackages) {
          if (err) return callback (err);
          
          require('./dependencies')(boxName, function (depName, callback) {
            if (depName === boxName) return callback (null, activePackages);
            
            self.getDependencies(depName, callback);
          }, function (err, deps) {
            if (err) return callback(err);
          
            deps.splice(deps.indexOf(boxName), 1);
            callback (err, deps);
          });
        });
      },
      getDependencies: function (packageName, callback) {
        db.collection("packages").findOne({
          name: packageName
        }, function (err, doc){ 
          if (err) return callback (err);
          if (!doc) return callback ('No pacakge');
          
          callback (null, doc.dependencies || []);
        });
      },
      setDependencies: function (packageName, dependencies, callback, silent) {
        console.log(arguments)
        db.collection("packages").update({
          name: packageName
        }, {
          $set: {
            dependencies: dependencies
          }
        }, {w: 1}, function (err) {
          if (err) callback (err);
          
          if (!silent) updateBoxesManifest(self.getActivePackagesWithDependencies, function (err) {
            console.log(err);
            callback(err);
          });
          else callback ();
        });
      },
      getPackageType: function (packageName, callback) {
        db.collection("packages").findOne({
          name: packageName
        }, function (err, doc){ 
          if (err) return callback (err);
          if (!doc) return callback ('No pacakge');
          
          callback (null, doc.packageType || 'global');
        });
      },
      setPackageType: function (packageName, packageType, callback, silent) {
        db.collection("packages").update({
          name: packageName
        }, {
          $set: {
            packageType: packageType || 'global'
          }
        },  {w: 1}, function (err) {
          if (err) return callback(err);
          
          if (silent) updateBoxesManifest(self.getActivePackagesWithDependencies, callback);
          else callback ();
        });
      },
      getActivePackages: function (boxName, callback) {
        db.collection("boxes")
        .findOne({
          name: boxName
        }, function (err, doc) {
          if (err) return callback(err);
          
          return callback (null, doc.packages || []);
        });
      },
      removeFolder: function (packageName, folder, callback) {
        db.collection("packages")
        .update({
          name: packageName
        }, {
          $pull: {
            folders: folder
          }
        },  {w: 1}, callback);
      },
      setActivePackages: function (boxName, packages, callback) {
        db.collection("boxes")
        .update({
          name: boxName
        }, {
          $set: {
            'packages': packages
          }
        },  {w: 1}, function (err) {
          if (err) return callback(err);
          
          updateBoxesManifest(self.getActivePackagesWithDependencies, callback);
        });
      },
      activatePackage: function (boxName, package, callback) {
        db.collection("boxes")
        .update({
          name: boxName
        }, {
          $addToSet: {
            packages: package
          }
        }, function (err) {
          if (err) return callback(err);
          
          updateBoxesManifest(self.getActivePackagesWithDependencies, callback);
        });
      },
      deactivatePackage: function (boxName, package, callback) {
        db.collection("boxes")
        .update({
          name: boxName
        }, {
          $pull: {
            packages: package
          }
        },  {w: 1}, function (err) {
          if (err) return callback(err);
          
          updateBoxesManifest(self.getActivePackagesWithDependencies, callback);
        });
      },
      listPackages: function(callback) {
        db.collection("packages").find({}, {_id: 0}).toArray(callback);
      },
      createFolder: function (packageName, folderName, callback) {
        db.collection("packages").update({
          name: packageName
        }, {
          $addToSet: {
            folders: folderName
          }
        }, {w: 1}, callback);
      },
      listFolders: function (packageName, callback) {
        db.collection("packages").findOne({
          name: packageName
        }, function (err, doc) {
          if (err) return callback(err);
          if (!doc) return callback('No package');
          
          
          return callback (null, doc.folders || []);
        });
      },
      createPackage: function(name, callback) {
        debugger;
        db.collection("packages").count({
          name: name
        }, function (err, count) {
          if (err) return callback (err);
          
          if (count === 0) {
            db.collection("packages").insert({
              name: name,
              files: []
            }, {w: 1}, callback);
          } else {
            callback ();
          }
        });
      },
      removePackage: function(packageName, callback) {
        self.listAssets(packageName, function (err, assets) {
          if (err) return callback (err);
          
          async
          .each(assets, function (asset, assetCallback) {
            self.removeAsset(packageName, asset, assetCallback);
          }, function (err) {
            if (err) return callback (err);
            
            db.collection("packages").remove({
              name: packageName
            },  {j: 1}, function (err) {
              if (err) return callback(err);
              
              db
              .collection("boxes")
              .update({          
              }, {
                $pull: {
                  "packages": packageName
                }
              }, {j: 1}, function (err) {
                if (err) return callback (err);
                  
                updateBoxesManifest(self.getActivePackagesWithDependencies, callback);
              });
            });
          });
        });
      },
      listAssets: function(packageName, callback) {
        db.collection("packages").findOne({name: packageName}, function (err, doc) {
          if (!doc) return callback(null, []);
          callback(err, doc.files);
        });
      },
      createAsset: function(packageName, assetPath, callback, silent) {
        db.collection("packages").update({name: packageName}, {$addToSet: {"files": assetPath}},  {w: 1}, function (err) {
          if (err) return callback(err);
          
          if (!silent) updateBoxesManifest(self.getActivePackagesWithDependencies, callback);
          else callback ();
        });
      },
      updateAsset: function(packageName, assetPath, bytes, callback, silent) {      
        db.collection("package_assets.files").findOne({
          "metadata.package": packageName,
          "metadata.path": assetPath
        }, function (err, doc) {
          if (err) return callback (err);
          
          var grid = new Grid(db, "package_assets");
          
          function done(err) {
            if (err) return callback(err);
          
            if (!silent) updateBoxesManifest(self.getActivePackagesWithDependencies, callback);
            else callback();
          }
          
          if (doc) {
            grid.delete(doc._id, function (err) {
              if (err) {
                return callback (err);
              }
              
              grid.put(bytes, {metadata: doc.metadata}, done);
            });
          } else {
            grid.put(bytes, {metadata: {"package": packageName, path: assetPath}}, done);
          }
        });
      },
      removeAsset: function(packageName, assetPath, callback) {
        db.collection("package_assets.files").findOne({
          "metadata": {
            "package": packageName,
            "path": assetPath
          }
        }, function (err, doc) {
          var grid = new Grid(db, "package_assets");
          function done(err) {
            db.collection("packages").update({
              "name": packageName
            }, {
              "$pull": {
                "files": assetPath
              }
            },  {w: 1}, function (err) {
              if (err) return callback(err);
              
              updateBoxesManifest(self.getActivePackagesWithDependencies, callback);
            });
          }
          
          if (doc) {
            grid.delete(doc._id, done);
          } else {
            done();
          }
        });
      },
      getAsset: function(packageName, assetPath, callback) {
        var grid = new Grid(db, "package_assets");
        db.collection("package_assets.files").findOne({
          'metadata.package': packageName,
          'metadata.path': assetPath
        }, function (err, doc) {
          if (doc) {
            grid.get(doc._id, callback);
          } else {
            callback('Asset does not exists');
          }
        });
      },
      listScripts: function (packageName, callback) {
        db.collection("packages").findOne({
          name: packageName
        }, function (err, doc){ 
          if (err) return callback (err);
          if (!doc) return callback ('No pacakge');
          
          callback (null, doc.scripts || []);
        });
      },
      listStyles: function (packageName, callback) {
        db.collection("packages").findOne({
          name: packageName
        }, function (err, doc){ 
          if (err) return callback (err);
          if (!doc) return callback ('No pacakge');
          
          callback (null, doc.styles || []);
        });
      },
      listAngularModules: function (packageName, callback) {
        db.collection("packages").findOne({
          name: packageName
        }, function (err, doc){ 
          if (err) return callback (err);
          if (!doc) return callback ('No pacakge');
          
          callback (null, doc.angularModules || []);
        });
      },
      setAngularModules: function (packageName, angularModules, callback, silent) {
        db.collection("packages").update({
          name: packageName
        }, {
          $set: {
            angularModules: angularModules
          }
        },  {w: 1}, function (err) {
          if (err) return callback (err);
          
          if (!silent) updateBoxesManifest(self.getActivePackagesWithDependencies, callback);
          else callback();
        });
      },
      setStyles: function (packageName, styles, callback, silent) {
        db.collection("packages").update({
          name: packageName
        }, {
          $set: {
            styles: styles
          }
        },  {w: 1}, function (err) {
          if (err) return callback (err);
          
          if (!silent) updateBoxesManifest(self.getActivePackagesWithDependencies, callback);
          else callback();
        });
      },
      setScripts: function (packageName, scripts, callback, silent) {
        db.collection("packages").update({
          name: packageName
        }, {
          $set: {
            scripts: scripts
          }
        },  {w: 1}, function (err) {
          if (err) return callback (err);
          
          if (!silent) updateBoxesManifest(self.getActivePackagesWithDependencies, callback);
          else callback();
        });
      },
      getAssetMetadata: function(packageName, assetPath, callback) {
        var grid = new Grid(db, "package_assets");
        db.collection("package_assets.files").findOne({
          "metadata.package": packageName,
          "metadata.path": assetPath
        }, function (err, doc) {
          callback(err, doc ? doc.metadata : undefined);
        });
      },
      unzipAsset: function(packageName, assetPath, callback) {
        self.getAsset(packageName, assetPath, function (err, zipBuffer) {
          if (err) return callback (err);
          
          var AdmZip = require('adm-zip');
          var zip = new AdmZip (zipBuffer);
          
          async.each(zip.getEntries(), function (entry, entryCallback) {
            if (entry.isDirectory) return entryCallback();
            
            var entryBuffer = zip.readFile(entry);
            
            self.createAsset(packageName, entry.entryName, function (err) {
              if (err) return entryCallback(err);
              
              self.updateAsset(packageName, entry.entryName, entryBuffer, function (err) {
                if (err) return entryCallback(err);
                
                if (path.dirname(entry.entryName) !== '.') {
                  self.createFolder(packageName, path.dirname(entry.entryName), entryCallback);
                }
              });
            });
          }, function (err) {
            if (err) return callback (err);
            
            updateBoxesManifest(self.getActivePackagesWithDependencies, callback);
          });
        });
      },
      importPackage: function(zippedBuffer, importCallback) {
        var ZipFile = require("adm-zip/zipFile"),
            AdmZipUtil = require("adm-zip/util");
        
        var zip = new ZipFile (zippedBuffer, AdmZipUtil.Constants.BUFFER);
        
        var packageName = zip.getEntry("packageName.txt").getData().toString(),
            packageType = zip.getEntry("packageType.txt").getData().toString(),
            styles = JSON.parse(zip.getEntry("styles.json").getData().toString()),
            scripts = JSON.parse(zip.getEntry("scripts.json").getData().toString()),
            folders = JSON.parse(zip.getEntry("folders.json").getData().toString()),
            dependencies = JSON.parse(zip.getEntry("dependencies.json").getData().toString()),
            angularModules = JSON.parse(zip.getEntry("angular-modules.json").getData().toString()),
            mergedMetadata = JSON.parse(zip.getEntry("metadata.json").getData().toString());
        
        async.series([function (callback) {
          self.createPackage(packageName, callback);
        }, function (callback) {
          async.eachSeries(folders, function (folder, folderCallback) {
            self.createFolder(packageName, folder, folderCallback);
          }, callback);
        }, function (callback) {
          self.setStyles(packageName, styles, callback, true);
        }, function (callback) {
          self.setAngularModules(packageName, angularModules, callback, true);
        }, function (callback) {
          self.setScripts(packageName, scripts, callback, true);
        }, function (callback) {
          var entries = zip.entries;
          
          async.eachSeries(entries, function (entry, entryCallback) {
            if (entry.entryName.indexOf('assets/') !== 0) return entryCallback();
          
            var entryBuffer = entry.getData(),
                assetPath = entry.entryName.slice("assets/".length),
                entryMetadata = mergedMetadata[assetPath];
                
            self.createAsset(packageName, assetPath, function (err) {
              if (err) {
                return entryCallback(err);
              } else {
                self.updateAsset(packageName, assetPath, entryBuffer, function (err) {
                  if (err) {
                    return entryCallback(err);
                  } else {
                    self.setAssetMetadata(packageName, assetPath, entryMetadata, entryCallback, true);
                  }
                }, true);
              }
            }, true);
          }, function (err) {
            callback(err);
          });
        }, function (callback) {
          self.setPackageType(packageName, packageType, callback, true);
        }, function (callback) {
          self.setDependencies(packageName, dependencies, callback, true);
        }, function (callback) {
          updateBoxesManifest(self.getActivePackagesWithDependencies, callback);
        }], importCallback);
      },
      setAssetMetadata: function(packageName, assetPath, newMetadata, callback, silent) {
        self.getAssetMetadata (packageName, assetPath, function (err, metadata) {
          if (err) return callback (err);
          
          var replacement = {
            $set: {
              "metadata": metadata
            }
          };
          
          for (var k in newMetadata) replacement['$set'].metadata[k] =  newMetadata[k];
          
          replacement['$set'].metadata.package = packageName;
          replacement['$set'].metadata.path = assetPath;
          
          var grid = new Grid(db, "package_assets");
          db.collection("package_assets.files").update({
            "metadata.package": packageName,
            "metadata.path": assetPath
          }, replacement,  {w: 1}, function (err) {
            if (err) return callback(err);
          
            var packagesUpdate = {
              $pull: {},
              $addToSet: {}
            };
            
            if (replacement['$set'].metadata.use === 'script') {
              packagesUpdate["$pull"].styles = assetPath;
              packagesUpdate["$addToSet"].scripts = assetPath;
            } else if (replacement['$set'].metadata.use === 'style') {
              packagesUpdate["$pull"].scripts = assetPath;
              packagesUpdate["$addToSet"].styles = assetPath;
            } else {
              packagesUpdate["$pull"].scripts = assetPath;
              packagesUpdate["$pull"].styles = assetPath;
            }
            
            if (Object.keys(packagesUpdate["$pull"]).length === 0) delete packagesUpdate["$pull"];
            if (Object.keys(packagesUpdate["$addToSet"]).length === 0) delete packagesUpdate["$addToSet"];
            
            if (Object.keys(packagesUpdate).length === 0) return callback ();
            
            db.collection("packages").update({
              name: packageName
            }, packagesUpdate,  {w: 1}, function (err) {            
              if (err) return callback (err);
              
              if (!silent) updateBoxesManifest(self.getActivePackagesWithDependencies, callback);
              else callback();
            });
          });
        });
      },
      exportPackage: function (packageName, callback) {
        var AdmZip = require('adm-zip');

        var zip = new AdmZip(),
            mergedMetadata = {};

        self.listAssets(packageName, function (err, assets) {
          if (err) return callback (err);

          async
          .each(assets, function (assetPath, assetCallback) {
            self.getAsset(packageName, assetPath, function (err, assetBuffer) {
              if (err) return assetCallback(err);
              
              zip.addFile("assets/" + assetPath, assetBuffer);
              
              self.getAssetMetadata(packageName, assetPath, function (err, metadata) {
                if (err) return assetCallback (err);
                
                delete metadata.path;
                delete metadata.package;
                
                mergedMetadata[assetPath] = metadata;
                
                assetCallback();                
              });
            });
          }, function (err) {
            if (err) return callback (err);
            
            zip.addFile("metadata.json", new Buffer(JSON.stringify(mergedMetadata, undefined, 2)));

            async.series([
              function(callback){
                self.listScripts(packageName, function (err, scripts) {
                  if (err) return callback (err);
                  
                  zip.addFile("scripts.json", new Buffer(JSON.stringify(scripts, undefined, 2)));
                  
                  callback();
                });
              },
              function(callback){
                self.listAngularModules(packageName, function (err, angularModules) {
                  if (err) return callback (err);
                  
                  zip.addFile("angular-modules.json", new Buffer(JSON.stringify(angularModules, undefined, 2)));
                  
                  callback();
                });
              },
              function(callback){
                self.listStyles(packageName, function (err, styles) {
                  if (err) return callback(err);
                  
                  zip.addFile("styles.json", new Buffer(JSON.stringify(styles, undefined, 2)));
                  
                  callback();
                });
              },
              function(callback){
                self.listFolders(packageName, function (err, folders) {
                  if (err) return callback(err);
                  
                  zip.addFile("folders.json", new Buffer(JSON.stringify(folders, undefined, 2)));
                  
                  callback();
                });
              },
              function(callback){
                zip.addFile("packageName.txt", new Buffer(packageName));
                
                callback();
              },
              function(callback){
                self.getDependencies(packageName, function (err, dependencies) {
                  if (err) return callback (err);
                
                  zip.addFile("dependencies.json", new Buffer(JSON.stringify(dependencies)));
                
                  callback();
                });
              },
              function(callback){
                self.getPackageType(packageName, function (err, packageType) {
                  if (err) return callback (err);
                  
                  zip.addFile("packageType.txt", new Buffer(packageType));
                  
                  callback();
                });
              }],
              function(err) {
                callback(null, zip.toBuffer());
              });
          }); 
        });
      }
    };
    
    callback(err, self);
  });
}
