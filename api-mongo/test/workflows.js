var assert = require('assert'),
    target = require('../workflows'),
    config = require('./config'),
    checkDataDoNotExists = require('./checkDataDoNotExists'),
    checkDataExists = require('./checkDataExists');

describe ('noflo workflows API', function () {
  beforeEach(function (done) {
    require('./restoreTestingData')(require('./singleDbData'), done);
  })
  var connect = function (callback) {
    var MongoClient = require('mongodb').MongoClient,
        Server = require('mongodb').Server;

    new MongoClient(new Server(config.mongo.host, config.mongo.port), {})
    .open(function (err, client) {
      var db = client.db(config.mongo.database);
      db.authenticate(config.mongo.username, config.mongo.password, function (err, result) {
        if (result) return callback (err, db);
        else return callback (err);
      });
    });
  },
  fakeApi = {
    "connect": connect,
    "config": config,
    "collections": {
      getCollection: function (boxName, collectionName, callback) {
        assert.equal(boxName, "my-box");
        assert.equal(collectionName, "_graphs");
        connect(function (err, db) {
          callback(err, {
            find: function (predicate, callback) {
              db.collection('my-box-_graphs').find(predicate).toArray(callback);
            },
            insert: function (object, callback) {
              db.collection('my-box-_graphs').insert(object, {w: 1}, function (err, doc) {
                if (doc && doc[0]) return callback(err, doc[0]);
                callback(err, doc);
              });
            },
            update: function (predicate, replacement, callback) {
              db.collection('my-box-_graphs').update(predicate, replacement, {w: 1}, function (err, doc) {
                return callback(err, replacement._id);
              });
            }
          });
        });
      }
    }
  };

  it('lists all graphs', function (done) {
    target(fakeApi, function (err, host) {
      host.listGraphs('my-box', function (err, graphs) {
        assert.equal(graphs[0].name, "My graph")
        done(err);
      });
    });
  });

  describe("#saveGraph", function () {
    it('saves a graph', function (done) {
      target(fakeApi, function (err, host) {
        host.saveGraph('my-box', {
          name: "Another graph",
          graph: {
          }
        }, function (err, graphId) {
          checkDataExists([{
            collection: 'my-box-_graphs',
            data: [{
              "name": "Another graph"
            }]
          }], done);
        });
      });
    });

    it('updates a graph', function (done) {
      target(fakeApi, function (err, host) {
        host.saveGraph('my-box', {
          _id: "someId",
          name: "Updated graph",
          graph: {
          }
        }, function (err, graphId) {
          checkDataExists([{
            collection: 'my-box-_graphs',
            data: [{
              "_id": "someId",
              "name": "Updated graph"
            }]
          }], done);
        });
      });
    });
  });

  describe("#removeGraph", function () {
    it("Removes a graph", function (done) {
      target(fakeApi, function (err, host) {
        host.removeGraph('my-box', 'someId', function (err) {
          checkDataDoNotExists([{
            collection: 'my-box-_graphs',
            data: [{
              "_id": "someId"
            }]
          }]);
        });
      })
      done();
    });
  })
})
