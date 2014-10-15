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
    if (event == 'data' && data && bag.property) {
      if (data[bag.property] && c.outPorts.notEmpty.isAttached() && c.outPorts.notEmpty.connect()) {
        c.outPorts.notEmpty.send(data[bag.property]);
      } else if (c.outPorts.empty.isAttached() && c.outPorts.empty.connect()) {
         c.outPorts.empty.send(data[bag.property]);
      }
    }
    
  });
  c.outPorts.add('empty', { dataType: 'data' });
  c.outPorts.add('notempty', { dataType: 'data' });

  return c;
};
