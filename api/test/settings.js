var assert = require('assert'),
    target = require('../settings'),
    config = require('./config'),
    restoreTestingData = require('./restoreTestingData'),
    checkDataExists = require('./checkDataExists'),
    checkDataDoNotExists = require('./checkDataDoNotExists');

beforeEach(function (done) {
  this.timeout(6000);
  
  restoreTestingData(require('./singleDbData'), function () {
    done();
  });
});
    
describe('apiConfig', function () {
  describe('#set', function () {
    it("Inserts a document if value is provided and it doesn't exist", function (done) {
      target(config, function (settings) {
        settings.set('new-value', 42, function (value) {
          checkDataExists([{
            "database": "origami-test",
            "collection": "config",
            "data": [{
              "key": "new-value",
              "value": 42
            }]
          }], done);
        });
      });
    });
    it("Updates a document if value is provided and document exists", function (done) {
      target(config, function (settings) {
        settings.set('some-value', false, function (value) {
          checkDataExists([{
            "database": "origami-test",
            "collection": "config",
            "data": [{
              "key": "some-value",
              "value": false
            }]
          }], done);
        });
      });
    });
    it("Removes a document if value is undefined", function (done) {
      target(config, function (settings) {
        settings.set('some-value', undefined, function (value) {
          checkDataDoNotExists([{
            "database": "origami-test",
            "collection": "config",
            "data": [{
              "key": "some-value"
            }]
          }], done);
        });
      });
    });
  });
  describe('#get', function () {
    it('Returns undefined if value is not set', function (done) {
      target(config, function (settings) {
        settings.get('unset-value', function (value) {
          assert.strictEqual(value, undefined);
          done();
        });
      });
    });
    it('Returns the value if value is set', function (done) {
      target(config, function (settings) {
        settings.get('some-value', function (value) {
          assert.strictEqual(value, true);
          done();
        });
      });
    });
  });
});
