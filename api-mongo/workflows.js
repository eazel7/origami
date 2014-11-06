module.exports = function (api, callback) {
  var running = {},
      notRunning = {},
      noflo = require('noflo'),
      uuid = require('node-uuid');
            
  api.eventBus.on('workflow-output', function (boxName, workflowId, output) {
    var w = running[workflowId] || notRunning[workflowId];
    if (w) {
      if (w.output === undefined) w.output = [];
      
      w.output.push(output);
    }
  });
      
  function setApiInComponents(api) {
    var defined = require('./component.json').noflo.components;
    for (var c in defined) {
      var component = require(defined[c]);
      component.api = api;
    }
  }
  
  setApiInComponents(api);
  
  function toNofloGraph(flow, params, wMetadata) {
    var graph = {
      processes: {},
      properties: {},
      connections: []
    },
      nodesById = {};

    for (var i = 0; i < flow.nodes.length; i++) {
      var node = flow.nodes[i],
          nodeId = String(node.id);

      nodesById[nodeId] = node;
      
      if (!node.disabled) {
        for (var j = 0; j < node.inputConnectors.length; j++) {
          if (node.inputConnectors[j].initial) {
            graph.connections.push({
              "data": String(node.inputConnectors[j].initial),
              "tgt": {
                "port": node.inputConnectors[j].id,
                "process": nodeId
              },
              "metadata": {
//                id: node.inputConnectors[j].
              }
            });
          }
        }
        graph.processes[nodeId] = {
          "component": flow.nodes[i].kind,
          "metadata": wMetadata
        };
      }
    }

    if (flow.connections) {
      for (var j = 0; j < flow.connections.length; j++) {
        var connector = flow.connections[j];
        
        var outNodeId = String(connector.source.nodeID),
        outNode = nodesById[outNodeId],
        outPortId = outNode.outputConnectors[connector.source.connectorIndex].id,
        inNodeId = String(connector.dest.nodeID),
        inNode = nodesById[inNodeId],
        inPortId = inNode.inputConnectors[connector.dest.connectorIndex].id;

        if (!outNode.disabled || !inNode.disabled) {
//          console.log(connector);
          graph.connections.push({
            "metadata": {
              id: connector.id
            },
            "src": {
              "process": outNodeId,
              "port": outPortId
            },
            "tgt": {
              "process": inNodeId,
              "port": inPortId
            }
          });
        }
      }
    }

    return graph;
  }

  self = {
    listPastWorkflows: function (boxName, graphId, callback) {
      api.collections.getCollection(boxName, '_workflowResults', function (err, collection) {
        if (err) return callback (err);
        
        collection.find({
          graphId: graphId
        }, callback);
      });
    },
    getWorkflowResult: function (boxName, workflowId, callback) {
      api.collections.getCollection(boxName, '_workflowResults', function (err, collection) {
        if (err) return callback (err);
        
        collection.findOne({
          workflowId: workflowId
        }, function (err, doc) {
          if (err) return callback (err);
          
          if (doc) return callback (null, { err: doc.err, result: doc.result });
          
          return callback (null, null);
        });
      });
    },
    setWorkflowResult: function (boxName, workflowId, graphId, err, result, callback) {
      api.collections.getCollection(boxName, '_workflowResults', function (err, collection) {
        if (err) return callback(err);
        
        collection
        .count({
          workflowId: workflowId
        }, function (err, count) {
          if (err) return callback(err);
          
          if (count) {
            collection
            .update({
              workflowId: workflowId
            }, {
              $set: {
                err: err,
                result: result,
                unknown: !result && !err
              }
            }, callback);
          } else {
            collection
            .insert({
              workflowId: workflowId,
              graphId: running[workflowId] ? running[workflowId].graphId : notRunning[workflowId].graphId,
              err: err,
              result: result,
              unkown: !err && !result
            }, callback);
          }
        });
      });
    },
    listRunningWorkflows: function (boxName, callback) {
      var workflows = [];

      for (var id in running) {
        var r = running[id];

        if (r.boxName === boxName)
          workflows.push({
            id: id,
            startupDate: r.startupDate,
            graphId: r.graphId,
            params: r.initials
          });
      }

      callback(null, workflows);
    },
    getActiveConnections: function (workflowId, callback) {
      var r = running[workflowId];
      
      if (!r) return callback('Workflow not running');
      
      callback(null, r.activeConnections);
    },
    getOutput: function (workflowId, callback) {
      var w = running[workflowId] || notRunning[workflowId];
  
      if (w) {
        return callback(null, w.output || []);
      } else {
        return callback('Workflow not found');
      }
    },
    saveWorkflowEndDate: function (boxName, workflowId, graphId, callback) {
      api.collections.getCollection(boxName, '_workflowResults', function (err, collection) {
        if (err) return callback(err);
        
        collection
        .count({
          workflowId: workflowId
        }, function (err, count) {
          if (err) return callback(err);
          
          if (count) {
            collection
            .update({
              workflowId: workflowId
            }, {
              $set: {
                endDate: new Date()
              }
            }, callback);
          } else {
            collection
            .insert({
              workflowId: workflowId,
              graphId: running[workflowId] ? running[workflowId].graphId : notRunning[workflowId].graphId,
              endDate: new Date()
            }, callback);
          }
        });
      });
    },
    saveWorkflowStartDate: function (boxName, workflowId, graphId, callback) {
      api.collections.getCollection(boxName, '_workflowResults', function (err, collection) {
        if (err) return callback(err);
        
        collection
        .count({
          workflowId: workflowId
        }, function (err, count) {
          if (err) return callback(err);
          
          if (count) {
            collection
            .update({
              workflowId: workflowId
            }, {  
              $set: {
                startDate: new Date()
              }
            }, callback);
          } else {
            collection
            .insert({
              workflowId: workflowId,
              graphId: graphId,
              startDate: new Date()
            }, callback);
          }
        });
      });
    },
    startWorkflow: function (boxName, graphId, params, callback) {
      function getWorkflowEnd(id){
        return function () {
          if (!running[id]) return;
          
          console.log(running[id]);
          notRunning[id] = running[id];
          notRunning[id].endDate = new Date();
          
          self.saveWorkflowEndDate(boxName, id, graphId, function (err) {
            self.getWorkflowResult(boxName, id, function (err, result) {
              if (err) return console.error(err);
              
              if (!result) {
                self.setWorkflowResult(boxName, id, graphId, null, null, function (err) {
                  if (err) console.error(err);
                });
              }
            });
            
            delete running[id];
            
            api.eventBus.emit('workflow-finished', boxName, id);
          });
        }
      }
      
      api.collections.getCollection(boxName, "_graphs", function (err, collection) {
        collection.findOne({_id: graphId}, function (err, doc) {
          if (err) return callback(err);
          if (!doc) return callback(new Error('Graph does not exists'));
          if (!doc.graph) return callback(new Error('Graph does not contains any nodes'));
          
          var workflowId = uuid.v4();
          
          self.saveWorkflowStartDate(boxName, workflowId, graphId, function (err) {
            if (err) return callback(err);
            
            var jsonGraph = toNofloGraph(doc.graph, {}, {
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
                      api.eventBus.emit('workflow-connection-on', boxName, workflowId, id);
                    }
                });
                n.on('disconnect', function (event) {
                  var socket = event.socket;
                  
                  if (socket.from && socket.from.process && socket.from.process.id && socket.to && socket.to.process && socket.to.process.id) {
                    var id = socket.from.process.id + ':' + socket.from.port + '/' + socket.to.process.id + ':' + socket.to.port;
                    
                    if (n.activeConnections.indexOf(id) !== -1) {
                      n.activeConnections.splice(n.activeConnections.indexOf(id), -1);
                      api.eventBus.emit('workflow-connection-off', boxName, workflowId, id);
                    }
                  }
                });
                
                n.connect(function () {
                  n.id = workflowId;
                  n.graphId = graphId;
                  n.startDate = new Date();

                  n.boxName = boxName;
                  
                  running[n.id] = n;
                  n.on('end', function () {
                    console.log('workflow end');
                    getWorkflowEnd(n.id, doc.name)
                  });
                  
                  for (var c in n.processes) {
                    n.processes[c].component.api = api;
                    n.processes[c].component.workflowId = workflowId;
                    n.processes[c].component.graphId = graphId;
                    n.processes[c].component.boxName = boxName;
                  }
                  
                  n.start();
                  api.eventBus.emit('workflow-started', boxName, n.id);

                  callback(null, n.id);
                });
              }, true);
            });
              
          });
        });
      });
    },
    stopWorkflow: function (workflowId, callback) {
      var r = running[workflowId];
      if (!r) return callback('Workflow not running');
      var boxName = r.boxName;
      
      running[workflowId].stop();
      notRunning[workflowId] = running[workflowId];
      
      delete running[workflowId];

      console.log(notRunning[workflowId].output);
      api.eventBus.emit('workflow-finished', boxName, workflowId);

      callback();
    },
    listGraphs: function (boxName, callback) {
      api.collections.getCollection(boxName, "_graphs", function (err, collection) {
        if (err) return callback(err);
        
        collection.find({}, callback);
      });
    },
    saveGraph: function (boxName, graph, callback) {
      api.collections.getCollection(boxName, "_graphs", function (err, collection){
        if (err) return callback(err);

        if (graph._id) {
          collection.update({_id: graph._id}, {$set: {name: graph.name, graph: graph.graph}}, function (err) {
            return callback (err, graph._id);
          });
        } else {
          collection.insert(graph, function(err, graph) {
            if (graph) return callback(err, graph._id);
            return callback(err);
          });
        }
      });
    },
    removeGraph: function (boxName, graphId, callback) {
      api.collections.getCollection(boxName, "_graphs", function (err, collection){
        if (err) return callback(err);
          collection.remove({
            _id: graphId
          }, callback);
      });
    },
    listComponents: function (callback) {
      var defined = require('./component.json').noflo.components,
          gallery = [];
      for (var c in defined) {
        gallery.push(require(defined[c] + '/component'));
      }
      
      callback(null, gallery);
    }
  }
  
  callback (null, self);
};
