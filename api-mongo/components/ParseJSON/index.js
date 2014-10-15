var noflo = require('noflo');

exports.getComponent = function () {
  var c = new noflo.Component(),
      bag = {};

  c.inPorts.add('string', { dataType: 'string'});

  c.outPorts.add('object', { dataType: 'object' });
  c.outPorts.add('error', { dataType: 'data' });
  
  c.inPorts.string.on('data', function (data) {
    setTimeout(function () {
      try {
        var o = JSON.parse(data);
        if (c.outPorts.object.isAttached()) {
          c.outPorts.object.send(o);
          c.outPorts.object.disconnect();
        }
      } catch (e) {
        console.error(e);
        if (c.outPorts.error.isAttached()) {
          c.outPorts.error.send(e);
        }
      }
    }, 0);
  });
  
  return c;
};
