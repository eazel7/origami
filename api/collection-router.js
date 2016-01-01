/* eslint-disable semi */

var debug = require('debug')('origami:collection-router');

function CollectionRouter (db) {
  this.db = db;
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

    var collection;
    if (box && box.collections) {
      collection = box.collections[collectionName];

      if (collection) {
        return callback(null, {
          database: collection.database,
          collection: collection.collection
        });
      }
    }

    return callback('box/collection not found');
  });
};

module.exports = CollectionRouter;
