/* eslint-disable semi */

var connect = require('./connect');
var events = require('events');
var async = require('async');
var debug = require('debug')('origami:init');

module.exports = function (config, callback) {
  connect(config.mongo, function (err, db) {
    if (err) return callback(err);

    var eventBus = new events.EventEmitter();
    eventBus.setMaxListeners(0);

    var APIWrapper = require('./api-wrapper');

    

    async.auto({
      'config': async.constant(config),
      'db': async.constant(db),
      'eventBus': async.constnat(eventBus),
      'wrapper': async.constant(wrapper),
      'settings': [
        'db',
        function (callback, results) {
          var Settings = require('./settings');

          return callback(null, new Settings(results.db));
        }
      ]
    })

    async.applyEachSeries([
      function (config, db, self, callback) {
        require('./settings')(db, function (err, settings) {
          debug('settings');

          self.settings = settings;

          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./users')(db, self.settings, function (err, users) {
          debug('users');

          self.users = users;

          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./collectionRouter')(db, function (err, router) {
          debug('router');

          self.router = router;

          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./syncCollectionWrapper')(db, self.router, self.eventBus, function (err, wrapper) {
          debug('syncWrapper');

          self.syncWrapper = wrapper;

          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./collections')(db, self.syncWrapper, self.router, function (err, collections) {
          if (err) return callback(err);

          debug('collections');

          self.collections = collections;

          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./permissions')(self.collections, self.users, function (err, permissions) {
          debug('permissions');

          self.permissions = permissions;

          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./views')(self.collections, function (err, views) {
          debug('views');

          self.views = views;

          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./boxes')(config, db, self.users, self.collections, eventBus, function (err, boxes) {
          debug('boxes');

          self.boxes = boxes;

          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./packages')(db, eventBus, self.users, function (err, packages) {
          debug('packages');

          self.packages = packages;

          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./remoteDbs')(db, connect, function (err, remoteDbs) {
          debug('remoteDbs');

          self.remoteDbs = remoteDbs;

          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./workflows')(self, function (err, workflows) {
          debug('workflows');

          if (err) return callback(err);

          self.workflows = workflows;

          callback(err, self);
        });
      },
      function (config, db, self, callback) {
        require('./stats')(self.collections, self.syncWrapper, function (err, stats) {
          debug('stats');

          self.stats = stats;

          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./schedules')(self.boxes, self.collections, self.workflows, function (err, schedules) {
          debug('schedules');

          self.schedules = schedules;

          callback(err);
        });
      }],
      config, db, self,
      function (err) {
        callback(err, self);
      });
  });
}
