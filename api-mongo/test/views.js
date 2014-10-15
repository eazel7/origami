var assert = require('assert'),
    config = require('./config'),
    restoreTestingData = require('./restoreTestingData'),
    checkDataExists = require('./checkDataExists'),
    checkDataDoNotExists = require('./checkDataDoNotExists'),
    views = require('../views');

beforeEach(function (done) {
  this.timeout(6000);
  
  restoreTestingData(require('./singleDbData'), function () {
    done();
  });
});

describe('viewsApi', function () {
  describe('#listViews', function () {
    it('List existing view in a box', function (done) {
      views(config, function (err, api) {
        api.listViews("existing-box", function (err, views) {
          assert.deepEqual(views, ["home"]);
          
          done();
        });
      });
    });

    it('Returns the view object by box name and view name', function (done) {
      views(config, function (err, api) {
        api.getView("existing-box", "home", function (err, view) {
          assert.equal(view.name, "home");
          assert.equal(view.template, "<h1>Home view template</h1>");
          
          done();
        });
      });
    });

    it('Updates a view', function (done) {
      views(config, function (err, api) {
        api.saveView("existing-box", "home", "<h1>New home template</h1>", function (err, view) {
          checkDataExists({
            "database": "existing-box",
            "collection": "_views",
            "data": [{
              "name": "home",
              "template": "<h1>New home template</h1>"
            }]
          }, done);
        });
      });
    });

    it('Creates a new view', function (done) {
      views(config, function (err, api) {
        api.saveView("existing-box", "new-view", "<h1>New view template</h1>", function (err, view) {
          checkDataExists({
            "database": "existing-box",
            "collection": "_views",
            "data": [{
              "name": "new-view",
              "template": "<h1>New view template</h1>"
            }]
          }, done);
        });
      });
    });

    it('Removes a view', function (done) {
      views(config, function (err, api) {
        api.removeView("existing-box", "home", function (err) {
          checkDataDoNotExists({
            "database": "existing-box",
            "collection": "_views",
            "data": [{
              "name": "home"
            }]
          }, done);
        });
      });
    });
  });
});
