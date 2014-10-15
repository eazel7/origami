var noflo = require('noflo');

exports.getComponent = function () {
  var c = new noflo.Component(),
      bag = {};

  c.inPorts.add('in', { dataType: 'all'});
  c.inPorts.add('success', { dataType: 'all'});
  c.inPorts.add('error', { dataType: 'all'});
  
  c.inPorts.in.on('data', function (data) {
    c.api.workflows.stopWorkflow(c.workflowId, function (err) {
      if (err) console.error(err);
    });
  });
    
  c.inPorts.success.on('data', function (data) {
    c.api.workflows.setWorkflowResult(c.boxName, c.workflowId, null, data, function (err) {
      c.api.workflows.stopWorkflow(c.workflowId, function (err) {
        if (err) console.error(err);
      });
    });
  });
    
  c.inPorts.error.on('data', function (data) {
    c.api.workflows.setWorkflowResult(c.boxName, c.workflowId, data, null, function (err) {
      c.api.workflows.stopWorkflow(c.workflowId, function (err) {
        if (err) console.error(err);
      });
    });
  });

  return c;
};
