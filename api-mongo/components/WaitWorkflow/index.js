var noflo = require('noflo');

exports.getComponent = function () {
  var c = new noflo.Component();

  c.outPorts.add('witherror', { dataType: 'all'});
  c.outPorts.add('withsuccess', { dataType: 'all'});
  c.outPorts.add('done', { dataType: 'all'});

  c.inPorts.add('workflowid', { dataType: 'all'});
  c.inPorts.workflowid.on('data', function (data) {
    c.waiting = data;
    console.log('waiting for ' + data);
  });
  
  var attached = 0,
      workflowFinished = function (boxName, workflowId) {
        console.log(workflowId);
        if (workflowId == c.waiting) {
          exports.api.workflows.getWorkflowResult(c.boxName, workflowId, function (err, result) {
            if (result && result.err && c.outPorts.witherror.isAttached()) {
              c.outPorts.witherror.send(result.err);
              c.outPorts.witherror.disconnect();
            }

            if (result && result.result && c.outPorts.withsuccess.isAttached()) {
              c.outPorts.withsuccess.send(result.result);
              c.outPorts.withsuccess.disconnect();
            }

            if (c.outPorts.done.isAttached()) {
              c.outPorts.done.send({});
              c.outPorts.done.disconnect();
            }
          });
        }
      };
      
  c.outPorts.done.on('attach', function () {
    if (!attached) {
      exports.api.eventBus.addListener('workflow-finished', workflowFinished);
    }
    attached++;
    
    c.outPorts.done.connect();
  });

  c.outPorts.witherror.on('attach', function () {
    if (!attached) {
      exports.api.eventBus.addListener('workflow-finished', workflowFinished);
    }
    attached++;
    
    c.outPorts.witherror.connect();
  });

  c.outPorts.withsuccess.on('attach', function () {
    if (!attached) {
      exports.api.eventBus.addListener('workflow-finished', workflowFinished);
    }
    attached++;
    
    c.outPorts.withsuccess.connect();
  });

  c.outPorts.done.on('detach', function () {
    attached--;
    if (!attached) exports.api.eventBus.removeListener('workflow-finsihed', workflowFinished);
  });

  c.outPorts.witherror.on('detach', function () {
    attached--;
    if (!attached) exports.api.eventBus.removeListener('workflow-finsihed', workflowFinished);
  });

  c.outPorts.withsuccess.on('detach', function () {
    attached--;
    if (!attached) exports.api.eventBus.removeListener('workflow-finsihed', workflowFinished);
  });

  return c;
};
