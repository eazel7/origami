var assert = require('assert'),
    config = require('./config'),
    restoreTestingData = require('./restoreTestingData'),
    checkDataExists = require('./checkDataExists'),
    checkDataDoNotExists = require('./checkDataDoNotExists'),
    users = require('../users');

beforeEach(function (done) {
  this.timeout(6000);

  restoreTestingData(require('./singleDbData'), function () {
    done();
  });
});

describe('dbUsers', function () {
  describe('#listUsers', function () {
    it('List existing users', function (done) {
      users(config, function (err, users) {
        users.listUsers(function (err, users) {
          assert.equal(users.length, 3);

          done(err);
        });
      });
    });
  });

  describe('#listBoxUsers', function () {
    it('List existing users with any role in a certain box', function (done) {
      users(config, function (err, users) {
        users.listBoxUsers("financial-system", function (err, users) {
          assert.equal(users.length, 1);

          done(err);
        });
      });
    });
  });

  describe('#getUser', function () {
    it('Gets an existing user', function (done) {
      users(config, function (err, users) {
        users.getUser('john-doe', function (err, user) {
          assert.equal(user.alias, "john-doe");
          assert.equal(user.displayName, "John Doe");
          assert.deepEqual(user.roles, {
            "ticket-system": "user"
          });
          done(err);
        });
      });
    });
  });

  describe('#enableUser', function () {
    before(function (done){
      checkDataDoNotExists([{
        "collection": "users",
        "data": [{
          "alias": "john-doe",
          "roles": {
            "financial-system": "user"
          }
        }]
      }], done);
    });

    it('Enables a user for a box', function (done) {
      users(config, function (err, users) {
        users.enableUser('john-doe', 'ticket-system', 'user', function (err) {
          checkDataExists([{
            "collection": "users",
            "data": [{
              "alias": "john-doe",
              "roles": {
                "ticket-system": "user"
              }
            }]
          }], done);
        });
      });
    });
  });

  describe('#registerUser', function () {
    it('Fails to register a user twice', function (done) {
      users(config, function (err, users) {
        users.registerUser("john-doe", "John Doe", function (err) {
          assert(err);
          done();
        })
      });
    });
    it('Register a new user', function (done) {
      before(function (done){
        checkDataDoNotExists([{
          "collection": "users",
          "data": [{
            "alias": "new-user",
            "displayName": "Jane Smith"
          }]
        }], done);
      });

      users(config, function (err, users) {
        users.registerUser("new-user", "Jane Smith", function (err) {
          assert.equal(err, null);

          checkDataExists([{
            "collection": "users",
            "data": [{
              "alias": "new-user",
              "displayName": "Jane Smith"
            }]
          }], done);
        });
      });
    });
  });

  describe('#userIsRegistered', function () {
    it('invokes callback(null, true) if registered', function (done) {
      users(config, function (err, users) {
        users.isValid("john-doe", function (err, valid) {
          assert.equal(err, null);
          assert.strictEqual(valid, true);
          done(err);
        });
      });
    });

    it('invokes callback(null, false) if not registered', function (done) {
      users(config, function (err, users) {
        users.isValid("invalid-user", function (err, valid) {
          assert.equal(err, null);
          assert.strictEqual(valid, false);
          done(err);
        });
      });
    });
  });

  describe('#getUserRole', function () {
    it('Returns the user role', function (done) {
      users(config, function (err, users) {
        users.getUserRole("john-doe", "ticket-system", function (err, role) {
          assert.equal(role, "user");
          done(err);
        })
      });
    });

    it('Returns the undefined if no role is assigned', function (done) {
      users(config, function (err, users) {
        users.getUserRole("existing-user", "another-box", function (err, role) {
          assert.equal(role, undefined);
          done(err);
        })
      });
    });
  });

  describe('#disableUser', function (){
    it("Disables the user from a box", function (done) {
      users(config, function (err, users) {
        users.disableUser("john-doe", "ticket-system", function (err) {
          checkDataExists([{
            "collection": "users",
            "data": [{
              "alias": "john-doe",
              "roles": {
                $exists: {
                  "ticket-system": false
                }
              }
            }]
          }], done);
        });
      });
    });
  });

  describe("#forgetUser", function () {
    it("Removes the user from the collection", function (done) {
      users(config, function (err, users) {
        users.forgetUser("john-doe", function () {
          checkDataDoNotExists([{
            "collection": "users",
            "data": [{
              "alias": "john-doe"
            }]
          }], done);
        });
      });
    })
  });

  describe('#getOwnedBoxes', function () {
    it('Should return only boxes managed by the user', function (done) {
      users(config, function (err, users) {
        users.getOwnedBoxes("jane-bells", function (err, boxNames) {
          assert.deepEqual(boxNames, ["financial-system"]);
          done(err);
        });
      });
    });
  });

  describe('#getAllowedBoxes', function () {
    it('Should return all boxes where user has any role', function (done) {
      users(config, function (err, users) {
        users.getAllowedBoxes("jane-bells", function (err, boxNames) {
          assert.notEqual(boxNames.indexOf("ticket-system"), -1);
          assert.notEqual(boxNames.indexOf("financial-system"), -1);
          done(err);
        });
      });
    });
  });

  describe('#getUserMetadata', function () {
    it('Should return metadata field', function (done) {
      users(config, function (err, users) {
        users.getUserMetadata("jane-bells", function (err, metadata) {
          assert.deepEqual(metadata, { passwordHash: "abcd-1234"});
          done(err);
        });
      });
    });
  });

  describe('#setUserMetadata', function () {
    it('Should set metadata field', function (done) {
      users(config, function (err, users) {
        users.setUserMetadata("john-doe", { passwordHash: "abcd-1234"}, function (err, metadata) {
          checkDataExists([{
            collection: 'users',
            "collection": "users",
            "data": [{
              "alias": "john-doe",
              "metadata": {
                "passwordHash": "abcd-1234"
              }
            }]
          }], done);
        });
      });
    });
  });
});
