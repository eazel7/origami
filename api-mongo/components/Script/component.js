module.exports = {
  "icon": "cogs",
  "displayName": "Script",
  "defaultModel": {
    "name": "Script",
    "kind": "Script",
    "inputConnectors": [{
        "name": "Input",
        "type": "data",
        "id": "input",
        "use": "runtime"
    },{
        "configTemplate": require('../configTemplates').script,
        "use": "configuration",
        "name": "Script",
        "type": "data",
        "id": "script"
    }],
    "outputConnectors": [{
      "name": "Output",
      "type": "data",
      "id": "success"
    },{
      "name": "Error",
      "type": "data",
      "id": "error"
    }]
  }
};
