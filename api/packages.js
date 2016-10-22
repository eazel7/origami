/* eslint-disable semi */

var GridFSBucket = require('mongodb').GridFSBucket;
var async = require('async');
var path = require('path');
var Archiver = require('archiver');

PackagesAPI.prototype.updateBoxesManifest = function (callback) {
  var self = this;

  self.db.collection('boxes')
  .find({})
  .toArray(function (err, affectedBoxes) {
    if (err) {
      console.error(err);
      return callback(err);
    }

    var boxes = [];

    for (var i = 0; i < affectedBoxes.length; i++) {
      boxes.push(affectedBoxes[i]);
    }

    async.eachSeries(affectedBoxes, function (box, callback) {
      var allAssets = [];
      var allScripts = [];
      var allStyles = [];
      var allAngularModules = [];

      self.getActivePackagesWithDependencies(box.name, function (err, activePackages) {
        if (err) return callback(err);

        async.eachSeries(activePackages || [], function (packageName, callback) {
          self.db
          .collection('packages')
          .findOne({
            name: packageName
          }, function (err, doc) {
            if (err) return callback(err);

            if (!doc) {
              console.error('Skip missing package ' + packageName);
              return callback();
            }

            if (doc.angularModules) {
              for (var i = 0; i < doc.angularModules.length; i++) {
                if (allAngularModules.indexOf(doc.angularModules[i]) === -1) {
                  allAngularModules.push(doc.angularModules[i]);
                }
              }
            }

            if (doc && doc.scripts) {
              for (var j = 0; j < doc.scripts.length; j++) {
                if (doc.packageType !== 'local') {
                  allScripts.push('/api/packages/' + packageName + '/assets/' + doc.scripts[j]);
                } else {
                  allScripts.push(doc.scripts[j]);
                }
              }
            }

            if (doc && doc.styles) {
              for (var k = 0; k < doc.styles.length; k++) {
                if (doc.packageType !== 'local') {
                  allStyles.push('/api/packages/' + packageName + '/assets/' + doc.styles[k]);
                } else {
                  allStyles.push(doc.styles[k]);
                }
              }
            }

            self.db
            .collection('package_assets.files')
            .find({
              'metadata.package': packageName,
              'metadata.use': {
                $ne: null
              }
            })
            .toArray(function (err, docs) {
              if (err) return callback(err);

              for (var i = 0; i < docs.length; i++) {
                if (doc.packageType !== 'local') {
                  allAssets.push('/api/packages/' + packageName + '/assets/' + docs[i].metadata.path);
                } else {
                  allAssets.push(docs[i].metadata.path);
                }
              }

              callback();
            });
          });
        }, function (err) {
          if (err) return callback(err);

          self.db
          .collection('boxes')
          .update({
            name: box.name
          }, {
            $set: {
              manifest: createManifest(allAssets),
              styles: allStyles,
              scripts: allScripts,
              angularModules: allAngularModules
            }
          }, { w: 1 }, function (err) {
            callback(err);
          });
        });
      });
    }, callback);
  });
}

