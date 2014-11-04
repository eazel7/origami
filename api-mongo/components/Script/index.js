var request = require('request'), Q = require('q');

module.exports = {
  getComponent: function () {
    var Script, noflo,
      __hasProp = {}.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    noflo = require('noflo'),

    Script = (function(_super) {
      __extends(Script, _super);

      function Script() {
        var self = this;
        this.inPorts = {
          script: new noflo.InPort({dataType: 'string'}, function (event, payload) {
            if (event == 'data') self.script = String(payload);
          }),
         input: new noflo.InPort({dataType: 'all'}, function (event, payload) {
            self.payload = payload;
          })
        };
        this.outPorts = {
          success: new noflo.Port('all'),
          error: new noflo.Port('data')
        };
        Script.__super__.constructor.call(this, 'input', 'success', 'error');
      }

      Script.prototype.doAsync = function(data, callback) {
        return (function(component) {
          function treatErr (err) {
            console.error(err);
            if (err && component.outPorts.error.isAttached() && component.outPorts.error.connect()) {
              component.outPorts.error.send(err);
              component.outPorts.error.disconnect();
            }
            return callback();
          }
        
          if (component.outPorts.success.isAttached() && component.outPorts.success.connect()) {
            var vm = require('vm');
            vm.runInNewContext(component.script, { 
              input: data,
              db: {
                getCollection: function (collectionName) {
                  return {
                    find: function (predicate) {
                      var defer = Q.defer();
                      
                      component.api.collections.getCollection(component.boxName, collectionName, function (err, collection) {
                        if (err) {
                          console.error(err);
                          return defer.reject(err);
                        }
                        
                        collection
                        .find(predicate, function (err, docs) {
                          if (err) return defer.reject(err);
                          
                          defer.resolve(docs);
                        });
                      });
                      
                      return defer.promise;
                    },
                    findOne: function (predicate) {
                      var defer = Q.defer();
                      
                      component.api.collections.getCollection(component.boxName, collectionName, function (err, collection) {
                        if (err) {
                          console.error(err);
                          return defer.reject(err);
                        }
                        
                        collection
                        .findOne(predicate, function (err, doc) {
                          if (err) return defer.reject(err);
                          
                          defer.resolve(doc);
                        });
                      });
                      
                      return defer.promise;
                    },
                    insert: function (object) {
                      var defer = Q.defer();
                      
                      component.api.collections.getCollection(component.boxName, collectionName, function (err, collection) {
                        if (err) {
                          console.error(err);
                          return defer.reject(err);
                        }
                        
                        collection
                        .insert(object, function (err, doc) {
                          if (err) return defer.reject(err);
                          
                          defer.resolve(doc);
                        });
                      });
                      
                      return defer.promise;
                    },
                    update: function (predicate, replacement) {
                      var defer = Q.defer();
                      
                      component.api.collections.getCollection(component.boxName, collectionName, function (err, collection) {
                        if (err) {
                          console.error(err);
                          return defer.reject(err);
                        }
                        
                        collection
                        .update(predicate, replacement, function (err) {
                          if (err) return defer.reject(err);
                          
                          defer.resolve();
                        });
                      });
                      
                      return defer.promise;
                    }
                  }
                }
              },
              success: function (data) {
                component.outPorts.success.send(data);
                component.outPorts.success.disconnect();
              },
              error: function (err) {
                component.error.success.send(data);
                component.error.success.disconnect();
              },
              notifyUser: function (alias, message) {
                component.api.eventBus.emit('desktop-notification-user', component.boxName, alias, message);
              },
              JSON: JSON,
              console: {
                log: function () {
                  component.api.eventBus.emit('workflow-output', component.boxName, component.workflowId, {
                    date: new Date().valueOf(),
                    string: JSON.stringify(arguments)
                  });
                }
              } 
            }, 'component.vm');
          }
        })(this);
      };

      return Script;

    })(noflo.AsyncComponent);

    return new Script();
  }
};
