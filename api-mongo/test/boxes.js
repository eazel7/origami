var assert = require('assert'),
    boxes = require('../boxes'),
    config = require('./config'),
    restoreTestingData = require('./restoreTestingData'),
    checkDataExists = require('./checkDataExists'),
    checkDataDoNotExists = require('./checkDataDoNotExists');

beforeEach(function (done) {
  this.timeout(6000);
  
  restoreTestingData(require('./singleDbData'), function () {
    done();
  });
});

describe('single db mode', function () {
  describe('dbBoxes', function () {
    describe('#createBox', function () {
      it('Saves the new box', function (done) {
        boxes(config, function (err, boxes){
          boxes.createBox("new-box-for-testing", "john-doe", function (err, box) {
            assert.equal(box.name, "new-box-for-testing");
            assert.equal(box.owner, "john-doe");
            
            checkDataExists([{
              database: 'origami-test',
              collection: 'boxes',
              data: [{
                name: 'new-box-for-testing',
                owner: 'john-doe',
                'collections._views': {
                  $exists: true
                },
                'collections._graphs': {
                  $exists: true
                },
                'collections._workflows.sync': false,
                apiKey: {
                  $exists: true
                }
              }]
            }], function (err) {
              if (err) return done(err);
              
              checkDataExists([{
                database: 'origami-test',
                collection: 'users',
                data: [{
                  alias: 'john-doe',
                  'roles.new-box-for-testing': 'owner'
                }]
              }], function (err) {
                if (err) return done(err);
                
                checkDataExists([{
                  database: "origami-test",
                  collection: 'new-box-for-testing-_views',
                  data: [{
                    name: 'home',
                    template: config.defaultHomeTemplate
                  },{
                    name: 'left-sidebar',
                    template: config.defaultSidebarTemplate
                  }]
                }], done);
              })
            });
          });
        });
      });
      
      it('Throw error if box already exists', function (done) {
        boxes(config, function (err, boxes){
          boxes.createBox("existing-box", "someone", function (err, box) {
            assert.notEqual(err, undefined);
            
            done();
          });
        });
      });
    });
    
    describe('#getBox', function () {
      it('Should return existing box', function (done) {
        boxes(config, function (err, boxes){
          boxes.getBox("existing-box", function (err, box) {
            assert.notEqual(box, undefined);
            assert.equal(box.name, "existing-box");
            
            done();
          });
        });
      });
    });
    
    describe('#saveInfo', function () {
      it('Should updated the info field', function (done) {
        boxes(config, function (err, boxes){
          boxes.saveInfo("existing-box", {
            "description": "Some description"
          }, function (err) {
            assert.strictEqual(err, null);
            checkDataExists([{
              "database": "origami-test",
              "collection": "boxes",
              "data": [{
                "name": "existing-box",
                "info": {
                  "description": "Some description"
                }
              }]
            }], done);
          });
        });
      });
    });
  });
});
