var config = require('./config'),
    mongo = require('mongodb'),
    MongoClient = mongo.MongoClient,
    Server = mongo.Server,
    Grid = mongo.Grid,
    async = require('async');
    
module.exports = function (fixture, allDone) {
  var client = new MongoClient(new Server(config.mongo.host, config.mongo.port));
  
  client
  .open(function (err, client) {
    if (err) console.log(err, client); 
    client
    .db(config.mongo.authenticationDatabase || config.mongo.database)
    .authenticate(config.mongo.username, config.mongo.password, function (err, result) {
      async.each(fixture, function (bundle, bundleCallback) {
        if (bundle.collection) {
        client.db(bundle.database)
        .dropCollection(bundle.collection, function () {
          if (bundle.data && bundle.data.length) {
            client.db(bundle.database).collection(bundle.collection)
            .insert(bundle.data, bundleCallback);
          } else {
            bundleCallback();
          }
        });
        } else if (bundle.grid) {
          var db = client.db(bundle.database);
          
          db.collection(bundle.grid + ".files").drop(function () {
            db.collection(bundle.grid + ".chunks").drop(function () {
              var grid = new Grid(client.db(bundle.database), bundle.grid);
              
              async.each(bundle.data, function (gridFile, gridFileCallback) {
                var buffer = require('fs').readFileSync(gridFile.file);
                
                var metadata = {};
                
                if (gridFile.metadata) {
                  for (var k in gridFile.metadata) {
                    metadata[k] = gridFile.metadata[k];
                  }
                }
                
                grid.put(buffer, {metadata: metadata}, gridFileCallback);
              }, bundleCallback);
            });
          });
        }
      }, function (err) {
        client.close();
        allDone(err);
      });
    });
  });
};
