var noflo = require('noflo');

exports.getComponent = function () {
  var c = new noflo.Component(),
      bag = {};

  c.inPorts.add('value', { dataType: 'data'});
  c.inPorts.value.on('data', function (data) {
    bag.value = data;
  });
  c.inPorts.add('object', { dataType: 'data'});
  c.outPorts.add('equal', { dataType: 'data' });
  c.outPorts.add('notequal', { dataType: 'data' });
  c.outPorts.add('greater', { dataType: 'data' });
  c.outPorts.add('lesser', { dataType: 'data' });
  c.inPorts.object.on('data', function (data) {
    var ports = {
      'equal': data == bag.value,
      'notequal': data != bag.value,
      'greater': data > bag.value,
      'lesser': data < bag.value
    };
    
    for (var k in ports) {
      if (ports[k] && c.outPorts[k].isAttached() && c.outPorts[k].connect()) {
         c.outPorts[k].send(data);
         c.outPorts[k].disconnect();
      }
    }
  });

  return c;
};

