/* eslint-disable semi */

var Grid = require('mongodb').Grid;
var ObjectID = require('mongodb').ObjectID;
var async = require('async');

function BoxesAPI (db, users, collections, eventBus) {
  this.db = db;
  this.users = users;
  this.collections = collections;
  this.eventBus = eventBus;
};

BoxesAPI.prototype.getBox = function (boxName, callback) {
  var self = this;

  self.db
  .collection('boxes')
  .findOne({
    name: boxName
  }, callback);
};

BoxesAPI.prototype.createBox = function (boxName, owner, callback) {
  var self = this;

  if (!boxName) callback('No box name');
  if (!owner) callback('No box name');

  self.getBox(boxName, function (err, box) {
    if (box) {
      return callback(new Error('A box with that name already exists'))
    } else if (err) {
      return callback(err);
    } else {
      var boxObj = {
        name: boxName,
        owner: owner,
        angularModules: [],
        styles: [],
        collections: {},
        manifest: 'CACHE MANIFEST\n',
        packages: [],
        scripts: [],
        info: {
          status: false,
          description: ''
        }
      };

      self.db
      .collection('boxes')
      .insert(boxObj, function (err, results) {
        if (err) return callback(err);

        if (results) results = results[0];

        self.users.enableUser(owner, boxName, 'owner', function (err) {
          if (err) return callback(err);

          async.eachSeries(['_views', '_graphs'], function (cn, callback) {
            self.collections
            .createCollection(boxName, cn, callback);
          }, function (err) {
            if (err) return callback(err);

            async.eachSeries(
              [
                '_errors',
                '_permissions',
                '_workflows',
                '_schedules'
              ],
              function (cn, callback) {
                self.collections
                .createServerCollection(boxName, cn, callback);
              }, function (err) {
                if (err) return callback(err);

                self.eventBus.emit('box-created', boxName);

                callback();
              });
          });
        });
      });
    }
  });
};

BoxesAPI.prototype.listBoxes = function (callback) {
  var self = this;

  self.db
  .collection('boxes')
  .find({})
  .toArray(callback);
};

BoxesAPI.prototype.listActiveBoxes = function (callback) {
  var self = this;

  self.db
  .collection('boxes')
  .find({
    info: {
      status: true
    }
  })
  .toArray(callback);
};

BoxesAPI.prototype.getBoxInfo = function (boxName, callback) {
  var self = this;

  self.getBox(boxName, function (err, box) {
    return callback(err, box && box.info ? box.info : null);
  });
};

BoxesAPI.prototype.saveInfo = function (boxName, info, callback) {
  var self = this;

  self.db
  .collection('boxes')
  .update({
    'name': boxName
  }, {
    $set: {
      'info': info
    }
  }, function (err) {
    if (err) return callback(err, info);

    self.eventBus.emit('box-info-changed', boxName);

    callback(err, info);
  });
};

BoxesAPI.prototype.uploadFile = function (boxName, buffer, callback) {
  var self = this;

  var grid = new Grid(self.db, boxName + '-_uploads');

  grid.put(buffer, {}, callback);
};

BoxesAPI.prototype.deleteFile = function (boxName, id, callback) {
  var self = this;

  var grid = new Grid(self.db, boxName + '-_uploads');

  grid.delete(new ObjectID(id), {}, callback);
};

BoxesAPI.prototype.listFiles = function (boxName, callback) {
  var self = this;

  self.db
  .collection(boxName + '-_uploads.files')
  .find({}, {_id: 1})
  .toArray(function (err, docs) {
    if (err) return callback(err);

    var ids = [];

    for (var i = 0; i < docs.length; i++) ids.push(docs[i]._id.toString());

    callback(null, ids);
  });
};

BoxesAPI.prototype.serveFile = function (boxName, id, callback) {
  var self = this;

  var grid = new Grid(self.db, boxName + '-_uploads');

  grid.get(new ObjectID(id), callback);
};

BoxesAPI.prototype.export = function (boxName, callback) {
  // collections
  // packages
  // uploads

  var self = this;
  var AdmZip = require('adm-zip');
  var zip = new AdmZip();

  async
  .series([function (callback) {
    self.listFiles(boxName, function (err, files) {
      if (err) return callback(err);

      async
      .each(files, function (file, fileCallback) {
        self.serveFile(boxName, file, function (err, buffer) {
          if (err) return fileCallback(err);

          zip.addFile('uploads/' + file, buffer);

          fileCallback();
        });
      }, callback);
    });
  }, function (callback) {
    self.collections
    .getCollections(boxName, function (err, collectionNames) {
      if (err) return callback(err);

      async
      .eachSeries(collectionNames, function (collectionName, collectionCallback) {
        self.collections
        .find(boxName, collectionName, {}, function (err, docs) {
          if (err) return collectionCallback(err);

          zip.addFile(
            'collections/' + collectionName + '.json',
            new Buffer(JSON.stringify(docs, undefined, 2)));

          collectionCallback();
        });
      }, callback);
    });
  }, function (callback) {
    self.getBox(boxName, function (err, box) {
      if (err) return callback(err);

      zip.addFile(
        'box.json',
        new Buffer(
          JSON.stringify(
            {
              info: box.info,
              packages: box.packages
            },
            undefined, 2)
          )
        );
      zip.addFile('boxname.txt', new Buffer(box.name));

      callback();
    });
  }], function (err) {
    if (err) return callback(err);

    callback(null, zip.toBuffer());
  });
};

