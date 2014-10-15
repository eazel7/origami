module.exports = {
  "icon": "edit",
  "displayName": "Set property",
  "defaultModel": {
    "name": "Set property",
    "kind": "SetProperty",
    "inputConnectors": [{
        "name": "Object",
        "type": "object",
        "id": "object",
        "use": "runtime"
    },{
        "name": "Property",
        "type": "string",
        "id": "property",
        "use": "configuration",
        "configTemplate": require('../configTemplates').string
    },{
        "name": "Set value",
        "type": "data",
        "id": "value",
        "use": "runtime"
    }],
    "outputConnectors": [{
      "name": "Result",
      "id": "object",
      "type": "object"
    }]
  }
};
