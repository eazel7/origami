var config = require('./config'),
    mongo = require('mongodb'),
    MongoClient = mongo.MongoClient,
    Server = mongo.Server,
    async = require('async'),
    assert = require('assert');
    
module.exports = function (dataToCheck, allDone) {
  new MongoClient(new Server(config.mongo.host, config.mongo.port), {})
  .open(function (err, client) {
    client
    .db(config.mongo.authenticationDatabase || config.mongo.database)
    .authenticate(config.mongo.username, config.mongo.password, function (err, result) {
      async.each(dataToCheck, function (bundle, collectionCallback) {
        async.each(bundle.data, function (doc, bundleCallback) {
          client.db(bundle.database || config.mongo.database)
          .collection(bundle.collection)
          .count(doc, function (err, count) {
            bundleCallback(count === 1 ? undefined : 'Data check failed: ' + bundle.collection + '/' + JSON.stringify(doc));
          });
        }, collectionCallback);
      }, function (err) {
        client.close();
        allDone(err);
      });
    });
  });
};
