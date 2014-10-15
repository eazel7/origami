var noflo = require('noflo');

exports.getComponent = function () {
  var c = new noflo.Component();

  c.inPorts.add('in', { dataType: 'all'}, function (event, payload) {
    if (event == 'data') {
    console.log('1');
      if (typeof payload == 'string') c.api.eventBus.emit('desktop-notification', c.boxName, payload);
    }
  });

  return c;
};
