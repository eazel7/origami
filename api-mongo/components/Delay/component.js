module.exports = {
  "icon": "clock-o",
  "displayName": "Delay",
  "defaultModel": {
    "name": "Delay",
    "kind": "Delay",
    "inputConnectors": [{
      "use": "configuration",
      "name": "Delay",
      "type": "number",
      "configTemplate": require('../configTemplates').number,
      "id": "delay"
    },{
      "name": "Trigger",
      "use": "runtime",
      "type": "all",
      "id": "trigger"
    }],
    "outputConnectors": [{
      "name": "Success",
      "type": "all",
      "id": "success"
    },{
      "name": "Error",
      "type": "data",
      "id": "error"
    }]
  }
};
