/* eslint-disable semi */

function Settings (db) {
  this.db = db;
}

Settings.prototype.get = function (key, callback) {
  var self = this;

  self.db
  .collection('config')
  .findOne({
    'key': key
  }, function (err, doc) {
    if (doc) {
      callback(err, doc.value);
    } else {
      callback(err, undefined);
    }
  });
};

Settings.prototype.set = function (key, value, callback) {
  var self = this;

  if (value !== undefined) {
    self.db
    .collection('config')
    .update({
      'key': key
    }, {
      $set: {
        'key': key,
        'value': value
      }
    }, {
      upsert: true
    }, callback || function () {});
  } else {
    self.db
    .collection('config')
    .remove({
      'key': key
    }, callback || function () {});
  }
};

module.exports = Settings;
