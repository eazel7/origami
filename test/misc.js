var target = require('../controllers/misc'),
    assert = require('assert');

describe('MiscCtrl', function () {
  describe('#masterUser', function () {
    it ('Returns the master-user from settigns', function (done) {
      target({
        settings: {
          get: function (key, callback) {
            assert.equal(key, "master-user");
            callback("john-doe");
          }
        }
      })
      .masterUser({
      }, {
        json: function (data) {
          assert.equal(data, "john-doe");
          done();
        }
      });
    });
  });
});
