module.exports = function (config, callback) {
  var connect = require('./connect'),
      util = require("util"),
      events = require("events");

      async = require('async');

  connect(config.mongo, function (err, db) {
    if (err) return callback(err);
  
    var eventBus = new events.EventEmitter(),
        self = {
          config: config,
          eventBus: eventBus,
          wrapper: function (contextProvider, onfail) {
            return require('./api-wrapper')(contextProvider, onfail, self);
          }
        };
    
    eventBus.setMaxListeners(0);

    async.applyEachSeries([
      function (config, db, self, callback) {
        require('./settings')(db, function (err, settings) {
          self.settings = settings;
          
          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./users')(db, self.settings, function (err, users) {
          self.users = users;
          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./collectionRouter')(config, db, function (err, router) {
          self.router = router;
          
          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./syncCollectionWrapper')(db, self.router, self.eventBus, function (err, wrapper) {
          self.syncWrapper = wrapper;
          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./collections')(db, self.syncWrapper, self.router, function (err, collections) {
          if (err) return collectionsCallback(err);

          self.collections = collections;
          
          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./permissions')(self.collections, self.users, function (err, permissions) {
          self.permissions = permissions;
          callback(err);
        });
      },
      function (config, db, self, callback) {    
        require('./views')(self.collections, function (err, views) {
          self.views = views;
          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./boxes')(config, db, self.users, self.collections, eventBus, function (err, boxes) {
          self.boxes = boxes;
          
          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./packages')(db, eventBus, self.users, function (err, packages) {
          self.packages = packages;
          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./remoteDbs')(db, connect, function (err, remoteDbs) {
          self.remoteDbs = remoteDbs;
          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./workflows')(self, function (err, workflows) {
          if (err) return callback(err);
          self.workflows = workflows;
          
          callback(err, self);
        });
      },
      function (config, db, self, callback) {
        require('./stats')(self.collections, self.syncWrapper, function (err, stats) {
          self.stats = stats;
          callback(err);
        });
      },
      function (config, db, self, callback) {
        require('./schedules')(self.boxes, self.collections, self.workflows, function (err, schedules) {
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
