module.exports = {
  "icon": "arrows-alt",
  "displayName": "Compare",
  "defaultModel": {
    "name": "Compare",
    "kind": "Compare",
    "inputConnectors": [{
        "name": "Data",
        "type": "data",
        "id": "object",
        "use": "runtime"
    },{
        "name": "Value",
        "type": "data",
        "id": "value",
        "configTemplate": require('../configTemplates').string,
        "use": "configuration"
    }],
    "outputConnectors": [{
      "name": "Equal",
      "id": "equal",
      "type": "data"
    },{
      "name": "Not equal",
      "id": "notequal",
      "type": "data"
    },{
      "name": "Greater",
      "id": "greater",
      "type": "data"
    },{
      "name": "Lesser",
      "id": "lesser",
      "type": "data"
    }]
  }
};
