var assert = require('assert'),
    collectionRouter = require('../collectionRouter'),
    config = require('./config'),
    restoreTestingData = require('./restoreTestingData');

beforeEach(function (done) {
  this.timeout(6000);
  
  restoreTestingData(require('./singleDbData'), done);
});

describe("collectionRouter", function () {
  it("#routeCollection returns existing route data", function (done) {
    collectionRouter(config, function (err, router) {
      router.routeCollection("existing-box", "user-collection", function (err, routed) {
        assert.equal(routed.database, "origami-test");
        assert.equal(routed.collection, "existing-box-user-collection");
        
        done(err);
      });
    });
  });
  it("#routeCollection returns default route data for existing boxes", function (done) {
    collectionRouter(config, function (err, router) {
      router.routeCollection("existing-box", "new-collection", function (err, routed) {
        assert.equal(routed.database, "origami-test");
        assert.equal(routed.collection, "existing-box-new-collection");
        
        done(err);
      });
    });
  });
  it("#routeCollection returns default route data for new boxes", function (done) {
    collectionRouter(config, function (err, router) {
      router.routeCollection("new-box", "new-collection", function (err, routed) {
        assert.equal(routed.database, "origami-test");
        assert.equal(routed.collection, "new-box-new-collection");
        
        done(err);
      });
    });
  });
});
