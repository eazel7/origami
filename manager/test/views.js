var views = require('../controllers/views'),
    assert = require('assert');

describe('ViewsCtrl', function () {
  describe('#getViews', function () {
    it ('Returns the view names', function (done) {
      views({
        getViews: function (boxName, callback) {
          assert.equal(boxName, 'my-box');
          callback(null, ['view-1']);
        }
      })
      .getViews({
        params: {
          box: 'my-box'
        }
      }, {
        json: function (data) {
          assert.deepEqual(data, ['view-1']);
          done();
        }
      });
    });
  });
});
