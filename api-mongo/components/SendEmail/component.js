module.exports = {
  "icon": "cogs",
  "displayName": "Script",
  "defaultModel": {
    "name": "Script",
    "kind": "Script",
    "inputConnectors": [{
        "name": "Email",
        "type": "object",
        "id": "email",
        "use": "runtime"
    },{
        "configTemplate": require('../configTemplates').string,
        "use": "configuration",
        "name": "Host",
        "type": "string",
        "id": "host"
    },{
        "configTemplate": require('../configTemplates').number,
        "use": "configuration",
        "name": "Port",
        "type": "number",
        "id": "port"
    }],
    "outputConnectors": [{
      "name": "All done",
      "type": "data",
      "id": "success"
    },{
      "name": "Error",
      "type": "data",
      "id": "error"
    }]
  }
};
