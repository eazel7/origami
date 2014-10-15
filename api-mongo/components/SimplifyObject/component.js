module.exports = {
  "icon": "compress",
  "displayName": "Simplify object",
  "defaultModel": {
    "name": "Simplify object",
    "kind": "SimplifyObjects",
    "inputConnectors": [{
        "name": "Props.",
        "type": "string",
        "id": "props",
        "use": "configuration"
    },{
        "name": "Object",
        "type": "object",
        "id": "object",
        "use": "runtime"
    }],
    "outputConnectors": [{
      "name": "Object",
      "id": "object",
      "type": "object"
    }]
  }
};
