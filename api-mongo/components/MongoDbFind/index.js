exports.getComponent = function () {
  var MongoDbFind, noflo,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  noflo = require('noflo'),
  mongo = require('mongodb'),
  MongoClient = mongo.MongoClient,
  Server = mongo.Server;

  MongoDbFind = (function(_super) {
    __extends(MongoDbFind, _super);

    function MongoDbFind() {
      var self = this;
      this.inPorts = {
        uri: new noflo.InPort({dataType: 'string'}, function (event, payload) {
          if (event == 'data') {
            self.uri = payload;
          }
        }),
        collection: new noflo.InPort({dataType: 'string'}, function (event, payload) {
          if (event == 'data') {
            self.collection = payload;
          }
        }),
        predicate: new noflo.InPort({dataType: 'object'})
      };
      this.outPorts = {
        success: new noflo.Port('array'),
        error: new noflo.Port('object')
      };
      MongoDbFind.__super__.constructor.call(this, 'predicate', 'success');
    }

    MongoDbFind.prototype.doAsync = function(predicate, callback) {
      return (function(component) {
        function treatErr (err) {
          if (!err) return;
          
          if (component.outPorts.error.isAttached() && component.outPorts.error.connect()) {
            component.outPorts.error.send(err);
          }
          
          return callback();
        }
      
        if (!component.uri || !component.collection) return treatErr('Collection/URI is missing');
      
        MongoClient.connect(component.uri, function (err, db) {
          if (!err) {
            db
            .collection(component.collection)
            .find(predicate)
            .toArray(function (err, results) {
              if (err) return treatErr(err);
              
              if (component.outPorts.success.isAttached()) {
                for (var x = 0; x < results.length; x++) results[x]._id = results[x]._id.toString();
                component.outPorts.success.send(results);
                component.outPorts.success.disconnect();
              }
          
              return callback();
            });
          } else if (err) return treatErr(err);
        });
      })(this);
    };

    return MongoDbFind;

  })(noflo.AsyncComponent);

  return new MongoDbFind();
}
