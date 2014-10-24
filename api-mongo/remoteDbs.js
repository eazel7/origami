module.exports = function (config, connect, callback) {
  var dbs = {},
      mongo = require("mongodb"),
      MongoClient = mongo.MongoClient,
      Server = mongo.Server;

  connect(function (err, db) {
    if (err) return callback (err);
    
    callback(null, {
      getCollection: function (box, name, collectionName, callback) {
        db
        .collection("remote_dbs")
        .findOne({
          box: box,
          name: name
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
      unserForBox: function (box, name, callback) {
        db
        .collection("remote_dbs")
        .remove({
          box: box,
          name: name
        }, { w: 1 },callback);
      },
      setForBox: function (box, name, url, callback) {
        if (!box || !name || !url) return callback (new Error("Missing parameters"));
      
        db
        .collection("remote_dbs")
        .findOne({
          box: box,
          name: name
        }, function (err, doc) {
          if (!doc) {
            db
            .collection("remote_dbs")
            .insert({
              box: box,
              name: name,
              url: url
            }, { w: 1 }, callback);
          } else {
          
            db
            .collection("remote_dbs")
            .update({
              box: box,
              name: name
            }, {
              $set: {
                url: url
              }
            }, { w: 1 }, callback);
          }
        });
      }
    });
  });
};
