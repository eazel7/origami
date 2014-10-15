var noflo = require('noflo');

exports.getComponent = function () {
  var c = new noflo.Component(),
      bag = {};

  c.inPorts.add('property', { dataType: 'string'}, function (event, data) {
    if (event == 'data') {
      bag.property = data;
    }
  });
  c.inPorts.add('object', { dataType: 'object'}, function (event, data) {
    if (event == 'data' && bag.property) {
      if (c.outPorts.value.isAttached() && c.outPorts.value.connect()) {
        c.outPorts.value.send(data[bag.property]);
        c.outPorts.value.disconnect()
      }
    }
    
  });
  c.outPorts.add('value', { dataType: 'data' });

  return c;
};

