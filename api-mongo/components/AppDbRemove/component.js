module.exports = {
  "icon": "times",
  "displayName": "Remove data",
  "defaultModel": {
    "name": "Remove data",
    "kind": "AppDbRemove",
    "inputConnectors": [{
        "use": "configuration",
        "configTemplate": require('../configTemplates').string,
        "name": "Collection",
        "type": "string",
        "id": "collection"
    },{
        "use": "runtime",
        "name": "Predicate",
        "type": "object",
        "id": "predicate"
    }],
    "outputConnectors": [{
      "name": "Success",
      "type": "data",
      "id": "success"
    },{
      "name": "Error",
      "type": "data",
      "id": "error"
    }]
  }
};
