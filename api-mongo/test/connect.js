var assert = require('assert'),
    connect = require('../connect'),
    config = require('./config').mongo;

describe('dbConnect', function () {
  describe('#getDb', function () {
    it('should connect with valid options', function (done) {
      connect(config, function (err, db) {
        assert.notEqual(db, undefined, 'Did not return database');
        
        db.collectionNames(function (err, names) {
          assert.notEqual(names, undefined);
        
          done();
        });
      });
    });
    it('should throw error with invalid options', function (done) {
      connect({
        host: config.host,
        port: config.port,
        database: config.database,
        authenticationDatabase: config.authenticationDatabase,
        username: 'someuser',
        password: 'badpassword'
      }, function (err, db) {
        assert.notEqual(err, undefined);
        
        done();
      });
    });
    
    it.skip('database should be the one in the database field regardless of the authenticationDatabase', function (done) {
      connect(config, function (err, db) {
        assert.equal(db.databaseName, 'boxes');
        
        done();
      });
    });
    if (config.username) {
      // this one runs only if we are using mongodb in auth mode
      it('should authenticate against the database if authenticationDatabase is missing', function (done) {
        connect({
          host: config.host,
          port: config.port,
          database: 'origami-test',
          username: 'admin',
          password: 'P@ssw0rd!'
        }, function (err, db) {
          assert.equal(db.databaseName, 'origami-test');
          
          db.collectionNames(function (err, names) {
            assert.ifError(err);
          
            done();
          });
        });
      });
    }
  });
});
