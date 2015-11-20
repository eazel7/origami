/* eslint-disable semi */

var noflo = require('noflo');
var uuid = require('node-uuid');

function WorkflowsAPI (api) {
  this.api = api;
  var running = this.running = {};
  var notRunning = this.notRunning = {};

  api.eventBus.on('workflow-output', function (boxName, workflowId, output) {
    var w = running[workflowId] || notRunning[workflowId];
    if (w) {
      if (w.output === undefined) w.output = [];

      w.output.push(output);
    }
  });

  var defined = require('./component.json').noflo.components;

  for (var c in defined) {
    var component = require(defined[c]);

    component.api = api;
  }
};

WorkflowsAPI.prototype.getWorkflowEnd = function (id) {
  var self = this;

  return function () {
    if (!self.running[id]) return;

    self.notRunning[id] = self.running[id];
    self.notRunning[id].endDate = new Date();

    self.saveWorkflowEndDate(boxName, id, graphId, function (err) {
      self.getWorkflowResult(boxName, id, function (err, result) {
        if (err) return console.error(err);

        if (!result) {
          self.setWorkflowResult(boxName, id, graphId, null, null, function (err) {
            if (err) console.error(err);
          });
        }
      });

      delete self.running[id];

      self.api.eventBus.emit('workflow-finished', boxName, id);
    });
  };
};

WorkflowsAPI.prototype.listPastWorkflows = function (boxName, graphId, callback) {
  var self = this;

  self.api.collections.find(boxName, '_workflowResults', {
    graphId: graphId
  }, callback);
};

WorkflowsAPI.prototype.getWorkflowResult = function (boxName, workflowId, callback) {
  var self = this;

  self.api.collections.findOne(boxName, '_workflowResults', {
    workflowId: workflowId
  }, function (err, doc) {
    if (err) return callback(err);

    if (doc) return callback(null, { err: doc.err, result: doc.result });

    return callback(null, null);
  });
};

WorkflowsAPI.prototype.setWorkflowResult = function (boxName, workflowId, graphId, err, result, callback) {
  var self = this;

  self.api.collections
  .count(
    boxName,
    '_workflowResults',
    {
      workflowId: workflowId
    },
    function (err, count) {
      if (err) return callback(err);

      if (count) {
        self.api.collections.update(
        boxName,
        '_workflowResults',
        {
          workflowId: workflowId
        }, {
          $set: {
            err: err,
            result: result,
            unknown: !result && !err
          }
        }, callback);
      } else {
        self.api.collections.insert(
          boxName,
          '_workflowResults',
          {
            workflowId: workflowId,
            graphId: self.running[workflowId] ? self.running[workflowId].graphId : self.notRunning[workflowId].graphId,
            err: err,
            result: result,
            unkown: !err && !result
          },
          callback);
      }
    });
};

WorkflowsAPI.prototype.listRunningWorkflows = function (boxName, callback) {
  var self = this;

  var workflows = [];

  for (var id in self.running) {
    var r = self.running[id];

    if (r.boxName === boxName)
      self.workflows.push({
        id: id,
        startupDate: r.startupDate,
        graphId: r.graphId,
        params: r.initials
      });
  }

  callback(null, workflows);
};

WorkflowsAPI.prototype.getActiveConnections = function (workflowId, callback) {
  var r = self.running[workflowId];

  if (!r) return callback('Workflow not running');

  callback(null, r.activeConnections);
};

WorkflowsAPI.prototype.getOutput = function (workflowId, callback) {
  var self = this;

  var w = self.running[workflowId] || self.notRunning[workflowId];

  if (w) {
    return callback(null, w.output || []);
  } else {
    return callback('Workflow not found');
  }
};

WorkflowsAPI.prototype.saveWorkflowEndDate = function (boxName, workflowId, graphId, callback) {
  var self = this;

  self.api
  .collections
  .count(
    boxName,
    '_workflowResults',
    {
      workflowId: workflowId
    },
    function (err, count) {
      if (err) return callback(err);

      if (count) {
        //TODO: collection?
        collection
        .update(boxName, '_workflowResults', {
          workflowId: workflowId
        }, {
          $set: {
            endDate: new Date()
          }
        }, callback);
      } else {
        //TODO: collection?
        collection
        .insert(boxName, '_workflowResults', {
          workflowId: workflowId,
          graphId: running[workflowId] ? running[workflowId].graphId : notRunning[workflowId].graphId,
          endDate: new Date()
        }, callback);
      }
    });
};

WorkflowsAPI.prototype.saveWorkflowStartDate = function (boxName, workflowId, graphId, callback) {
  var self = this;

  self.api.collections.count(boxName, '_workflowResults', {
    workflowId: workflowId
  }, function (err, count) {
    if (err) return callback(err);

    if (count) {
      self.api
      .collections
      .update(boxName, '_workflowResults', {
        workflowId: workflowId
      }, {
        $set: {
          startDate: new Date()
        }
      }, callback);
    } else {
      self.api
      .collections
      .insert(boxName, '_workflowResults', {
        workflowId: workflowId,
        graphId: graphId,
        startDate: new Date()
      }, callback);
    }
  });
};

