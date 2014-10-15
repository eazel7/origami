module.exports = {
  "icon": "cog",
  "displayName": "Apply RegExp",
  "defaultModel": {
    "name": "Apply RegExp",
    "kind": "ApplyRegExp",
    "inputConnectors": [{
        "name": "RegExp",
        "type": "string",
        "id": "regexp",
        "configTemplate": require('../configTemplates').string,
        "use": "configuration"
    },{
        "name": "String",
        "type": "string",
        "id": "string",
        "use": "runtime"
    }],
    "outputConnectors": [{
      "name": "Result",
      "id": "out",
      "type": "array"
    }]
  }
};
