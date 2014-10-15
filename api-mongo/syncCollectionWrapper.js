var mongo = require('mongodb');

module.exports = function (config, connect, router, eventBus, callback) {
  connect(function (err, db) {
    callback(null, {
      getLog: function (box, callback) {
        router.routeCollection(box, "_syncLog", function (err, route) {
          callback(err, db.db(route.database).collection(route.collection));
        });
      },
      wrap: function (base, info, callback) {
        router.routeCollection(info.box, "_syncLog", function (err, route) {
          var logCollection = db.db(route.database).collection(route.collection);

          return callback(null, {
            find: function (predicate, callback) {
              base.find(predicate)
              .toArray(function (err, doc) {
                callback(err, doc);
              });
            },
            count: function (predicate, callback) {
              base.count(predicate, function (err, count) {
                callback(err, count);
              });
            },
            findOne: function(predicate, callback) {
              base.findOne(predicate, function (err, doc) {
                callback(err, doc);
              });
            },
            update: function (predicate, replacement, callback, browserKey) {
              base.update(predicate, replacement, function (err, result) {
                if (err) return callback(err);
                var op = {
                  box: info.box,
                  collection: info.collection,
                  op: 'update',
                  predicate: JSON.stringify(predicate, undefined, 2),
                  replacement: JSON.stringify(replacement, undefined, 2),
                  browserKey: browserKey,
                  date: Date.now()
                };
                
                logCollection.insert(op, function (err){
                  if (err) console.log('logCollection.insert error: ' + err.toString());
                  else eventBus.emit('op', op);

                  callback(err, result);
                });
              });
            },
            remove: function (predicate, callback, browserKey) {
              base.remove(predicate, { multi: true }, function (err, result){
                if (err) return callback(err);
                var op = {
                  box: info.box,
                  collection: info.collection,
                  op: 'remove',
                  predicate: JSON.stringify(predicate, undefined, 2),
                  browserKey: browserKey,
                  date: Date.now()
                };
                
                logCollection.insert(op, function (err){
                  if (err) console.log('logCollection.remove error: ' + err.toString());
                  else eventBus.emit('op', op);

                  callback (err, result);
                });
              });
            },
            insert: function (object, callback, browserKey) {
              if (!object._id) {
                object._id = new mongo.ObjectID().toString();
              }
              
              base.insert(object, function (err, result) {
                if (err) return callback (err);
                
                var op = {
                  box: info.box,
                  collection: info.collection,
                  op: 'insert',
                  object: JSON.stringify(object, undefined, 2),
                  browserKey: browserKey,
                  date: Date.now()
                };

                logCollection.insert(op, function (err){
                  if (err) console.log('logCollection.insert error: ' + err.toString());
                  else eventBus.emit('op', op);

                  callback(err, result);
                });
              });
            }
          });
        });
      }
    });
  });
};
