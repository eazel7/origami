var assert = require('assert'),
    collections = require('../collections'),
    config = require('./config'),
    restoreTestingData = require('./restoreTestingData'),
    checkDataExists = require('./checkDataExists'),
    checkDataDoNotExists = require('./checkDataDoNotExists');

function dummyCollectionWrapper(collection, info, callback) {
  callback(null, collection);
}

beforeEach(function (done) {
  this.timeout(6000);

  restoreTestingData(require('./singleDbData'), done);
});

describe('dbBoxes', function () {
  describe('#exports(config)', function () {
    it('Instantiates the api', function (done) {
      collections(config, dummyCollectionWrapper, function (err, api) {
        assert.equal(err, undefined);
        done();
      });
    });
  });

  describe('#createCollection', function () {
    it('Create a new collection', function (done) {
      collections(config, dummyCollectionWrapper, function (err, api) {
        api.createCollection("existing-box", "new-collection", function (err, collection) {
          assert.equal(err, null);
          checkDataExists({
            collection: "boxes",
            data: [{
              name: "existing-box",
              collections: {
                "new-collection": {
                  $exists: {
                    "database": "origami-test",
                    "collection": "existing-box-new-collection"
                  }
                }
              }
            }]
          }, function () {
            done();
          });
        });
      });
    });
  });

  describe("#getCollection", function () {
    it("Returns a collection object", function (done){
      collections(config, dummyCollectionWrapper, function (err, api) {
        api.getCollection("existing-box", "user-collection", function (err, collection) {
          assert(collection);
          done();
        });
      });
    });
  });

  describe("#getCollections", function () {
    it("Returns a list of collection names, excluding sync: false", function (done){
      collections(config, dummyCollectionWrapper, function (err, api) {
        api.getCollections("existing-box", function (err, collections) {
          assert.notEqual(collections.indexOf("user-collection"), -1);
          assert.equal(collections.indexOf("admin-collection"), -1);
          assert.notEqual(collections.indexOf("offline-collection"), -1);
          assert.notEqual(collections.indexOf("log-collection"), -1);
          done();
        });
      });
    }); 
  });

  describe("#getCollection", function () {
    it("Collection is wrapped with collectionWrapper before being returned", function (done){
      collections(config, function (collection, info, callback) {
        assert.deepEqual(info, {
          collection: "user-collection",
          box: "existing-box"
        });
        collection.wrapped = true;

        callback (null, collection);
      }, function (err, api) {
        api.getCollection("existing-box", "user-collection", function (err, collection) {
          assert.equal(collection.wrapped, true);
          done();
        });
      });
    })
  });

  describe('#createCollection', function () {
    it('Create a new collection', function (done) {
      collections(config, dummyCollectionWrapper, function (err, api) {
        api.createCollection("existing-box", "new-collection", function (err, collection) {
          assert.equal(err, null);
          checkDataExists({
            collection: "boxes",
            data: [{
              name: "existing-box",
              collections: {
                "new-collection": {
                  $exists: {
                    "database": "origami-test",
                    "collection": "existing-box-new-collection"
                  }
                }
              }
            }]
          }, done);
        });
      });
    });
  });
  
  describe('#createServerCollection', function () {
    it('Create a new collection marked with sync:false', function (done) {
      collections(config, dummyCollectionWrapper, function (err, api) {
        api.createServerCollection("existing-box", "new-collection", function (err, collection) {
          assert.equal(err, null);
          checkDataExists({
            collection: "boxes",
            data: [{
              name: "existing-box",
              collections: {
                "new-collection": {
                  $exists: {
                    "database": "origami-test",
                    "sync": false,
                    "collection": "existing-box-new-collection"
                  }
                }
              }
            }]
          }, done);
        });
      });
    });
  });
});