function createManifest (allAssets) {
  return 'CACHE MANIFEST\n#' +
         String(new Date().valueOf()) + '\n\n' +
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

function PackagesAPI (db, eventBus, users) {
  var self = this;

  this.db = db;
  this.eventBus = eventBus;
  this.users = users;

  eventBus.on('box-packages-updated', function () {
    self.updateBoxesManifest(function (err) {
      if (err) console.error(err);
    });
  });
};

PackagesAPI.prototype.getActivePackagesWithDependencies = function (boxName, callback) {
  var self = this;

  self.getActivePackages(boxName, function (err, packages) {
    if (err) {
      console.error(err);
      return callback(err);
    }

    var activePackages = [];

    for (var i = 0; i < packages.length; i++) {
      if (packages[i]) activePackages.push(packages[i].name);
    }

    if (err) return callback(err);

    require('./dependencies')(boxName, function (depName, callback) {
      if (depName === boxName) return callback(null, activePackages);

      self.getDependencies(depName, callback);
    }, function (err, deps) {
      if (err) {
        console.error(err);
        return callback(err);
      }

      deps.splice(deps.indexOf(boxName), 1);

      callback(err, deps);
    });
  });
};

PackagesAPI.prototype.getDependencies = function (packageName, callback) {
  var self = this;

  self.db.collection('packages').findOne({
    name: packageName
  }, function (err, doc) {
    if (err) return callback(err);
    if (!doc) return callback('No pacakge');

    callback(null, doc.dependencies || []);
  });
};

PackagesAPI.prototype.setDependencies = function (packageName, dependencies, callback, silent) {
  var self = this;

  self.db.collection('packages').update({
    name: packageName
  }, {
    $set: {
      dependencies: dependencies
    }
  }, {w: 1}, function (err) {
    if (err) return callback(err);

    if (!silent) {
      self.updateBoxesManifest(function (err) {
        if (err) {
          console.error(err);
          return callback(err);
        }

        callback();
      });
    } else {
      callback();
    }
  });
};

PackagesAPI.prototype.getPackageType = function (packageName, callback) {
  var self = this;

  self.db.collection('packages').findOne({
    name: packageName
  }, function (err, doc) {
    if (err) return callback(err);
    if (!doc) return callback('No pacakge');

    callback(null, doc.packageType || 'global');
  });
};

PackagesAPI.prototype.getActivePackages = function (boxName, callback) {
  var self = this;

  self.db.collection('boxes')
  .findOne({
    name: boxName
  }, function (err, doc) {
    if (err) return callback(err);

    return callback(null, doc.packages || []);
  });
};

PackagesAPI.prototype.getPackageOwner = function (packageName, callback) {
  var self = this;

  self.db.collection('packages').findOne({
    name: packageName
  }, {
    owner: 1
  },
  function (err, doc) {
    if (err) return callback(err);
    if (!doc) return callback('No pacakge');

    callback(null, doc.owner);
  });
};

PackagesAPI.prototype.setPackageOwner = function (packageName, alias, callback) {
  var self = this;

  self.users.isValid(alias, function (err, isValid) {
    if (err) return callback(err);

    if (!isValid) return callback('Invalid user');

    self.db.collection('packages').update({
      name: packageName
    }, {
      $set: {
        owner: alias
      }
    }, callback);
  });
};

PackagesAPI.prototype.getPackageInfo = function (packageName, callback) {
  var self = this;

  self.db.collection('packages').findOne({
    name: packageName
  }, {
    info: 1
  }, function (err, doc) {
    if (err) return callback(err);
    if (!doc) return callback('No pacakge');

    callback(null, doc.info || {});
  });
};

PackagesAPI.prototype.setPackageInfo = function (packageName, info, callback) {
  var self = this;

  self.db.collection('packages').update({
    name: packageName
  }, {
    $set: {
      info: info || { version: '', description: '' }
    }
  }, callback);
};

PackagesAPI.prototype.setPackageType = function (packageName, packageType, callback, silent) {
  var self = this;

  self.db.collection('packages').update({
    name: packageName
  }, {
    $set: {
      packageType: packageType || 'global'
    }
  }, {
    w: 1
  },
  function (err) {
    if (err) return callback(err);

    if (silent) self.updateBoxesManifest(callback);
    else callback();
  });
};

PackagesAPI.prototype.getActivePackages = function (boxName, callback) {
  var self = this;

  self.db.collection('boxes')
  .findOne({
    name: boxName
  }, function (err, doc) {
    if (err) return callback(err);

    if (!doc || !doc.packages) {
      return callback(null, []);
    }

    self.db.collection('packages')
    .find({
      name: {
        $in: doc.packages
      }
    })
    .toArray(function (err, docs) {
      if (err) {
        console.error(err);

        return callback(err);
      }

      var ordered = [];

      for (var i = 0; i < docs.length; i++) {
        if (docs[i]) {
          ordered[doc.packages.indexOf(docs[i].name)] = docs[i];
        }
      }

      for (var j = ordered.length - 1; j > 0; j--) {
        if (!ordered[j]) ordered.splice(j, 1);
      }

      callback(null, ordered);
    });
  });
};

PackagesAPI.prototype.removeFolder = function (packageName, folder, callback) {
  var self = this;

  self.db.collectio('packages')
  .update({
    name: packageName
  }, {
    $pull: {
      folders: folder
    }
  }, {
    w: 1
  },
  callback);
};

PackagesAPI.prototype.setActivePackages = function (boxName, packages, callback) {
  var self = this;

  self.db.collection('boxes')
  .update({
    name: boxName
  }, {
    $set: {
      'packages': packages
    }
  }, {
    w: 1
  },
  function (err) {
    if (err) return callback(err);

    self.updateBoxesManifest(callback);
  });
};

PackagesAPI.prototype.activatePackage = function (boxName, packageName, callback) {
  var self = this;

  self.db.collection('boxes')
  .update({
    name: boxName
  }, {
    $addToSet: {
      packages: packageName
    }
  }, function (err) {
    if (err) return callback(err);

    self.updateBoxesManifest(callback);
  });
};

PackagesAPI.prototype.deactivatePackage = function (boxName, packageName, callback) {
  var self = this;

  self.db.collection('boxes')
  .update({
    name: boxName
  }, {
    $pull: {
      packages: packageName
    }
  }, {
    w: 1
  },
  function (err) {
    if (err) return callback(err);

    self.updateBoxesManifest(callback);
  });
};

PackagesAPI.prototype.listPackages = function (callback) {
  var self = this;

  self.db
  .collection('packages')
  .find(
    { },
    {
      _id: 0
    })
  .toArray(callback);
};

PackagesAPI.prototype.createFolder = function (packageName, folderName, callback) {
  var self = this;

  self.db
  .collection('packages')
  .update({
    name: packageName
  }, {
    $addToSet: {
      folders: folderName
    }
  }, {
    w: 1
  },
  callback);
};

PackagesAPI.prototype.listFolders = function (packageName, callback) {
  var self = this;

  self.db
  .collection('packages')
  .findOne({
    name: packageName
  }, function (err, doc) {
    if (err) return callback(err);
    if (!doc) return callback('No package');

    return callback(null, doc.folders || []);
  });
};

PackagesAPI.prototype.createPackage = function (name, callback) {
  var self = this;

  self.db.collection('packages').count({
    name: name
  }, function (err, count) {
    if (err) return callback(err);

    if (count === 0) {
      self.db
      .collection('packages')
      .insert({
        name: name,
        files: [],
        folders: [],
        styles: [],
        angularModules: [],
        info: {
          version: '1',
          description: ''
        },
        scripts: []
      }, {
        w: 1
      },
      callback);
    } else {
      callback();
    }
  });
};

PackagesAPI.prototype.removePackage = function (packageName, callback) {
  var self = this;

  self.listAssets(packageName, function (err, assets) {
    if (err) return callback(err);

    async
    .each(assets, function (asset, assetCallback) {
      self.removeAsset(packageName, asset, assetCallback);
    }, function (err) {
      if (err) return callback(err);

      self.db.collection('packages').remove({
        name: packageName
      }, {
        j: 1
      },
      function (err) {
        if (err) return callback(err);

        self.db
        .collection('boxes')
        .update({
        }, {
          $pull: {
            'packages': packageName
          }
        }, {
          j: 1
        }, function (err) {
          if (err) return callback(err);

          self.updateBoxesManifest(callback);
        });
      });
    });
  });
};

PackagesAPI.prototype.listAssets = function (packageName, callback) {
  var self = this;

  self.db.collection('packages').findOne({
    name: packageName
  }, function (err, doc) {
    if (!doc) return callback(null, []);

    callback(err, doc.files);
  });
};

PackagesAPI.prototype.createAsset = function (packageName, assetPath, callback, silent) {
  var self = this;

  self.db.collection('packages').update({
    name: packageName
  }, {
    $addToSet: {
      files: assetPath
    }
  }, {
    w: 1
  },
  function (err) {
    if (err) return callback(err);

    if (!silent) self.updateBoxesManifest(callback);
    else callback();
  });
};

PackagesAPI.prototype.updateAsset = function (packageName, assetPath, bytes, callback, silent) {
  var self = this;

  self.db.collection('package_assets.files').findOne({
    'metadata.package': packageName,
    'metadata.path': assetPath
  }, function (err, doc) {
    if (err) return callback(err);

    var grid = new GridFSBucket(self.db, 'package_assets');

    function done (err) {
      if (err) return callback(err);

      if (!silent) self.updateBoxesManifest(callback);
      else callback();
    }

    if (doc) {
      grid.delete(doc._id, function (err) {
        if (err) {
          return callback(err);
        }
        
        var upload = grid.openUploadStreamWithId(doc._id, assetPath, { metadata: doc.metadata });

        upload.end(bytes, done);
      });
    } else {
      var upload = grid.openUploadStream(assetPath, { metadata: { 'package': packageName, 'path': assetPath } });
      
      upload.end(bytes, done);
    }
  });
};

PackagesAPI.prototype.removeAsset = function (packageName, assetPath, callback) {
  var self = this;

  self.db.collection('package_assets.files').findOne({
    'metadata': {
      '': packageName,
      'path': assetPath
    }
  }, function (err, doc) {
    if (err) return callback(err);

    var grid = new GridFSBucket(self.db, 'package_assets');

    function done (err) {
      if (err) return callback(err);

      self.db.collection('packages').update({
        'name': packageName
      }, {
        '$pull': {
          'files': assetPath,
          'scripts': assetPath,
          'styles': assetPath
        }
      }, {
        w: 1
      }, function (err) {
        if (err) return callback(err);

        self.updateBoxesManifest(callback);
      });
    }

    if (doc) {
      grid.delete(doc._id, done);
    } else {
      done();
    }
  });
};

PackagesAPI.prototype.getAsset = function (packageName, assetPath, callback) {
  var self = this;

  var grid = new GridFSBucket(self.db, 'package_assets');

  var cursor = grid.find({
    'metadata.package': packageName,
    'metadata.path': assetPath
  }, { limit: 1 });
  
  cursor
  .next(function (err, doc) {
    if (err) return callback(err);
    
    var buffer = new Buffer([]);
    
    var download = grid.openDownloadStream(doc._id);
    
    download.on('end', function () {
      cursor.close(function () {
        download.abort(function () {
          callback(null, buffer);
        });
      });
    });
    
    download.on('data', function (data) {
      buffer = Buffer.concat([buffer, data]);
    });
  });
};

PackagesAPI.prototype.listScripts = function (packageName, callback) {
  var self = this;

  self.db.collection('packages').findOne({
    name: packageName
  }, function (err, doc) {
    if (err) return callback(err);
    if (!doc) return callback('No pacakge');

    callback(null, doc.scripts || []);
  });
};

PackagesAPI.prototype.listStyles = function (packageName, callback) {
  var self = this;

  self.db.collection('packages').findOne({
    name: packageName
  }, function (err, doc) {
    if (err) return callback(err);
    if (!doc) return callback('No pacakge');

    callback(null, doc.styles || []);
  });
};

PackagesAPI.prototype.listAngularModules = function (packageName, callback) {
  var self = this;

  self.db.collection('packages').findOne({
    name: packageName
  }, function (err, doc) {
    if (err) return callback(err);
    if (!doc) return callback('No pacakge');

    callback(null, doc.angularModules || []);
  });
};

PackagesAPI.prototype.setAngularModules = function (packageName, angularModules, callback, silent) {
  var self = this;

  self.db.collection('packages').update({
    name: packageName
  }, {
    $set: {
      angularModules: angularModules
    }
  }, {
    w: 1
  }, function (err) {
    if (err) return callback(err);

    if (!silent) self.updateBoxesManifest(callback);
    else callback();
  });
};

PackagesAPI.prototype.setStyles = function (packageName, styles, callback, silent) {
  var self = this;

  self.db.collection('packages').update({
    name: packageName
  }, {
    $set: {
      styles: styles
    }
  }, {
    w: 1
  }, function (err) {
    if (err) return callback(err);

    if (!silent) self.updateBoxesManifest(callback);
    else callback();
  });
};

PackagesAPI.prototype.setScripts = function (packageName, scripts, callback, silent) {
  var self = this;

  self.db.collection('packages').update({
    name: packageName
  }, {
    $set: {
      scripts: scripts
    }
  }, {w: 1}, function (err) {
    if (err) return callback(err);

    if (!silent) self.updateBoxesManifest(callback);
    else callback();
  });
};

PackagesAPI.prototype.getAssetMetadata = function (packageName, assetPath, callback) {
  var self = this;

  var grid = new GridFSBucket(self.db, 'package_assets');

  var cursor = grid.find({
    'metadata.package': packageName,
    'metadata.path': assetPath
  }, { limit: 1 });
  
  cursor
  .next(function (err, doc) {
    if (err) return callback(err);
    
    cursor.close(function () {
      callback(null, doc ? doc.metadata : undefined);
    })
  });
};

PackagesAPI.prototype.unzipAsset = function (packageName, assetPath, callback) {
  var self = this;

  self.getAsset(packageName, assetPath, function (err, zipBuffer) {
    if (err) return callback(err);

    var AdmZip = require('adm-zip');
    var zip = new AdmZip(zipBuffer);

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
      if (err) return callback(err);

      self.updateBoxesManifest(callback);
    });
  });
};

