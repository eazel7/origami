/* eslint-disable semi */

var mongo = require('mongodb');
var debug = require('debug')('origami:sync-wrapper');

function WrappedCollection (logCollection, base, info) {
  this.base = base;
  this.logCollection = logCollection;
  this.info = info;
}

WrappedCollection.prototype.find = function (predicate, callback) {
  var self = this;

  self.base.find(predicate)
  .toArray(function (err, doc) {
    callback(err, doc);
  });
};

WrappedCollection.prototype.count = function (predicate, callback) {
  var self = this;

  self.base.count(predicate, function (err, count) {
    callback(err, count);
  });
};

WrappedCollection.prototype.findOne = function (predicate, callback) {
  var self = this;

  self.base.findOne(predicate, function (err, doc) {
    callback(err, doc);
  });
};

WrappedCollection.prototype.update = function (predicate, replacement, callback, browserKey) {
  var self = this;

  self.base.update(predicate, replacement, function (err, result) {
    if (err) return callback(err);
    var op = {
      box: self.info.box,
      collection: self.info.collection,
      op: 'update',
      predicate: JSON.stringify(predicate, undefined, 2),
      replacement: JSON.stringify(replacement, undefined, 2),
      browserKey: browserKey,
      date: Date.now()
    };

    self.logCollection.insert(op, function (err) {
      if (err) console.error(err);
      else self.eventBus.emit('op', op);

      callback(err, result);
    });
  });
};

WrappedCollection.prototype.remove = function (predicate, callback, browserKey) {
  var self = this;

  self.base.remove(predicate, { multi: true }, function (err, result) {
    if (err) return callback(err);
    var op = {
      box: self.info.box,
      collection: self.info.collection,
      op: 'remove',
      predicate: JSON.stringify(predicate, undefined, 2),
      browserKey: browserKey,
      date: Date.now()
    };

    self.logCollection.insert(op, function (err) {
      if (err) console.log('logCollection.remove error: ' + err.toString());
      else self.eventBus.emit('op', op);

      callback(err, result);
    });
  });
};

WrappedCollection.prototype.insert = function (object, callback, browserKey) {
  var self = this;

  if (!object._id) {
    object._id = new mongo.ObjectID().toString();
  }

  self.base.insert(object, function (err, result) {
    if (err) return callback(err);

    var op = {
      box: self.info.box,
      collection: self.info.collection,
      op: 'insert',
      object: JSON.stringify(object, undefined, 2),
      browserKey: browserKey,
      date: Date.now()
    };

    self.logCollection.insert(op, function (err) {
      if (err) console.log('logCollection.insert error: ' + err.toString());
      else self.eventBus.emit('op', op);

      callback(err, result);
    });
  });
};

function SyncWrapper (db, router, eventBus) {
  this.db = db;
  this.router = router;
  this.eventBus = eventBus;
}

SyncWrapper.prototype.getLog = function (box, callback) {
  var self = this;
  debug('getLog %s', box);

  self.router.routeCollection(box, '_syncLog', function (err, route) {
    if (err) return callback(err);
    if (!route) return callback('No route to _syncLog collection');

    callback(null, self.db.db(route.database).collection(route.collection));
  });
};

SyncWrapper.prototype.wrap = function (base, info, callback) {
  var self = this;

  self.router
  .routeCollection(info.box, '_syncLog', function (err, route) {
    if (err) return callback(err);

    var logCollection = self.db.db(route.database).collection(route.collection);

    var wrapped = new WrappedCollection(logCollection, base, info);

    return callback(null, wrapped);
  });
};

module.exports = SyncWrapper;
