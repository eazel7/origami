var noflo = require('noflo');

exports.getComponent = function () {
  return new (function () {
    var c = new noflo.Component();

    c.inPorts.add('property', { dataType: 'string'}, function (event, data) {
      if (event == 'data') {
        bag.properties = data;
      }
    });
    c.inPorts.add('object', { dataType: 'object'}, function (event, data) {
      if (event == 'data' && data && bag.properties) {
        var newObj = {};
        var props = bag.properties.split(',');
        
        for (var i = 0; i < props.length; i++) {
          newObj[bag2.properties[i]]=data[bag2.properties[i]];
        }
              
        if (c.outPorts.object.isAttached() && c.outPorts.object.connect()) {
          c.outPorts.object.send(data[bag.property]);
        }
      }
      
    });
    
    return c;
  })();
};
