module.exports = function (config, callback) {
  var connect = require('./connect'),
      util = require("util"),
      events = require("events");

      async = require('async');

  connect(config.mongo, function (err, db) {
    if (err) return callback(err);
  
    var self = {
      config: config,
      connect: function (callback) {
        connect(config.mongo, callback);
      },
      eventBus: new events.EventEmitter()
    };
    self.eventBus.setMaxListeners(0);

    async.series([
      function (callback) {
        require('./collectionRouter')(config, self.connect, function (err, router) {
          self.router = router;
          callback(err);
        });
      },
      function (callback) {
        require('./syncCollectionWrapper')(config, self.connect, self.router, self.eventBus, function (err, wrapper) {
          self.syncWrapper = wrapper;
          callback(err);
        });
      },
      function (callback) {
        require('./collections')(config, self.connect, self.syncWrapper, self.router, function (err, collections) {
          if (err) return collectionsCallback(err);

          self.collections = collections;
          callback(err);
        });
      },
      function (callback) {    
        require('./views')(config, self.connect, self.router, self.syncWrapper, function (err, views) {
          self.views = views;
          callback(err);
        });
      },
      function (callback) {
        require('./boxes')(config, self.collections, self.views, self.eventBus, function (err, boxes) {
          self.boxes = boxes;
          
          callback(err);
        });
      },
      function (callback) {
        require('./settings')(config, function (settings) {
          self.settings = settings;
          callback(err);
        });
      },
      function (callback) {
        require('./users')(config, function (err, users) {
          self.users = users;
          callback(err);
        });
      },
      function (callback) {
        require('./packages')(config, self.eventBus, function (err, packages) {
          self.packages = packages;
          callback(err);
        });
      },
      function (callback) {
        require('./remoteDbs')(config, self.connect, function (err, remoteDbs) {
          self.remoteDbs = remoteDbs;
          callback(err);
        });
      },
      function (callback) {
        require('./stats')(self.connect, self.router, self.syncWrapper, function (err, stats) {
          self.stats = stats;
          callback(err);
        });
      }
    ], function () {
      require('./workflows')(self, function (err, workflows) {
        if (err) return callback(err);
          
        self.workflows = workflows;
          
        callback(err, self);
      });
    });
  });
}