WorkflowsAPI.prototype.startWorkflow = function (boxName, graphId, params, callback) {
  var self = this;

  api.collections.findOne(boxName, "_graphs", {_id: graphId}, function (err, doc) {
    if (err) return callback(err);
    if (!doc) return callback(new Error('Graph does not exists'));
    if (!doc.graph || !doc.graph.nodes) return callback(new Error('Graph does not contains any nodes'));


    var workflowId = uuid.v4();

    self.saveWorkflowStartDate(boxName, workflowId, graphId, function (err) {
      if (err) return callback(err);

      var jsonGraph = self.toNofloGraph(doc.graph, {}, {
        boxName: boxName,
        workflowId: workflowId
      });

      noflo.graph.loadJSON(jsonGraph, function (g) {

        for (var i = 0; i < g.nodes.length; i++) {
          if (g.nodes[i].component == 'WorkflowStart') {
            g.addInitial(params, g.nodes[i].id, 'in', {});
          }
        }

        g.componentLoader = new (require("noflo/lib/ComponentLoader").ComponentLoader)(__dirname);

        noflo.createNetwork(g, function(n) {
          n.activeConnections = [];

          n.on('connect', function (event) {
            var socket = event.socket;

            if (!socket.from) return;
              var id = socket.from.process.id + ':' + socket.from.port + '/' + socket.to.process.id + ':' + socket.to.port;

              if (n.activeConnections.indexOf(id) === -1) {
                n.activeConnections.push(id);

                self.api.eventBus.emit('workflow-connection-on', boxName, workflowId, id);
              }
          });

          n.on('disconnect', function (event) {
            var socket = event.socket;

            if (socket.from && socket.from.process && socket.from.process.id && socket.to && socket.to.process && socket.to.process.id) {
              var id = socket.from.process.id + ':' + socket.from.port + '/' + socket.to.process.id + ':' + socket.to.port;

              if (n.activeConnections.indexOf(id) !== -1) {
                n.activeConnections.splice(n.activeConnections.indexOf(id), -1);

                self.api.eventBus.emit('workflow-connection-off', boxName, workflowId, id);
              }
            }
          });

          n.connect(function () {
            n.id = workflowId;
            n.graphId = graphId;
            n.startDate = new Date();

            n.boxName = boxName;

            self.running[n.id] = n;

            n.on('end', function () {
              console.log('workflow end');
              self.getWorkflowEnd(n.id, doc.name)
            });

            for (var c in n.processes) {
              n.processes[c].component.api = api;
              n.processes[c].component.workflowId = workflowId;
              n.processes[c].component.graphId = graphId;
              n.processes[c].component.boxName = boxName;
            }

            n.start();

            self.api.eventBus.emit('workflow-started', boxName, n.id);

            callback(null, n.id);
          });
        }, true);
      });
    });
  });
};

WorkflowsAPI.prototype.stopWorkflow = function (workflowId, callback) {
  var self = this;

  var r = self.running[workflowId];
  if (!r) return callback('Workflow not running');

  var boxName = r.boxName;

  self.running[workflowId].stop();
  self.notRunning[workflowId] = self.running[workflowId];

  delete self.running[workflowId];

  self.api.eventBus.emit('workflow-finished', boxName, workflowId);

  callback();
};

WorkflowsAPI.prototype.listGraphs = function (boxName, callback) {
  self.api.collections.find(boxName, "_graphs", {}, callback);
};

WorkflowsAPI.prototype.saveGraph = function (boxName, graph, callback) {
  var self = this;

  if (graph._id) {
    self.api.collections.update(boxName, "_graphs", {_id: graph._id}, {$set: {name: graph.name, graph: graph.graph}}, function (err) {
      return callback (err, graph._id);
    });
  } else {
    self.api.collections.insert(boxName, "_graphs", graph, function(err, graph) {
      if (graph) return callback(err, graph._id);

      return callback(err);
    });
  }
};

WorkflowsAPI.prototype.removeGraph = function (boxName, graphId, callback) {
  var self = this;

  self.api.collections.remove(boxName, "_graphs", {
    _id: graphId
  }, callback);
};

WorkflowsAPI.prototype.listComponents = function (callback) {
  var self = this;

  var defined = require('./component.json').noflo.components,
      gallery = [];

  for (var c in defined) {
    gallery.push(require(defined[c] + '/component'));
  }

  callback(null, gallery);
};

module.exports = function (api, callback) {
  var workflows = new WorkflowsAPI(api);

  callback(null, workflows);
};