PackagesAPI.prototype.importPackage = function (zippedBuffer, importCallback, silent) {
  var self = this;

  var ZipFile = require('adm-zip/zipFile');
  var AdmZipUtil = require('adm-zip/util');

  var zip;

  try {
    zip = new ZipFile(zippedBuffer, AdmZipUtil.Constants.BUFFER);
  } catch (e) {
    return importCallback('Couldn\'t read package file');
  }

  var packageName = zip.getEntry('packageName.txt').getData().toString();

  self.createPackage(packageName, function (err) {
    if (err) {
      console.error(err);
      return importCallback(err);
    }

    self.updatePackage(packageName, zippedBuffer, importCallback, silent);
  });
};

PackagesAPI.prototype.updatePackage = function (packageName, zippedBuffer, importCallback, silent) {
  var self = this;

  self.listAssets(packageName, function (err, previousAssets) {
    if (err) return importCallback(err);

    var ZipFile = require('adm-zip/zipFile');
    var AdmZipUtil = require('adm-zip/util');
    var zip = new ZipFile(zippedBuffer, AdmZipUtil.Constants.BUFFER);

    var packageType = zip.getEntry('packageType.txt').getData().toString();
    var styles = JSON.parse(zip.getEntry('styles.json').getData().toString());
    var scripts = JSON.parse(zip.getEntry('scripts.json').getData().toString());
    var folders = JSON.parse(zip.getEntry('folders.json').getData().toString());
    var dependencies = JSON.parse(zip.getEntry('dependencies.json').getData().toString());
    var angularModules = JSON.parse(zip.getEntry('angular-modules.json').getData().toString());
    var mergedMetadata = JSON.parse(zip.getEntry('metadata.json').getData().toString());

    var info;
    try {
      info = JSON.parse(zip.getEntry('info.json').getData().toString());
    } catch (e) {
      console.log('No package info to import');

      info = {};
    };

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
      self.setPackageInfo(packageName, info, callback);
    }, function (callback) {
      self.setScripts(packageName, scripts, callback, true);
    }, function (callback) {
      var entries = zip.entries;
      var updatedAssets = [];

      async.eachSeries(entries, function (entry, entryCallback) {
        if (entry.entryName.indexOf('assets/') !== 0) return entryCallback();

        var entryBuffer = entry.getData();
        var assetPath = entry.entryName.slice('assets/'.length);
        var entryMetadata = mergedMetadata[assetPath];

        self.createAsset(packageName, assetPath, function (err) {
          if (err) {
            console.error(err);
            return entryCallback(err);
          } else {
            self.updateAsset(packageName, assetPath, entryBuffer, function (err) {
              if (err) {
                console.error(err);
                return entryCallback(err);
              } else {
                self.setAssetMetadata(packageName, assetPath, entryMetadata, function (err) {
                  if (err) {
                    console.error(err);

                    return entryCallback(err);
                  }

                  updatedAssets.push(assetPath);

                  entryCallback();
                }, true);
              }
            }, true);
          }
        }, true);
      }, function (err) {
        if (err) {
          console.error(err);
          return callback(err);
        }

        async.eachSeries(previousAssets, function (previousAsset, callback) {
          if (updatedAssets.indexOf(previousAsset) === -1) {
            return self.removeAsset(packageName, previousAsset, callback);
          }

          callback();
        }, callback);
      });
    }, function (callback) {
      self.setPackageType(packageName, packageType, callback, true);
    }, function (callback) {
      self.setDependencies(packageName, dependencies, callback, true);
    }, function (callback) {
      if (!silent) return self.updateBoxesManifest(callback);

      callback();
    }], importCallback);
  });
};

