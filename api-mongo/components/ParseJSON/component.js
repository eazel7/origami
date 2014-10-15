module.exports = {
  "icon": "cog",
  "displayName": "Parse JSON",
  "defaultModel": {
    "name": "Parse JSON",
    "kind": "ParseJSON",
    "inputConnectors": [{
        "name": "String",
        "type": "string",
        "id": "string",
        "use": "runtime"
    }],
    "outputConnectors": [{
      "name": "Object",
      "id": "object",
      "type": "object"
    },{
      "name": "Error",
      "id": "error",
      "type": "data"
    }]
  }
};
