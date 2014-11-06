var request = require('request'), async = require('async'), emailjs = require('emailjs');
;

module.exports = {
  getComponent: function () {
    var SendEmail, noflo,
      __hasProp = {}.hasOwnProperty,
      __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    noflo = require('noflo'),

    SendEmail = (function(_super) {
      __extends(SendEmail, _super);

      function SendEmail() {
        var self = this;
        this.inPorts = {
          send: new noflo.InPort({dataType: 'object'}, function (event, payload) {
            if (event == 'data') self.emails.push(payload);;
          }),
          host: new noflo.InPort({dataType: 'string'}, function (event, payload) {
            if (event === 'data') self.host = payload;
          }),
          port: new noflo.InPort({dataType: 'number'}, function (event, payload) {
            if (event === 'data') self.port = payload;
          }),
          username: new noflo.InPort({dataType: 'string'}, function (event, payload) {
            if (event === 'data') self.username = payload;
          }),
          password: new noflo.InPort({dataType: 'string'}, function (event, payload) {
            if (event === 'data') self.password = payload;
          }),
          ssl: new noflo.InPort({dataType: 'boolean'}, function (event, payload) {
            if (event === 'data') self.ssl = payload;
          })
        };
        this.outPorts = {
          success: new noflo.Port('all'),
          error: new noflo.Port('data')
        };
        SendEmail.__super__.constructor.call(this, 'send', 'success', 'error');
      }

      SendEmail.prototype.doAsync = function(data, callback) {
        return (function(component) {
          function treatErr (err) {
            console.error(err);
            if (err && component.outPorts.error.isAttached() && component.outPorts.error.connect()) {
              component.outPorts.error.send(err);
              component.outPorts.error.disconnect();
            }
            return callback();
          }
        
          if (component.outPorts.success.isAttached()) {
            component.outPorts.success.connect();
          }
          
          var client = emailjs.server.connect({
            username: self.username,
            password: self.password,
            host: self.host,
            port: self.port,
            ssl: self.ssl
          });
            
          async.whilst(function () {
            return self.emails.length;
          }, function (callback) {
            client.send(self.emails.shift, callback);
          }, function (err) {
            if (err) return treatErr (err);
            
            return callback();
          });
          
        })(this);
      };

      return SendEmail;

    })(noflo.AsyncComponent);

    return new SendEmail();
  }
};
