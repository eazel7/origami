module.exports = {
  "icon": "filter",
  "displayName": "Filter by property",
  "defaultModel": {
    "name": "Filter by property",
    "kind": "FilterByProperty",
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
    }],
    "outputConnectors": [{
      "name": "Empty",
      "id": "empty",
      "type": "object"
    },{
      "name": "Not empty",
      "id": "notempty",
      "type": "object"
    }]
  }
};
