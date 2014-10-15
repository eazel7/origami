var noflo = require('noflo');

module.exports = {
  getComponent: function (metadata) {
    var c = new noflo.Component();
    
    c.inPorts.add("in", {
      datatype: 'array'
    });
    
    c.outPorts.add("out", {
      datatype: 'all'
    });

    c.inPorts.in.on('data', function(data) {
      process.nextTick(function () {
        if (data && c.outPorts.out.isAttached()) {
          for (_i = 0, _len = data.length; _i < _len; _i++) {
            item = data[_i];
            c.outPorts.out.send(item);
          }
          
          c.outPorts.out.disconnect();
        }
      });
    });
    
    return c;
  }
};
