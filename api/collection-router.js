/* eslint-disable semi */

var debug = require('debug')('origami:collection-router');
var shortid = require('shortid');

function CollectionRouter (db, collectionsDbName) {
  this.db = db;
  this.collectionsDbName = collectionsDbName;
};

CollectionRouter.prototype.routeCollection = function (boxName, collectionName, callback) {
  var self = this;

  debug('routeCollection %s, %s', boxName, collectionName);

  self.db
  .collection('boxes')
  .findOne({
    'name': boxName
  }, function (err, box) {
    if (err) return callback(err);

    if (!box) return callback('box not found');

    var collections = box.collections || {};

    if (collections[collectionName]) return callback(null, collections[collectionName]);
    else {
      var route = collections[collectionName] = {
        database: self.collectionsDbName,
        collection: [boxName, collectionName, shortid.generate()].join('_')
      };
      
      self.db.collection('boxes').update({name: boxName}, {$set: {collections: collections } }, function (err) {
        if (err) return callback(err);
        
        callback(null, route);
      });
    }
  });
};

module.exports = CollectionRouter;
