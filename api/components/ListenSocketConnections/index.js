var noflo = require('noflo');

exports.getComponent = function (metadata) {
  var c = new noflo.Component();

  c.outPorts.add('connected', { dataType: 'all'});
  c.outPorts.add('disconnected', { dataType: 'all'});
  var api = this.api;
  
  console.log('listen to socket ops', api.eventBus.events);  

  
  var attached = { 'connnected': 0, 'disconnected': 0 },
      onConnected = function (alias) {
        console.log('user socket connected', alias);
        if (c.outPorts.connected.isAttached()) {
          c.outPorts.connected.send(alias);
        }
      },
      onDisconnected = function (alias) {
        console.log('user socket disconnected', alias);
        if (c.outPorts.disconnected.isAttached()) {
          c.outPorts.disconnected.send(alias);
        }
      };
  c.outPorts.connected.on('attach', function (event) {
    if (attached.connected == 0) {
      api.eventBus.addListener('user-socket-connnected', onConnected);
    }
  
  console.log('listen to socket ops', api.eventBus.events);  

    attached.connected++;
        
    c.outPorts.connected.connect();
  });
  c.outPorts.connected.on('detach', function () {
    attached.connected--;

    if (attached.connected == 0) {
      api.eventBus.removeListener('user-socket-connected', onDisconnected);
      
      c.outPorts.connected.disconnect();
    }
  });
  c.outPorts.disconnected.on('attach', function (event) {
    if (attached.connected == 0) {
      api.eventBus.addListener('user-socket-disconnected', onDisconnected);
    }

    attached.disconnected++;
        
    c.outPorts.disconnected.connect();
  });
  c.outPorts.disconnected.on('detach', function () {
    attached.disconnected--;

    if (attached.disconnected == 0) {
      api.eventBus.removeListener('user-socket-disconnected', onDisconnected);

      c.outPorts.disconnected.disconnect();
    }
  });

  return c;
};
