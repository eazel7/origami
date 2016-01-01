/* eslint-disable semi */

module.exports = function (options, callback) {
  var mongo = require('mongodb');
  var MongoClient = mongo.MongoClient;
  var Server = mongo.Server;

  var server = new Server(options.host, options.port);
  var client = new MongoClient(server);

  client.open(function (err, client) {
    if (err) return callback(err);

    if (options.username && options.password) {
      var db = client
      .db(options.authenticationDatabase || options.database);

      db
      .authenticate(options.username, options.password, function (err, result) {
        if (err) return callback(err);

        if (result) {
          callback(err, db.db(options.database));
        } else {
          callback(new Error('authentication failed'));
        }
      });
    } else {
      return callback(err, client.db(options.database));
    }
  });
}
