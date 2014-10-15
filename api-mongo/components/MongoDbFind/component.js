module.exports = {
  "icon": "database",
  "displayName": "Find in MongoDB",
  "defaultModel": {
    "name": "Find in MongoDB",
    "kind": "MongoDbFind",
    "inputConnectors": [{
        "name": "Collection",
        "type": "string",
        "id": "collection",
        "configTemplate": require('../configTemplates').string,
        "use": "configuration"
    },{
        "name": "URI",
        "type": "string",
        "id": "uri",
        "configTemplate": require('../configTemplates').string,
        "use": "configuration"
    },{
        "name": "Predicate",
        "type": "object",
        "id": "predicate",
        "use": "runtime"
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
