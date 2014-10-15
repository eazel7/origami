var noflo = require('noflo');

exports.getComponent = function () {
  var c = new noflo.Component();

  c.inPorts.add('trigger', { dataType: 'bang'}, function (event) {
    if (event == 'data') {
      if (c.outPorts.object.isAttached() && c.outPorts.object.connect()) {
        c.outPorts.object.send({});
        c.outPorts.object.disconnect();
      }
    }
  });
  c.outPorts.add('object', { dataType: 'object' });

  return c;
};
