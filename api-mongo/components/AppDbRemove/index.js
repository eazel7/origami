var AppDbRemove, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

AppDbRemove = (function(_super) {
  __extends(AppDbRemove, _super);

  function AppDbRemove() {
    var self = this;
    this.inPorts = {
      predicate: new noflo.InPort({dataType:'object'}, function (event, payload) {
        
      }),
      collection: new noflo.InPort({dataType: 'string'}, function (event, payload) {
        if (event == 'data') {
          self.collection = payload;
        }
      })
    };
    this.outPorts = {
      success: new noflo.OutPort({dataType: 'bang'}),
      error: new noflo.OutPort({dataType: 'data'})
    };
    
    AppDbRemove.__super__.constructor.call(this, 'predicate', 'success');
  }

  AppDbRemove.prototype.doAsync = function(predicate, callback) {
    return (function(component) {
      component.api.collections.getCollection(component.boxName, component.collection, function (err, collection) {
        collection.remove(predicate, function (err, doc) {
          try {
            if (err && component.outPorts.error.isAttached() && component.outPorts.error.connect()) {
              component.outPorts.error.beginGroup(predicate);
              component.outPorts.error.send(err);
              component.outPorts.error.endGroup();
            }
          
            if (component.outPorts.success.isAttached() && component.outPorts.success.connect()) {
              component.outPorts.success.beginGroup(predicate);
              component.outPorts.success.send();
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

  return AppDbRemove;

})(noflo.AsyncComponent);

exports.getComponent = function() {
  return new AppDbRemove();
};
