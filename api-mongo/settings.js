module.exports = function (config, callback) {
  require('./connect')(config.mongo, function (err, db) {
    callback({
      get: function (key, callback) {
        db
        .collection("config")
        .findOne({
          "key": key
        }, function (err, doc) {
          if (doc) {
            callback(err, doc.value);
          } else {
            callback(err, undefined);
          }
        });
      },
      set: function (key, value, callback) {
        if (value !== undefined) {
          db
          .collection("config")
          .update({
            "key": key
          }, {
            $set: {
              "key": key,
              "value": value
            }
          }, {
            upsert: true
          }, callback || function () {});
        } else {
          db
          .collection("config")
          .remove({
            "key": key
          }, callback || function () {});
        }
      }
    });
  });
};