PackagesAPI.prototype.setAssetMetadata = function (packageName, assetPath, newMetadata, callback, silent) {
  var self = this;

  self.getAssetMetadata(packageName, assetPath, function (err, metadata) {
    if (err) return callback(err);

    var replacement = {
      $set: {
        'metadata': metadata || {}
      }
    };

    for (var k in newMetadata) {
      replacement['$set'].metadata[k] = newMetadata[k];
    }

    replacement['$set'].metadata.package = packageName;
    replacement['$set'].metadata.path = assetPath;

    self.db.collection('package_assets.files').update({
      'metadata.package': packageName,
      'metadata.path': assetPath
    },
    replacement, {
      w: 1
    },
    function (err) {
      if (err) return callback(err);

      var packagesUpdate = {
        $pull: {},
        $addToSet: {}
      };

      if (replacement['$set'].metadata.use === 'script') {
        packagesUpdate['$pull'].styles = assetPath;
        packagesUpdate['$addToSet'].scripts = assetPath;
      } else if (replacement['$set'].metadata.use === 'style') {
        packagesUpdate['$pull'].scripts = assetPath;
        packagesUpdate['$addToSet'].styles = assetPath;
      } else {
        packagesUpdate['$pull'].scripts = assetPath;
        packagesUpdate['$pull'].styles = assetPath;
      }

      if (Object.keys(packagesUpdate['$pull']).length === 0) {
        delete packagesUpdate['$pull'];
      }

      if (Object.keys(packagesUpdate['$addToSet']).length === 0) {
        delete packagesUpdate['$addToSet'];
      }

      if (Object.keys(packagesUpdate).length === 0) {
        return callback();
      }

      self.db.collection('packages').update({
        name: packageName
      },
      packagesUpdate, {
        w: 1
      },
      function (err) {
        if (err) return callback(err);

        if (!silent) self.updateBoxesManifest(callback);
        else callback();
      });
    });
  });
};

