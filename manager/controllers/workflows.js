module.exports = function() {
  return {
    listGraphs: function (req, res) {
      var api = req.api;
      
      api.workflows.listGraphs(req.params.boxName, function (err, graphs) {
        if (err) {
          console.error(err);
          res.status(418);
          return res.end();
        }

        return res.json(graphs);
      })
    },
    removeGraph: function (req, res) {
      var api = req.api;
      
      api.workflows.removeGraph(req.params.graphId, function (err) {
        res.status(err ? 418 : 200);
        return res.end();
      });
    },
    saveGraph: function (req, res) {
      var api = req.api;
      
      api.workflows.saveGraph(req.params.boxName, req.body, function (err, graphId) {
        if (err) {
          res.status(418);
        }
        req.body._id = graphId;

        return res.json(req.body);
      });
    },
    startWorkflow: function (req, res) {
      var api = req.api;
      
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
      var api = req.api;
      
      api.workflows.startWorkflow(req.params.workflowId, function (err, workflowId) {
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
    listWorkflows: function (req, res) {
      var api = req.api;
      
      api.workflows.listWorkflows(req.params.boxName, req.body, function (err, graphId) {
        if (err) {
          console.error(err);
          res.status(418);
          return res.end();
        }

        req.body._id = graphId;
        return res.json(req.body);
      });
    }
  };
}
