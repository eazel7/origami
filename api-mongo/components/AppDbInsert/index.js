var AppDbInsert, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

AppDbInsert = (function(_super) {
  __extends(AppDbInsert, _super);

  function AppDbInsert() {
    var self = this;
    this.inPorts = {
      object: new noflo.InPort({dataType:'object'}, function (event, payload) {
      }),
      collection: new noflo.InPort({dataType: 'string'}, function (event, payload) {
        if (event == 'data') {
          self.collection = payload;
        }
      })
    };
    this.outPorts = {
      success: new noflo.OutPort({dataType:'object', required: false}),
      error: new noflo.OutPort({dataType:'error', required: false})
    };
    
    AppDbInsert.__super__.constructor.call(this, 'object', 'success');
  }

  AppDbInsert.prototype.doAsync = function(object, callback) {
    return (function(component) {
      function treatErr(err) {
        if (err && component.outPorts.error.isAttached()) {
          component.outPorts.error.send(err);
        }
      }
      
      component.api.collections.getCollection(component.boxName, component.collection, function (err, collection) {
        collection.insert(object, function (err, docs) {
          try {
            if (err) return treatErr(err);
            
            if (component.outPorts.success.isAttached()) {
              component.outPorts.success.beginGroup(object);
              component.outPorts.success.send(docs);
              component.outPorts.success.endGroup();
            }
          } catch (err) {
            treatErr(err);
          }

          return callback();
        })
      });
    })(this);
  };

  return AppDbInsert;

})(noflo.AsyncComponent);

exports.getComponent = function() {
  return new AppDbInsert;
};
