var target = require('../routes'),
    assert = require('assert');

describe("Routes", function () {
  it("No undefined route is installed", function (done) {
    var app = {
      get: function (name) {
        return 'development';
      },
      use: function (handler) {
        assert.notStrictEqual(handler, undefined);
      },
      route: function (routeName) {
        return {
          get: function (handler) {
            assert.notStrictEqual(handler, undefined);
          },
          post: function (handler) {
            assert.notStrictEqual(handler, undefined);
          }
        };
      }
    },
    api = {
      config: {
        clientID: "stubClientId",
        clientSecret: "stubClientSecret"
      }
    };
    
    target(app, api);
    
    done();
  });
});
