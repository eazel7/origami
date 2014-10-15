var target = require('../controllers/users'),
    assert = require('assert');

describe('UsersCtrl', function () {
  describe('#listUsers', function () {
    it ('Returns the list of users', function (done) {
      target({
        users: {
          listUsers: function (callback) {
            callback(null, [{
              alias: 'john-doe',
              displayName: 'John Doe'
            }]);
          }
        }
      })
      .listUsers({}, {
        json: function (data) {
          assert.deepEqual(data, [{alias: 'john-doe', displayName: 'John Doe'}]);
          done();
        }
      });
    });
  });
  
  describe("#setRole", function () {
    it('Invokes enableUser with the requested role', function (done) {
      var resStatus;
      target({
        users: {
          enableUser: function(userAlias, boxName, role, callback) {
            assert.equal(userAlias, 'the-user');
            assert.equal(boxName, 'the-box');
            assert.equal(role, 'the-role');
            callback();
          }
        }
      })
      .setRole({
        params: {
          userAlias: 'the-user',
          boxName: 'the-box'
        },
        body: {
          role: 'the-role'
        }
      }, {
        status: function (status) {
          resStatus = status;
        },
        end: function () {
          assert.equal(resStatus, 200);
          done();
        }
      });
    });
    
    it('Invokes disable user if the role is empty', function (done) {
      var resStatus;
      target({
        users: {
          disableUser: function(userAlias, boxName, callback) {
            assert.equal(userAlias, 'the-user');
            assert.equal(boxName, 'the-box');
            callback();
          }
        }
      })
      .setRole({
        params: {
          userAlias: 'the-user',
          boxName: 'the-box'
        }
      }, {
        status: function (status) {
          resStatus = status;
        },
        end: function () {
          assert.equal(resStatus, 200);
          done();
        }
      });
    });
  });
    
  describe('#getUser', function () {
    it('Returns a user profile by its alias', function (done) {
      target({
        users: {
          getUser: function(userAlias, callback) {
            callback(null, {
              alias: 'the-user-alias',
              displayName: 'the-user-display-name'
            });
          }
        }
      })
      .getUser({
        params: {
          userAlias: 'the-user'
        }
      }, {
        json: function (data) {
          assert.deepEqual(data, {
            'alias': 'the-user-alias',
            'displayName': 'the-user-display-name'
          });
          done();
        }
      });
    });
   
    it('Returns a user profile by its alias', function (done) {
      var resStatus;
      target({
        users: {
          getUser: function(userAlias, callback) {
            callback(null, undefined);
          }
        }
      })
      .getUser({
        params: {
          userAlias: 'the-user'
        }
      }, {
        status: function (status) {
          resStatus = status;
        },
        end: function () {
          assert.equal(resStatus, 404);
          done();
        }
      });
    });
  });
});
