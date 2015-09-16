var assert = require('assert'),
    target = require('../packages'),
    config = require('./config'),
    restoreTestingData = require("./restoreTestingData"),
    checkDataExists = require("./checkDataExists"),
    checkDataDoNotExists = require("./checkDataDoNotExists");
   
beforeEach(function (done) {
  this.timeout(6000);
  
  restoreTestingData(require('./singleDbData'), done);
});

describe.skip("api:packages", function () {
  describe("#listPackages", function () {
    it("Lists packages with name and files", function (done) {
      target(config, function(err, api) {
        api.listPackages(function (err, packages) {
          assert.deepEqual(packages, [{
            "name": "My package",
            "files": ["my-file.txt"]
          }]);
          
          done();
        });
      });
    });
  });
  
  describe("#createPackage", function () {
    it("Creates a new package with empty files", function (done) {
      target(config, function(err, api) {
        api.createPackage("Another package", function (err, packages) {
          checkDataExists([{
            "database": "boxes",
            "collection": "packages",
            "data": [{
              "name": "Another package",
              "files": {
                $size: 0
              }
            }]
          }], done);
        });
      });
    });
  });
  
  describe("#removePackage", function () {
    it("Removes an existing package", function (done) {
      target(config, function(err, api) {
        api.removePackage("My package", function (err, packages) {
          checkDataDoNotExists([{
            "database": "boxes",
            "collection": "packages",
            "data": [{
              "name": "My package"
            }]
          }], done);
        });
      });
    });
  });
  
  describe("#listAssets", function () {
    it("Returns the list of assets in a package", function (done) {
      target(config, function(err, api) {
        api.listAssets("My package", function (err, assets) {
          assert.deepEqual(assets, ["my-file.txt"]);
          done();
        });
      });
    });
  });
  
  describe("#createAsset", function () {
    it("Creates an asset in a package", function (done) {
      target(config, function(err, api) {
        api.createAsset("My package", "another-file.txt", function (err) {
          checkDataExists([{
            "database": "boxes",
            "collection": "packages",
            "data": [{
              "name": "My package",
              "files": {
                $all: ["my-file.txt", "another-file.txt"]
              }
            }]
          },{
            "database": "boxes",
            "collection": "package_assets",
            "data": [{
              "package": "My package",
              "path": "my-file",
              "file_id": {
                "$exists": true
              }
            }]
          }], done);
        });
      });
    });
    
    it("Creates an asset in a package", function (done) {
      target(config, function(err, api) {
        api.createAsset("My package", "another-file.txt", function (err) {
          checkDataExists([{
            "database": "boxes",
            "collection": "packages",
            "data": [{
              "name": "My package",
              "files": {
                $all: ["my-file.txt", "another-file.txt"]
              }
            }]
          }], done);
        });
      });
    });
  });
  
  describe("#updateAsset", function () {
    it("Creates the asset data if asset do not exitst", function (done) {
      target(config, function(err, api) {
        api.updateAsset("My package", "another-file.txt", new Buffer("the-contents"), function (err) {
          checkDataExists([{
            "database": "boxes",
            "collection": "package_assets.files",
            "data": [{
              "metadata": {
                "package": "My package",
                "path": "another-file.txt"
              }
            }]
          }], done);
        });
      });
    });
    
    it("Updates the asset data if asset already exitst", function (done) {
      target(config, function(err, api) {
        api.updateAsset("My package", "another-file.txt", new Buffer("the-contents"), function (err) {
          checkDataExists([{
            "database": "boxes",
            "collection": "package_assets.files",
            "data": [{
              "metadata": {
                "package": "My package",
                "path": "another-file.txt"
              },
              "length": 12
            }]
          }], function () {
            api.updateAsset("My package", "another-file.txt", new Buffer("a-new-content"), function (err) {
              checkDataExists([{
                "database": "boxes",
                "collection": "package_assets.files",
                "data": [{
                  "metadata": {
                    "package": "My package",
                    "path": "another-file.txt"
                  },
                  "length": 13
                }]
              }], done);
            });
          });
        });
      });
    });
  });
  
  describe("#removeAsset", function () {
    it("Removes exisitng asset", function (done) {
      target(config, function(err, api) {
        api.removeAsset("My package", "my-file.txt", function (err) {
          checkDataDoNotExists([{
            "database": "boxes",
            "collection": "packages",
            "data": [{
              "name": "My package",
              "files": {
                "$all": ["my-file.txt"]
              }
            }]
          },{
            "database": "boxes",
            "collection": "package_assets.files",
            "data": [{
              "metadata": {
                "package": "My package",
                "path": "my-file.txt"
              }
            }]
          },{
            "database": "boxes",
            "collection": "package_assets.files",
            "data": [{
              "metadata": {
                "package": "My package",
                "path": "my-file.txt"
              }
            }]
          }], done);
        });
      });
    });
  });
  
  describe("#getAsset", function () {
    it("Gets an exisitng asset", function (done) {
      target(config, function(err, api) {
        api.getAsset("My package", "my-file.txt", function (err, buffer) {
          assert.equal("test file\n", buffer.toString());
          done();
        });
      });
    });
    
    it("Returns error if asset do not exists", function (done) {
      target(config, function(err, api) {
        api.getAsset("My package", "shouldnt-exist.txt", function (err, buffer) {
          assert(err);
          done();
        });
      });
    });
  });
});
