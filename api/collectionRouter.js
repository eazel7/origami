module.exports = function (config, db, callback) {
  callback(null, {
    routeCollection: function (boxName, collectionName, callback) {
      db
      .collection('boxes')
      .findOne({
        "name": boxName
      }, function (err, box) {
        var collection;
        if (box && box.collections) {
          collection = box.collections[collectionName];

          if (collection) return callback(null, {
            database: collection.database,
            collection: collection.collection
          });
        
          if (config.singleDbMode) {
            return callback(null, {
              database: config.mongo.database,
              collection: boxName + '-' + collectionName
            });
          }
        }
        else if (config.singleDbMode) {
          return callback(null, {
            database: config.mongo.database,
            collection: boxName + '-' +  collectionName
          });
        }
      });
    }
  });
};
