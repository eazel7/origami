var target = require('../controllers/boxes'),
    assert = require('assert');

describe('BoxesCtrl', function () {
  describe('#listBoxes', function () {
    it ('Returns the list of box names', function (done) {
      target({
        boxes: {
          listBoxes: function (callback) {
            callback(null, [{
              "name": "existing-box"
            },{
              "name": "another-box"
            }]);
          }
        }
      })
      .listBoxes({}, {
        json: function (data) {
          assert.notEqual(data.indexOf("existing-box"), -1);
          assert.notEqual(data.indexOf("another-box"), -1);
          done();
        }
      });
    });
  });

  describe("#isNameFree", function () {
    it("sets status 200 if name is free", function (done) {
      var status;
      target({
        boxes: {
          listBoxes: function (callback) {
            callback(null, [{
              "name": "existing-box"
            },{
              "name": "another-box"
            }]);
          }
        }
      })
      .isNameFree({
        params: {
          boxName: "new-name"
        }
      }, {
        status: function (newStatus) {
          status = newStatus;
        },
        end: function () {
          assert.strictEqual(status, 200);
          done();
        }
      });
    });

    it("set status 418 if name is in use",  function (done) {
      var status;
      target({
        boxes: {
          listBoxes: function (callback) {
            callback(null, [{
              "name": "the-same-name"
            }]);
          }
        }
      })
      .isNameFree({
        params: {
          boxName: "the-same-name"
        }
      }, {
        status: function (newStatus) {
          status = newStatus;
        },
        end: function () {
          assert.strictEqual(status, 418);
          done();
        }
      });
    });
  });

  describe('#getBoxInfo', function () {
    it('Should return 404 if box doesn\t exists', function (done) {
      var resStatus;
      target({
        boxes: {
          getBox: function (boxName, callback) {
            assert.equal(boxName, "my-box");
            callback(null, null);
          }
        }
      })
      .getBoxInfo({
        params: {
          boxName: "my-box"
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
    it ('Returns the info field for a box', function (done) {
      target({
        boxes: {
          getBox: function (boxName, callback) {
            assert.equal(boxName, "my-box");

            callback(null, {
              "info": {
                "description": "Some description"
              }
            });
          }
        }
      })
      .getBoxInfo({
        params: {
          boxName: "my-box"
        }
      }, {
        json: function (data) {
          assert.deepEqual(data, {
            "description": "Some description"
          });
          done();
        }
      });
    });
  });

  describe('#saveBoxInfo', function () {
    it ('Saves the box info', function (done) {
      var status;

      target({
        boxes: {
          saveInfo: function (boxName, info, callback) {
            assert.equal(boxName, "my-box");
            assert.deepEqual(info, {
              "description": "Some description"
            });

            callback(null);
          }
        }
      })
      .saveBoxInfo({
        params: {
          boxName: "my-box"
        },
        body: {
          "description": "Some description"
        }
      }, {
        status: function (newStatus) {
          status = newStatus;
        },
        end: function () {
          assert.equal(status, 200);
          done();
        }
      });
    });
  });

  describe('#createBox', function () {
    it ('Creates a new box', function (done) {
      var status, boxCreated;

      target({
        boxes: {
          createBox: function (boxName, owner, callback) {
            assert.equal(boxName, "my-box");
            assert.equal(owner, "the-user");
            boxCreated = true;

            callback(null);
          }
        }
      })
      .createBox({
        params: {
          boxName: "my-box"
        },
        session: {
          user: {
            "alias": "the-user"
          }
        }
      }, {
        status: function (newStatus) {
          status = newStatus;
        },
        end: function () {
          assert.equal(status, 200);
          assert(boxCreated);
          done();
        }
      });
    });
  });

  describe('#listBoxUsers', function () {
    it ('List the box users', function (done) {
      var status, boxCreated;

      target({
        users: {
          listBoxUsers: function (boxName, callback) {
            assert.equal(boxName, "my-box");

            callback(null, [{ "alias": "some-user", "roles": { "my-box": "user" } }]);
          }
        }
      })
      .listBoxUsers({
        params: {
          boxName: "my-box"
        }
      }, {
        json: function (data) {
          assert.deepEqual(data, {
            "some-user": "user"
          });
          done();
        }
      });
    });
  });
});
