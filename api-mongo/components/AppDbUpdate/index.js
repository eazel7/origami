var AppDbInsert, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

AppDbInsert = (function(_super) {
  __extends(AppDbInsert, _super);

  function AppDbInsert() {
    var self = this;
    this.inPorts = {
      replacement: new noflo.InPort({dataType:'object'}, function (event, payload) {
      }),
      predicate: new noflo.InPort({dataType:'object'}, function (event, payload) {
        if (event == 'data') {
          self.predicate = payload;
        }
      }),
      collection: new noflo.InPort({dataType: 'string'}, function (event, payload) {
        if (event == 'data') {
          self.collection = payload;
        }
      })
    };
    this.outPorts = {
      success: new noflo.OutPort({dataType:'object'}),
      error: new noflo.OutPort({dataType:'error'})
    };
    
    AppDbInsert.__super__.constructor.call(this, 'replacement', 'success');
  }

  AppDbInsert.prototype.doAsync = function(replacement, callback) {
    return (function(component) {
      component.api.collections.getCollection(component.boxName, component.collection, function (err, collection) {
        collection.update(component.predicate, replacement, function (err, doc) {
          try {
            if (component.outPorts.success.isAttached() && component.outPorts.success.connect()) {
              component.outPorts.success.beginGroup(replacement);
              component.outPorts.success.send(doc);
              component.outPorts.success.endGroup();
            }
          } catch (e) {
            console.error(e);
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
