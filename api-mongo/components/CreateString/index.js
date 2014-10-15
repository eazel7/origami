var noflo = require('noflo'), S = require('string');

exports.getComponent = function () {
  var c = new noflo.Component();
  c.inPorts.add("values", { dataType: "object" }, function (event, data) {
    if (event == 'data' && c.outPorts.string.isAttached() && c.outPorts.string.connect()) {
      var result = S(c.template || '').template(data || {}).s;
      c.outPorts.string.send(result);
      c.outPorts.string.disconnect();
    }
  });
  c.inPorts.add("template", { dataType: "string" }, function (event, data) {
    if (event == 'data') {
      c.template = data;
    }
  });
  c.outPorts.add("string", { dataType: "string" });

  return c;
};
