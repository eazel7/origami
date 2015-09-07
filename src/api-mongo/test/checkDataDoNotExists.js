var config = require('./config'),
    mongo = require('mongodb'),
    MongoClient = mongo.MongoClient,
    Server = mongo.Server,
    async = require('async'),
    assert = require('assert');
    
module.exports = function (dataToCheck, done) {
  new MongoClient(new Server(config.mongo.host, config.mongo.port), {})
  .open(function (err, client) {
    client
    .db(config.mongo.authenticationDatabase || config.mongo.database)
    .authenticate(config.mongo.username, config.mongo.password, function (err, result) {
      async.each(dataToCheck, function (bundle, callback) {
        async.each(bundle.data, function (doc, callback) {
          client.db(bundle.database || config.mongo.database)
          .collection(bundle.collection)
          .findOne(doc, function (err, data) {
            callback(data == null ? undefined : 'Data check failed: ' + bundle.collection + '/' + JSON.stringify(doc));
          });
        }, callback);
      }, function (err) {
        client.close();
        done(err);
      });
    });
  });
};
