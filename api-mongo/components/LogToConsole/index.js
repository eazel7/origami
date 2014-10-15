var noflo = require('noflo');

exports.getComponent = function () {
  var c = new noflo.Component();

  c.inPorts.add('in', { dataType: 'all'});
  
  c.inPorts.in.on('data', function (data, metadata) {
    process.nextTick(function () {
      console.log(data);
      if (typeof payload == 'string') c.api.eventBus.emit('workflow-output', c.boxName, c.workflowId, {
        string: data,
        date: new Date().valueOf()
      });
      else {
        try {
          c.api.eventBus.emit('workflow-output', c.boxName, c.workflowId, {
            date: new Date().valueOf(),
            string: JSON.stringify(data)
          });
        } catch (e) {
          debugger;
          console.error(e);
        }
      }
    });
  });

  return c;
};
