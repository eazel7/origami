var target = require('../controllers/authentication'),
    assert = require('assert');

describe('Authentication', function () {
  describe('#isRequestAllowed', function () {
    it('Should invoke callback(null, false) if user is forbidden', function (done) {
      target({
        settings: {
          get: function(key, callback) {
            assert.equal(key, "master-user");
            callback(undefined);
          }
        },
        boxes: {
          getBox: function (boxName, callback) {
            callback(null, {
              "owner": "not-that-user"
            });
          }
        },
        users: {
          getUserRole: function (userAlias, boxName, callback) {
            assert.equal(userAlias, "some-user");
            assert.equal(boxName, "some-box");
            callback(null, undefined);
          }
        }
      }).isAllowed({
        session: {
          user: {
            alias: "some-user"
          }
        },
        params: {
          boxName: "some-box"
        }
      }, function (err, allowed) {
        assert.strictEqual(allowed, false);
        done();
      });
    });

    it('Should invoke callback(null, true) if comes with the right apikey', function (done) {
      target({
        settings: {
          get: function(key, callback) {
            assert.equal(key, "master-user");
            callback(undefined);
          }
        },
        boxes: {
          getBox: function (boxName, callback) {
            callback(null, {
              "apiKey": "abcd-1234"
            });
          }
        }
      }).isAllowed({
        headers: {
          "apikey": "abcd-1234"
        },
        params: {
          boxName: "some-box"
        }
      }, function (err, allowed) {
        assert.strictEqual(allowed, true);
        done();
      });
    });

    it('Should invoke callback(null, true) if user is allowed', function (done) {
      debugger;
      target({
        settings: {
          get: function(key, callback) {
            assert.equal(key, "master-user");
            callback(undefined);
          }
        },
        boxes: {
          getBox: function (boxName, callback) {
            callback(null, {
              "owner": "not-that-user"
            });
          }
        },
        users: {
          getUserRole: function (userAlias, boxName, callback) {
            assert.equal(userAlias, "some-user");
            assert.equal(boxName, "some-box");
            callback(null, "user");
          }
        }
      }).isAllowed({
        session: {
          user: {
            alias: "some-user"
          }
        },
        params: {
          boxName: "some-box"
        }
      }, function (err, allowed) {
        assert.strictEqual(allowed, true);
        done();
      });
    });

    it('Should invoke callback(null, true) if user is master user', function (done) {
      target({
        settings: {
          get: function(key, callback) {
            assert.equal(key, "master-user");
            callback("the-user");
          }
        },
      }).isAllowed({
        session: {
          user: {
            alias: "the-user"
          }
        },
        params: {
          box: "the-box"
        }
      }, function (err, allowed) {
        assert.strictEqual(allowed, true);
        done();
      });
    });

    it('Should invoke callback(null, true) if user is the box owner', function (done) {
      target({
        boxes: {
          getBox: function (boxName, callback) {
            callback(null, {
              owner: "the-user"
            });
          }
        },
        settings: {
          get: function(key, callback) {
            assert.equal(key, "master-user");
            callback(undefined);
          }
        },
      }).isAllowed({
        session: {
          user: {
            alias: "the-user"
          }
        },
        params: {
          box: "some-box"
        }
      }, function (err, allowed) {
        assert.strictEqual(allowed, true);
        done();
      });
    });
  });
});