PackagesAPI.prototype.exportPackage = function (packageName, callback) {
  var self = this;

  var zip = Archiver.create('zip', {});

  var zipBuffer = new Buffer([]);

  var mergedMetadata = {};

  zip.on('data', function (data) {
    zipBuffer = Buffer.concat([zipBuffer, data]);
  });

  zip.on('end', function () {
    callback(null, zipBuffer);
  });

  self.listAssets(packageName, function (err, assets) {
    if (err) return callback(err);

    async
    .each(assets, function (assetPath, assetCallback) {
      self.getAsset(packageName, assetPath, function (err, assetBuffer) {
        if (err) return assetCallback(err);

        self.getAssetMetadata(packageName, assetPath, function (err, metadata) {
          if (err) return assetCallback(err);

          delete metadata.path;
          delete metadata.package;

          mergedMetadata[assetPath] = metadata;

          zip.append(assetBuffer, { name: 'assets/' + assetPath });

          assetCallback();
        });
      });
    }, function (err) {
      if (err) return callback(err);

      zip.append(new Buffer(JSON.stringify(mergedMetadata, undefined, 2)), { name: 'metadata.json' });

      async.series([
        function (callback) {
          self.listScripts(packageName, function (err, scripts) {
            if (err) return callback(err);

            zip.append(new Buffer(JSON.stringify(scripts, undefined, 2)), { name: 'scripts.json' });

            callback();
          });
        },
        function (callback) {
          self.listAngularModules(packageName, function (err, angularModules) {
            if (err) return callback(err);

            zip.append(new Buffer(JSON.stringify(angularModules, undefined, 2)), { name: 'angular-modules.json' });

            callback();
          });
        },
        function (callback) {
          self.listStyles(packageName, function (err, styles) {
            if (err) return callback(err);

            zip.append(new Buffer(JSON.stringify(styles, undefined, 2)), { name: 'styles.json' });

            callback();
          });
        },
        function (callback) {
          self.listFolders(packageName, function (err, folders) {
            if (err) return callback(err);

            zip.append(
              new Buffer(JSON.stringify(folders, undefined, 2)),
              {
                name: 'folders.json'
              });

            callback();
          });
        },
        function (callback) {
          self.getPackageInfo(packageName, function (err, info) {
            if (err) return callback(err);

            zip.append(new Buffer(JSON.stringify(info, undefined, 2)), { name: 'info.json' });

            callback();
          });
        },
        function (callback) {
          zip.append(new Buffer(packageName), { name: 'packageName.txt' });

          callback();
        },
        function (callback) {
          self.getDependencies(packageName, function (err, dependencies) {
            if (err) return callback(err);

            zip.append(new Buffer(JSON.stringify(dependencies)), { name: 'dependencies.json' });

            callback();
          });
        },
        function (callback) {
          self.getPackageType(packageName, function (err, packageType) {
            if (err) return callback(err);

            zip.append(new Buffer(packageType), { name: 'packageType.txt' });

            callback();
          });
        }],
        function (err) {
          if (err) {
            console.error(err);
            return callback(err);
          }

          zip.finalize();
        });
    });
  });
};

