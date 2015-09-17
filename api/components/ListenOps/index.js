var noflo = require('noflo');

exports.getComponent = function (metadata) {
  var c = new noflo.Component();

  c.outPorts.add('out', { dataType: 'all'});
  
  var attached = 0,
      opEmitter = function (op) {
        console.log(op);
        if (op.box == c.boxName && c.outPorts.out.isAttached() && c.outPorts.out.connect()) {
          c.outPorts.out.send(op);
        }
      };
  c.outPorts.out.on('attach', function (event) {
    if (attached == 0) {
      exports.api.eventBus.addListener('op', opEmitter);
    }

    attached++;
        
    c.outPorts.out.connect();
  });
  c.outPorts.out.on('detach', function () {
    attached--;

    if (attached == 0) {
      exports.api.eventBus.removeListener('op', opEmitter);
      c.outPorts.out.disconnect();
    }
  });

  return c;
};
