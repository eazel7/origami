var noflo = require('noflo');

exports.getComponent = function () {
  var c = new noflo.Component(),
      bag = {};

  c.inPorts.add('graph', { dataType: 'string'}, function (event, data) {
    if (event == 'data') {
      c.graph = data;
    }
  });
  c.inPorts.add('start', { dataType: 'object'}, function (event, data) {
    function treatErr(err) {      
      if (c.outPorts.error.isAttached() && c.outPorts.error.connect()) {
        c.outPorts.error.send(err);
        c.outPorts.error.disconnect();
      }
      
      return;
    }
    
    if (event == 'data') {
      if (!c.graph) {
        return treatErr('No graph set');
      }
      
      c.api.workflows.startWorkflow(c.boxName, c.graph, data, function (err, workflowId) {
        if (err) return treatErr(err);
        
        if (c.outPorts.workflowid.isAttached() && c.outPorts.workflowid.connect()) {
          c.outPorts.workflowid.send(workflowId);
          c.outPorts.workflowid.disconnect();
        }
      });
    }
  });
  c.outPorts.add('workflowid', { dataType: 'string', required: false });
  c.outPorts.add('error', { dataType: 'data', required: false });

  return c;
};
