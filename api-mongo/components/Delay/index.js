var request = require('request');

module.exports = {
  getComponent: function () {
    var Delay, noflo,
      __hasProp = {}.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    noflo = require('noflo'),
    mongo = require('mongodb'),
    MongoClient = mongo.MongoClient,
    Server = mongo.Server;

    Delay = (function(_super) {
      __extends(Delay, _super);

      function Delay() {
        var self = this;
        this.inPorts = {
          delay: new noflo.InPort({dataType: 'number'}, function (event, payload) {
            if (event == 'data') {
              self.delay = Number(payload);
            }
          }),
          trigger: new noflo.InPort({dataType: 'all'}, function (event, payload) {
            self.payload = payload;
          })
        };
        this.outPorts = {
          success: new noflo.Port('all'),
          error: new noflo.Port('data')
        };
        Delay.__super__.constructor.call(this, 'trigger', 'success', 'error');
      }

      Delay.prototype.doAsync = function(data, callback) {
        return (function(component) {
          function treatErr (err) {
            console.error(err);
            if (err && component.outPorts.error.isAttached() && component.outPorts.error.connect()) {
              component.outPorts.error.send(err);
              component.outPorts.error.disconnect();
            }
            return callback();
          }
        
          if (!component.delay) return treatErr('Delay not set missing');

          if (component.outPorts.success.isAttached() && component.outPorts.success.connect()) {
            setTimeout(function () {
              component.outPorts.success.send(data);
              component.outPorts.success.disconnect();
            }, Number(component.delay));
          }
        })(this);
      };

      return Delay;

    })(noflo.AsyncComponent);

    return new Delay();
  }
};
