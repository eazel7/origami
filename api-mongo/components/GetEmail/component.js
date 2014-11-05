module.exports = {
  "icon": "edit",
  "displayName": "Get property",
  "defaultModel": {
    "name": "Get property",
    "kind": "GetProperty",
    "inputConnectors": [{
        "name": "Host",
        "type": "string",
        "id": "host",
        "use": "configuration",
        "configTemplate": require('../configTemplates').string
    },{
        "name": "Port",
        "type": "string",
        "id": "port",
        "use": "configuration",
        "configTemplate": require('../configTemplates').number
    },{
        "name": "Username",
        "type": "string",
        "id": "username",
        "use": "configuration",
        "configTemplate": require('../configTemplates').string
    },{
        "name": "Password",
        "type": "string",
        "id": "password",
        "use": "configuration",
        "configTemplate": require('../configTemplates').password
    },{
        "name": "Get e-mails",
        "type": "bang",
        "id": "getemails",
        "use": "runtime"
    }],
    "outputConnectors": [{
      "name": "e-mails",
      "id": "value",
      "type": "data"
    },{
      "name": "error",
      "id": "error",
      "type": "data"
    }]
  }
};
