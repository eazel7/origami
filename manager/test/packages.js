var target = require('../controllers/packages'),
    fs = require('fs'),
    path = require('path'),
    assert = require('assert');

describe('PackagesCtrl', function () {
  describe('#listPackages', function () {
    it("Returns the packages names as an array", function (done) {
      target({
        packages: {
          listPackages: function (callback) {
            callback(null, [{name: "Some package"}]);
          }
        }
      })
      .listPackages({
      }, {
        json: function (data) {
          assert.deepEqual(data, ["Some package"]);
          done();
        }
      });
    });
  });
  
  describe('#uploadAsset', function () {
    it('Saves reads req.files', function (done) {
      var createdFirst = false, edited = false
      target({
        packages: {
          createAsset: function(packageName, assetPath, callback) {
            assert.equal(packageName, "the-package");
            assert.equal(assetPath, "the-file.txt");
            
            if (!edited) createdFirst = true;
          
            callback();
          },
          updateAsset: function (packageName, assetPath, bytes, callback) {
            assert.equal(bytes, "test file\n");
            assert.equal(packageName, "the-package");
            assert.equal(assetPath, "the-file.txt");
            
            done();
          }
        }
      })
      .uploadAsset({
        params: {
          packageName: 'the-package'
        },
        files: {
          file: {
            name: 'the-file.txt',
            path: 'test/my-file.txt'
          }
        }
      }, {
        status: function() {
        },
        end: function() {
        }
      });
    });
  });
  describe('#listAssets', function () {
    it('Lists the assets in JSON format', function (done) {
      target({
        packages: {
          listAssets: function (packageName, callback) {
            assert(packageName, "the-package");
            callback(null, ['some-file.txt']);
          }
        }
      })
      .listAssets({
        params: {
          packageName: 'the-package'
        }
      }, {
        json: function (data) {
          assert.deepEqual(data, ['some-file.txt']);
          done();
        }
      });
    });
  });
  describe('#createPackage', function () {
    it("Creates a package with the given name", function (done) {
      var resStatus, packageCreated;
      target({
        packages: {
          createPackage: function (name, callback) {
            packageCreated = true;
            assert.equal(name, "Some package");
            callback(null);
          }
        }
      })
      .createPackage({
        params: {
          packageName: "Some package"
        }
      }, {
        status: function (status) {
          resStatus = status;
        },
        end: function () {
          assert.equal(resStatus, 200);
          assert(packageCreated);
          done();
        }
      });
    });
  });
});
