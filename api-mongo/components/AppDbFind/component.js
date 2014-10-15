module.exports = {
  "icon": "database",
  "displayName": "Find data",
  "helpText": "Performs a find in the application database in a specific collection, it is triggered when a predicate object is received",
  "defaultModel": {
    "name": "Find data",
    "kind": "AppDbFind",
    "inputConnectors": [{
        "use": "runtime",
        "name": "Predicate",
        "type": "object",
        "id": "predicate"
    },{
        "use": "configuration",
        "configTemplate": require('../configTemplates').string,
        "name": "Collection",
        "type": "string",
        "id": "collection"
    }],
    "outputConnectors": [{
      "name": "Success",
      "id": "data",
      "type": "object"
    },{
      "name": "Error",
      "id": "error",
      "type": "object"
    }]
  }
};
