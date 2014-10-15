var noflo = require('noflo');

exports.getComponent = function (metadata) {
  var c = new noflo.Component(),
      bag = {};

  c.inPorts.add('property', { dataType: 'string'});
  c.inPorts.add('object', { dataType: 'object'});
  c.inPorts.add('value', { dataType: 'data'});
  c.outPorts.add('object', { dataType: 'object' });
  
  c.inPorts.property.on('data', function (data) {
    bag.property = data;
  });
  
  c.inPorts.object.on('data', function (data) {
    bag.object = data;
  });
  
  c.inPorts.value.on('data', function (data) {
    process.nextTick(function () {
      if (bag.property && bag.object) {
        bag.object[bag.property] = data;
        
        if (c.outPorts.object.isAttached()) {
          c.outPorts.object.send(bag.object);
          c.outPorts.object.disconnect();
        }
      }
    });
  });

  return c;
};
