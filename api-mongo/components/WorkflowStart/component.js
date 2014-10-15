module.exports = {
  "icon": "play",
  "displayName": "Workflow start",
  "helpText": "Sends the input parameters of the workflow as an object to the output port",
  "defaultModel": {
    "name": "Workflow starts",
    "kind": "WorkflowStart",
    "inputConnectors": [],
    "outputConnectors": [{
      "name": "Starts",
      "id": "out",
      "type": "object"
    }]
  }
};
