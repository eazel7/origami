module.exports = {
  "icon": "cogs",
  "displayName": "Wait workflow",
  "defaultModel": {
    "name": "Wait workflow",
    "kind": "WaitWorkflow",
    "inputConnectors": [{
      "name":"Workflow ID",
      "id": "workflowid",
      "type": "string",
      "use": "runtime"
    }],
    "outputConnectors": [{
      "name":"Done",
      "id": "done",
      "type": "object"
    },{
      "name":"With error",
      "id": "witherror",
      "type": "object"
    },{
      "name":"With success",
      "id": "withsuccess",
      "type": "object"
    }]
  }
};
