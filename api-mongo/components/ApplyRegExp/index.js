var noflo = require('noflo');

exports.getComponent = function () {
  var c = new noflo.Component(),
      bag = {};

  c.inPorts.add('regexp', { dataType: 'string'});
  c.inPorts.regexp.on('data', function (data) {
    c.regexp = data;
  });
  
  c.inPorts.add('string', { dataType: 'string'});
  c.outPorts.add('out', { dataType: 'string'});
  
  c.inPorts.string.on('data', function (data) {
    setTimeout(function () {
      if (c.outPorts.out.isAttached()) {
        c.outPorts.out.send(new RegExp(c.regexp).exec(data));
        c.outPorts.out.disconnect();
      }
    }, 0);
  });

  return c;
};
