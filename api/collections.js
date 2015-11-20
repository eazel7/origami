/* eslint-disable semi */

function CollectionsAPI (db, collectionWrapper, router) {
  this.db = db;
  this.collectionWrapper = collectionWrapper;
  this.router = router;
}

CollectionsAPI.prototype.getCollection = function (boxName, collectionName, callback) {
  var self = this;

  if (!boxName) callback('No box name');
  if (!collectionName) callback('No collection name');

  self.router.routeCollection(boxName, collectionName, function (err, route) {
    if (err) return callback(err);

    self.collectionWrapper.wrap(self.db
      .db(route.database)
      .collection(route.collection), {
        'box': boxName,
        'collection': collectionName
      }, callback);
  });
};

CollectionsAPI.prototype.find = function (boxName, collectionName, predicate, callback) {
  var self = this;

  self.getCollection(boxName, collectionName, function (err, collection) {
    if (err) return callback(err);

    collection.find(predicate, callback);
  });
};

CollectionsAPI.prototype.count = function (boxName, collectionName, predicate, callback) {
  var self = this;

  self.getCollection(boxName, collectionName, function (err, collection) {
    if (err) return callback(err);

    collection.count(predicate, callback);
  });
};

CollectionsAPI.prototype.findOne = function (boxName, collectionName, predicate, callback) {
  var self = this;

  self.getCollection(boxName, collectionName, function (err, collection) {
    if (err) return callback(err);

    collection.findOne(predicate, callback);
  });
};

CollectionsAPI.prototype.update = function (boxName, collectionName, predicate, replacement, callback, browserKey) {
  var self = this;

  self.getCollection(boxName, collectionName, function (err, collection) {
    if (err) return callback(err);

    collection.update(predicate, replacement, callback);
  });
};

CollectionsAPI.prototype.remove = function (boxName, collectionName, predicate, callback, browserKey) {
  var self = this;

  self.getCollection(boxName, collectionName, function (err, collection) {
    if (err) return callback(err);

    collection.remove(predicate, callback);
  });
};

CollectionsAPI.prototype.insert = function (boxName, collectionName, object, callback, browserKey) {
  var self = this;

  self.getCollection(boxName, collectionName, function (err, collection) {
    if (err) return callback(err);

    collection.insert(object, callback);
  });
};

CollectionsAPI.prototype.getCollections = function (boxName, callback) {
  var self = this;

  if (!boxName) return callback('Box does not exists');

  self.db
  .collection('boxes')
  .findOne({
    name: boxName
  }, function (err, box) {
    if (err) return callback(err);
    if (!box) return callback('Box does not exists');

    var collections = [];

    for (var name in box.collections) {
      collections.push(name);
    }

    callback(null, collections);
  });
};

CollectionsAPI.prototype.createCollection = function (boxName, collectionName, callback) {
  var self = this;

  if (!boxName) callback('No box name');
  if (!collectionName) callback('No collection name');

  self.db
  .collection('boxes')
  .findOne({
    name: boxName
  }, function (err, box) {
    if (err) return callback(err);

    var collections = box.collections || {};

    self.router.routeCollection(boxName, collectionName, function (err, route) {
      if (err) return callback(err);

      collections[collectionName] = {
        database: route.database,
        collection: route.collection
      };

      self.db
      .collection('boxes')
      .update({
        name: boxName
      }, {
        $set: {
          collections: collections
        }
      }, function (err) {
        callback(err);
      });
    });
  });
};

CollectionsAPI.prototype.createServerCollection = function (boxName, collectionName, callback) {
  var self = this;

  self.db
  .collection('boxes')
  .findOne({
    name: boxName
  }, function (err, box) {
    if (err) return callback(err);

    var collections = box.collections || {};

    self.router.routeCollection(boxName, collectionName, function (err, route) {
      if (err) return callback(err);

      collections[collectionName] = {
        database: route.database,
        collection: route.collection,
        sync: false
      };

      self.db
      .collection('boxes')
      .update({
        name: boxName
      }, {
        $set: {
          collections: collections
        }
      }, function (err) {
        callback(err);
      });
    });
  });
};

CollectionsAPI.prototype.destroyCollection = function (boxName, collectionName, callback) {
  var self = this;
  var unset = {};

  unset['collections.' + collectionName] = '';

  var filter = {
    name: boxName
  };
  var replacement = {
    $unset: unset
  };

  self.db
  .collection('boxes')
  .update(filter, replacement, callback);
};

module.exports = function (db, collectionWrapper, router, callback) {
  var collections = new CollectionsAPI(db, collectionWrapper, router);

  callback(null, collections);
};
