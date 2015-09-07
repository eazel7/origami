var assert = require('assert'),
    syncCollectionWrapper = require('../syncCollectionWrapper'),
    config = require('./config'),
    checkDataExists = require('./checkDataExists'),
    restoreTestingData = require('./restoreTestingData');
    
describe("SyncCollectionWrapper", function () {
  beforeEach(function (done) {
    this.timeout(60000);
    
    restoreTestingData(require('./singleDbData'), done);
  });

  it("Wraps collection into the same database if singleDbMode is on", function (done) {
    syncCollectionWrapper(config, function (err, wrapper) {
      wrapper.wrap({
        insert: function (dummy, callback) {
          callback();
        }
      }, {
        "box": "existing-box",
        "database": "origami-test",
        "collection": "synced-collection"
      }, function (err, wrapped) {
        wrapped.insert({}, function (err) {
          checkDataExists([{
            "database": "origami-test",
            "collection": "existing-box-_syncLog",
            "data": [{
              "op": "insert"
            }]
          }], done);
        });
      });
    });
  });
});
