var noflo = require('noflo');

exports.getComponent = function () {
  var c = new noflo.Component(),
      bag = {};

  c.outPorts.add('out', { dataType: 'data' });
  
  c.inPorts.add('in', { dataType: 'string'}, function (event, data) {
    if (event == 'data') {
      if (c.outPorts.out.isAttached() && c.outPorts.out.connect()) {
        c.outPorts.out.send(data);
        c.outPorts.out.disconnect();
      }
    }
  });

  return c;
};
