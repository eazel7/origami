/* eslint-disable semi */

var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;

function RemoteDbsAPI (db, connect) {
  this.db = db;
  this.connect = connect;
  this.dbs = {};
}

RemoteDbsAPI.prototype.getCollection = function (boxName, dbalias, collectionName, callback) {
  var self = this;

  self.db
  .collection('remote_dbs')
  .findOne({
    box: boxName,
    name: dbalias
  }, function (err, doc) {
    if (err) return callback(err);

    if (!doc) return callback(new Error('Database not defined'));

    if (self.dbs[doc.url]) {
      return callback(null, self.dbs[doc.url].collection(collectionName));
    } else {
      MongoClient.connect(doc.url, function (err, db) {
        if (err) return callback(err);

        self.dbs[doc.url] = db;

        callback(null, db.collection(collectionName));
      });
    }
  });
};

RemoteDbsAPI.prototype.listForBox = function (box, callback) {
  var self = this;

  self.db
  .collection('remote_dbs')
  .find({
    box: box
  })
  .toArray(callback);
};

RemoteDbsAPI.prototype.unsetForBox = function (boxName, dbalias, callback) {
  var self = this;

  self.db
  .collection('remote_dbs')
  .remove({
    box: boxName,
    name: dbalias
  }, {
    w: 1
  },
  callback);
};

RemoteDbsAPI.prototype.setForBox = function (boxName, dbalias, url, callback) {
  var self = this;

  if (!boxName) return callback(new Error('Missing box name'));
  if (!dbalias) return callback(new Error('Missing db alias'));
  if (!url) return callback(new Error('Missing db url'));

  self.db
  .collection('remote_dbs')
  .findOne({
    box: boxName,
    name: dbalias
  }, function (err, doc) {
    if (err) return callback(err);

    if (!doc) {
      self.db
      .collection('remote_dbs')
      .insert({
        box: boxName,
        name: dbalias,
        url: url
      }, { w: 1 }, callback);
    } else {
      self.db
      .collection('remote_dbs')
      .update({
        box: boxName,
        name: dbalias
      }, {
        $set: {
          url: url
        }
      }, { w: 1 }, callback);
    }
  });
};

module.exports = RemoteDbsAPI;
