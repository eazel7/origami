var noflo = require('noflo');

exports.getComponent = function () {
  var c = new noflo.Component();

  c.inPorts.add('from', { dataType: 'number'}, function (event, payload) {
    if (event == 'data') {
      c.from = payload;
    }
  });
  c.inPorts.add('to', { dataType: 'number'}, function (event, payload) {
    if (event == 'data') {
      c.to = payload;
    }
  });
  c.inPorts.add('in', { dataType: 'all'});
  c.inPorts.in.on('data', function (payload) {
    console.log(payload);
    if (c.outPorts.out.isAttached()) {
      c.outPorts.out.send(payload.slice(c.from, c.to));
      c.outPorts.out.disconnect();
    }
  });
  c.outPorts.add('out', { dataType: 'object'});

  return c;
};
