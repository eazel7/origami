module.exports = {
  "icon": "edit",
  "displayName": "Get property",
  "defaultModel": {
    "name": "Get property",
    "kind": "GetProperty",
    "inputConnectors": [{
        "name": "Object",
        "type": "object",
        "id": "object",
        "use": "runtime"
    },{
        "name": "Property",
        "type": "string",
        "id": "property",
        "configTemplate": require('../configTemplates').string,
        "use": "configuration"
    }],
    "outputConnectors": [{
      "name": "Result",
      "id": "value",
      "type": "data"
    }]
  }
};
