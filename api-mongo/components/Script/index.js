var request = require('request');

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
            vm.runInNewContext(component.script, { input: data }, 'component.vm');
            component.outPorts.success.send(data);
            component.outPorts.success.disconnect();
          }
        })(this);
      };

      return Script;

    })(noflo.AsyncComponent);

    return new Script();
  }
};
