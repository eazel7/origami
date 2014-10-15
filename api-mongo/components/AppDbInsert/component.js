module.exports = {
  "icon": "plus",
  "displayName": "Insert data",
  "defaultModel": {
    "name": "Insert data",
    "kind": "AppDbInsert",
    "inputConnectors": [{
        "use": "configuration",
        "configTemplate": require('../configTemplates').string,
        "name": "Collection",
        "type": "string",
        "id": "collection"
    },{
        "use": "runtime",
        "name": "Object",
        "type": "object",
        "id": "object"
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