PackagesAPI.prototype.exportAllPackages = function (callback) {
  var self = this;

  var zip = new Archiver('zip');
  var zipBuffer = new Buffer([]);

  zip.on('data', function (data) {
    zipBuffer = Buffer.concat([zipBuffer, data]);
  });

  zip.on('end', function () {
    callback(null, zipBuffer);
  });

  self.listPackages(function (err, packages) {
    if (err) return callback(err);

    async.eachSeries(packages, function (p, callback) {
      self.exportPackage(p.name, function (err, buffer) {
        if (err) return callback(err);

        try {
          zip.append(buffer, { name: 'packages/' + p.name });
        } catch (e) {
          return callback(e);
        }

        callback();
      });
    }, function (err) {
      if (err) return callback(err);

      zip.finalize();
    });
  });
};

PackagesAPI.prototype.importGithub = function (callback) {
  var self = this;

  var platform = require('git-node-platform');
  var memDb = require('git-memdb');
  var jsGit = require('js-git')(platform);
  var gitRemote = require('git-net')(platform);

  var git = {
    repo: function createRepo (callback) {
      var db = memDb();
      db.init(function () {
        var repo = jsGit(db);

        callback(null, repo);
      })
    },
    remote: function createRemote (url) {
      return gitRemote(url);
    }
  };

  // Create a remote repo
  var url = 'https://github.com/eazel7/origami-packs.git';

  git.repo(function (err, repo) {
    if (err) return callback(err);

    var remote = git.remote(url);

    var opts = {
      onProgress: function (progress) {
        process.stderr.write(progress);
      }
    };

    repo.fetch(remote, opts, function (err) {
      if (err) throw err;

      repo.loadAs('commit', 'HEAD', function (err, result) {
        if (err) return callback(err);

        repo.loadAs('tree', result.tree, function (err, tree) {
          if (err) return callback(err);

          require('async').eachSeries(tree, function (entry, callback) {
            if (entry.name.indexOf('.pack') === -1) return callback();

            repo.loadAs('blob', entry.hash, function (err, blob) {
              if (err) return callback(err);

              self.importPackage(blob, function (err) {
                callback(err);
              });
            });
          }, callback);
        });
      });
    });
  });
};

PackagesAPI.prototype.importPackages = function (buffer, callback) {
  var self = this;

  var ZipFile = require('adm-zip/zipFile');
  var AdmZipUtil = require('adm-zip/util');
  var zip;

  try {
    zip = new ZipFile(buffer, AdmZipUtil.Constants.BUFFER);
  } catch (e) {
    return callback('Couldn\'t read package file');
  }

  var entries = zip.entries;

  async.eachSeries(entries, function (entry, entryCallback) {
    if (entry.entryName.indexOf('packages/') !== 0) return entryCallback();

    self.importPackage(entry.getData(), entryCallback, true);
  }, function (err) {
    if (err) return callback(err);

    self.rebuildManifests(callback);
  });
};

PackagesAPI.prototype.rebuildManifests = function (callback) {
  var self = this;

  self.updateBoxesManifest(callback);
};

module.exports = PackagesAPI;
