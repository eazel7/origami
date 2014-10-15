module.exports = {
  "icon": "edit",
  "displayName": "Update data",
  "defaultModel": {
    "name": "Update data",
    "kind": "AppDbUpdate",
    "inputConnectors": [{
        "use": "configuration",
        "configTemplate": require('../configTemplates').string,
        "name": "Collection",
        "type": "string",
        "id": "collection"
    },{
        "use": "runtime",
        "name": "Replacement",
        "type": "object",
        "id": "replacement"
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
