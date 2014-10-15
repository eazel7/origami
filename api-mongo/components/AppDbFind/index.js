var AppDbFind, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

AppDbFind = (function(_super) {
  __extends(AppDbFind, _super);

  function AppDbFind() {
    var self = this;
    this.inPorts = {
      predicate: new noflo.InPort({dataType: 'object'}),
      collection: new noflo.InPort({dataType: 'string'}, function (event, payload) {
        if (event == 'data') self.collection = payload;
      })
    };
    this.outPorts = {
      data: new noflo.OutPort({dataType: 'array', required: false}),
      error: new noflo.OutPort({dataType:'object', required: false})
    };
    AppDbFind.__super__.constructor.call(this, 'predicate', 'data');
  }

  AppDbFind.prototype.doAsync = function(predicate, callback) {
    return (function(component) {
      function treatErr(err) {
        if (!err) return;
        
        console.error(err);
        
        if (component.outPorts.error.isAttached() && component.outPorts.error.connect()) {
          component.outPorts.data.beginGroup(predicate);
          component.outPorts.data.send(err);
          component.outPorts.data.endGroup();
          component.outPorts.error.disconnect();
        }
      }
      
      component.api.collections.getCollection(component.boxName, component.collection, function (err, collection) {
        collection.find(predicate, function (err, docs) {
          if (err) {
            treatErr(err);
            return callback();
          }
          try {
            if (component.outPorts.data.isAttached() && component.outPorts.data.connect()) {
              component.outPorts.data.beginGroup(predicate);
              component.outPorts.data.send(docs);
              component.outPorts.data.endGroup();
              component.outPorts.data.disconnect();
            }
          } catch (e) {
            treatErr(e);
          }

          return callback();
        })
      });
    })(this);
  };

  return AppDbFind;

})(noflo.AsyncComponent);

exports.getComponent = function () {
  return new AppDbFind();
};
