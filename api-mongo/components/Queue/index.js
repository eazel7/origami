var noflo = require('noflo');

exports.getComponent = function () {
  var c = new noflo.Component();

  c.queue = [];
  
  c.inPorts.add('enqueue', {dataType: 'data'});
  
  c.inPorts.enqueue.on('data', function (payload) {
    c.queue.push(payload);
    
    if (c.outPorts.length.isAttached()) {
      c.outPorts.length.send(c.queue.length);
      c.outPorts.length.disconnect();
    }
  });
  
  c.inPorts.add('clear', {dataType: 'data'});
  c.inPorts.add('dequeue', {dataType: 'data'});
  
  c.outPorts.add('item', {dataType:'all'});
  c.outPorts.add('length', {dataType: 'int'});

  c.inPorts.dequeue.on('data', function (data) {
    var item = c.queue.shift();
    if (c.outPorts.item.isAttached()) {
      c.outPorts.item.send(item);
      c.outPorts.item.disconnect();
    }
    
    if (c.outPorts.length.isAttached()) {
      c.outPorts.length.send(c.queue.length);
      c.outPorts.length.disconnect();
    }
  });

  c.inPorts.clear.on('data', function (data) {
    if (c.outPorts.length.isAttached()) {
      c.queue.splice(0, c.queue.length);
      c.outPorts.length.send(0);
      c.outPorts.length.disconnect();
    }
  });
  
  return c;
};
