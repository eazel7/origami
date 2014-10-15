var request = require('request');

exports.getComponent = function () {
  var HTTPGet, noflo,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  noflo = require('noflo'),
  mongo = require('mongodb'),
  MongoClient = mongo.MongoClient,
  Server = mongo.Server;

  HTTPGet = (function(_super) {
    __extends(HTTPGet, _super);

    function HTTPGet() {
      var self = this;
      this.inPorts = {
        url: new noflo.InPort({dataType: 'string'}, function (event, payload) {
          if (event == 'data') {
            self.url = payload;
          }
        }),
        querystring: new noflo.InPort({dataType: 'object'}, function (event, payload) {
          if (event == 'data') {
            self.qs = payload;
          }
        })
      };
      this.outPorts = {
        success: new noflo.Port('data'),
        error: new noflo.Port('data')
      };
      HTTPGet.__super__.constructor.call(this, 'querystring', 'success', 'error');
    }

    HTTPGet.prototype.doAsync = function(qs, callback) {
      return (function(component) {
        function treatErr (err) {
          if (err && component.outPorts.error.isAttached() && component.outPorts.error.connect()) {
            component.outPorts.error.send(err);
            component.outPorts.error.disconnect();
          }
          return callback();
        }
      
        if (!component.url) return treatErr('URL is missing');

        if (component.outPorts.success.isAttached() && component.outPorts.success.connect()) {
          request({
            url: component.url,
            qs: qs
          }, function (err, res, body) {
            if (err) return treatErr(err);
            
            component.outPorts.success.beginGroup(component.uri);
            component.outPorts.success.send(body);
            component.outPorts.success.endGroup();
            component.outPorts.success.disconnect();
          });
        }
      })(this);
    };

    return HTTPGet;

  })(noflo.AsyncComponent);

  return new HTTPGet();
}
