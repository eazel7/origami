module.exports = function (config, connect, collectionWrapper, router, callback) {
  connect(function (err, db) {
    callback(null, {
      getCollection: function (boxName, collectionName, callback) {
        if (!boxName) callback(new Error("No box name"));
        if (!collectionName) callback(new Error("No collection name"));
        
        router.routeCollection(boxName, collectionName, function (err, route) {
          collectionWrapper.wrap(db
            .db(route.database)
            .collection(route.collection), {
              "box": boxName,
              "collection": collectionName
            }, callback);
        });
      },
      getCollections: function (boxName, callback) {
        db
        .collection("boxes")
        .findOne({
          name: boxName
        }, function (err, box) {
          var collections = [];

          for (var name in box.collections) {
            if (box.collections[name].sync === undefined || box.collections[name].sync !== false) {
              collections.push(name);
            }
          }

          callback(null, collections);
        });
      },
      createCollection: function (boxName, collectionName, callback) {
        if (!boxName) callback(new Error("No box name"));
        if (!collectionName) callback(new Error("No collection name"));
        
        db
        .collection("boxes")
        .findOne({
          name: boxName
        }, function (err, box) {
          var collections = box.collections || {};

          router.routeCollection(boxName, collectionName, function (err, route) {
            collections[collectionName] = {
              database: route.database,
              collection: route.collection
            };

            db
            .collection("boxes")
            .update({
              name: boxName
            }, {
              $set: {
                collections: collections
              }
            }, {
              journal: true
            }, function (err) {
              callback(err);
            });
          });
        });
      },
      createServerCollection: function (boxName, collectionName, callback) {
        db
        .collection("boxes")
        .findOne({
          name: boxName
        }, function (err, box) {
          var collections = box.collections || {};

          router.routeCollection(boxName, collectionName, function (err, route) {
            collections[collectionName] = {
              database: route.database,
              collection: route.collection,
              sync: false
            };

            db
            .collection("boxes")
            .update({
              name: boxName
            }, {
              $set: {
                collections: collections
              }
            }, {
              journal: true
            }, function (err) {
              callback(err);
            });
          });
        });
      },
      destroyCollection: function (boxName, collectionName, callback) {
        var unset = {};
        unset["collections."  + collectionName] = "";
        
        var filter = {
          name: boxName
        }, replacement = {
          $unset: unset
        };
        console.log(filter, replacement);
        db
        .collection("boxes")
        .update(filter, replacement, {
          journal: true
        }, callback);
      }
    });
  });
}
