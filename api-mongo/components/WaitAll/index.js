var noflo = require('noflo');

exports.getComponent = function () {
  var c = new noflo.Component();

  c.inPorts.add('in', { dataType: 'all'});
  c.outPorts.add('out', { dataType: 'bang'});
  
  var attached = 0, counter = 0;
  
  c.inPorts.in.on('attach', function (data, metadata) {
    attached++;
  });
  
  c.inPorts.in.on('data', function (data, metadata) {
    counter++;
    if (counter == attached) {
      counter = 0;
      c.outPorts.out.send({});
      c.outPorts.out.disconnect();
    }
  });

  return c;
};
