module.exports = {
  "icon": "cog",
  "displayName": "Trigger Workflow",
  "defaultModel": {
    "name": "Trigger Workflow",
    "kind": "TriggerWorkflow",
    "inputConnectors": [{
        "name": "Graph ID",
        "type": "string",
        "id": "graph",
        "configTemplate": require('../configTemplates').graphId,
        "use": "configuration"
    },{
        "name": "Start",
        "type": "string",
        "id": "start",
        "use": "runtime"
    }],
    "outputConnectors": [{
      "name": "Workflow ID",
      "id": "workflowid",
      "type": "string"
    },{
      "name": "Error",
      "id": "error",
      "type": "data"
    }]
  }
};
