module.exports = function (db, connect, callback) {
  var dbs = {},
      mongo = require("mongodb"),
      MongoClient = mongo.MongoClient,
      Server = mongo.Server;
    
  callback(null, {
    getCollection: function (boxName, dbalias, collectionName, callback) {
      db
      .collection("remote_dbs")
      .findOne({
        box: boxName,
        name: dbalias
      }, function (err, doc) {
        if (err) return callback (err);
        
        if (!doc) return callback (new Error("Database not defined"));
        
        if (dbs[doc.url]) {
          return callback (null, dbs[doc.url].collection(collectionName));
        } else {
          MongoClient.connect(doc.url, function (err, db) {
            if (err) return callback (err);
            
            dbs[doc.url] = db;

            callback (null, db.collection(collectionName));
          });
        }
      });
    },
    listForBox: function (box, callback) {
      db
      .collection("remote_dbs")
      .find({
        box: box
      })
      .toArray(callback);
    },
    unsetForBox: function (boxName, dbalias, callback) {
      db
      .collection("remote_dbs")
      .remove({
        box: boxName,
        name: dbalias
      }, { w: 1 },callback);
    },
    setForBox: function (boxName, dbalias, url, callback) {
      if (!box || !name || !url) return callback (new Error("Missing parameters"));
    
      db
      .collection("remote_dbs")
      .findOne({
        box: boxName,
        name: dbalias
      }, function (err, doc) {
        if (!doc) {
          db
          .collection("remote_dbs")
          .insert({
            box: boxName,
            name: dbalias,
            url: url
          }, { w: 1 }, callback);
        } else {
        
          db
          .collection("remote_dbs")
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
    }
  });
};