BoxesAPI.prototype.import = function (boxName, bytes, callback) {
  var self = this;

  var ZipFile = require('adm-zip/zipFile');
  var AdmZipUtil = require('adm-zip/util');

  var zip = new ZipFile(bytes, AdmZipUtil.Constants.BUFFER);

  var box = JSON.parse(zip.getEntry('box.json').getData().toString());

  var entries = zip.entries;

  async.series([
    function (callback) {
      self.db
      .collection('boxes')
      .update({
        name: boxName
      }, {
        $set: {
          info: box.info,
          packages: box.packages
        }
      }, function (err) {
        if (err) return callback(err);

        self.eventBus.emit('box-packages-updated', boxName);

        callback();
      });
    }, function (callback) {
      async.eachSeries(entries, function (entry, entryCallback) {
        if (entry.entryName.indexOf('uploads/') === 0) {
          var entryBuffer = entry.getData();
          var uploadId = new ObjectID(entry.entryName.slice('uploads/'.length));
          var grid = new Grid(self.db, boxName + '-_uploads');

          grid.put(entryBuffer, {_id: uploadId}, entryCallback);
        } else if (entry.entryName.indexOf('collections/') === 0) {
          var collectionName = entry.entryName.slice('collections/'.length, entry.entryName.lastIndexOf('.json'));
          var data = JSON.parse(zip.getEntry(entry.entryName).getData().toString());

          async.series([
            function (callback) {
              self.collections.createCollection(boxName, collectionName, callback);
            }, function (callback) {
              self.collections
              .remove(boxName, collectionName, {}, function (err) {
                if (err) return callback(err);

                async.eachSeries(data, function (obj, callback) {
                  self.collections.insert(boxName, collectionName, obj, callback);
                }, callback);
              });
            }
          ],
          entryCallback);
        } else return entryCallback();
      }, callback);
    }
  ], callback);
};

BoxesAPI.prototype.exportAllBoxes = function (callback) {
  var self = this;

  var AdmZip = require('adm-zip');
  var zip = new AdmZip();

  self.listBoxes(function (err, boxes) {
    if (err) return callback(err);

    async.eachSeries(boxes, function (box, callback) {
      self.export(box.name, function (err, buffer) {
        if (err) return callback(err);

        zip.addFile('boxes/' + box.name + '.box', buffer);

        callback();
      });
    }, function (err) {
      if (err) return callback(err);

      return callback(null, zip.toBuffer());
    });
  });
};

BoxesAPI.prototype.importAll = function (bytes, callback) {
  var self = this;

  var AdmZipUtil = require('adm-zip/util');
  var ZipFile = require('adm-zip/zipFile');

  var zip = new ZipFile(bytes, AdmZipUtil.Constants.BUFFER);

  var entries = zip.entries;

  self.users.getMasterUser(function (err, userAlias) {
    if (err) return callback(err);

    async.eachSeries(entries, function (entry, entryCallback) {
      if (entry.entryName.indexOf('boxes/') !== 0) return entryCallback();

      var boxName = zip.getEntry('boxname.txt').getData().toString();

      self.getBox(boxName, function (err, box) {
        if (err) return entryCallback(err);

        if (!box) {
          self.createBox(boxName, userAlias, function (err) {
            if (err) return entryCallback();

            self.import(boxName, entry.getData(), entryCallback);
          });
        } else self.import(boxName, entry.getData(), entryCallback);
      });
    }, callback);

    self.listBoxes(function (err, boxes) {
      if (err) return callback(err);

      async.eachSeries(boxes, function (box, callback) {
        self.export(box.name, function (err, buffer) {
          if (err) return callback(err);

          zip.addFile('boxes/' + box.name + '.box', buffer);

          callback();
        });
      }, function (err) {
        if (err) return callback(err);

        return callback(null, zip.toBuffer());
      });
    });
  });
};

module.exports = function (config, db, users, collections, eventBus, callback) {
  var api = new BoxesAPI(db, users, collections, eventBus);

  callback(null, api);
};
