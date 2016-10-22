/* eslint-disable semi */

module.exports = function (options, callback) {
  var mongo = require('mongodb');
  var MongoClient = mongo.MongoClient;

  MongoClient.connect(options, callback);
}
