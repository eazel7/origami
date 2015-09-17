module.exports = {
  "icon": "stop",
  "displayName": "Stop workflow",
  "helpText": "Stops the current workflow",
  "defaultModel": {
    "name": "Stop workflow",
    "kind": "WorkflowEnd",
    "inputConnectors": [{
      "name": "Stop",
      "id": "in",
      "type": "all",
      "use": "runtime"
    },{
      "name": "With result",
      "id": "success",
      "type": "all",
      "use": "runtime"
    },{
      "name": "With error",
      "id": "error",
      "type": "all",
      "use": "runtime"
    }],
    "outputConnectors": []
  }
};
