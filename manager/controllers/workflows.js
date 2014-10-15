module.exports = function(api) {
  return {
    listGraphs: function (req, res) {
      api.workflows.listGrahps(function (err, graphs) {
        res.json(graphs);
      })
    },
    removeGraph: function (req, res) {
      api.workflows.removeGraph(req.params.graphId, function (err) {
        res.status(err ? 418 : 200);
        return res.end();
      });
    },
    saveGraph: function (req, res) {
      api.workflows.saveGraph(req.params.boxName, req.body, function (err, graphId) {
        if (err) {
          res.status(418);
        }
        req.body._id = graphId;

        return res.json(req.body);
      });
    },
    startWorkflow: function (req, res) {
      api.workflows.startWorkflow(req.params.boxName, req.params.graphId, req.body, function (err, workflowId) {
        if (err) {
          console.err(err);
          res.status(418);
          return res.end();
        }

        return res.json({
          _id: workflowId
        });
      });
    },
    stopWorkflow: function (req, res) {
      api.workflows.startWorkflow(req.params.workflowId, function (err, workflowId) {
        if (err) {
          console.err(err);
          res.status(418);
          return res.end();
        }

        return res.json({
          _id: workflowId;
        });
      });
    },
    listWorkflows: function (req, res) {
      api.workflows.listWorkflows(req.params.boxName, req.body, function (err, graphId) {
        if (err) {
          res.status(418);

          req.body._id = graphId;
          return res.json(req.body);
      })
    }
  };
}
