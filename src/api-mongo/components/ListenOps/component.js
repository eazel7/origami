module.exports = {
  "icon": "cogs",
  "displayName": "Listen ops",
  "defaultModel": {
    "name": "Listen ops",
    "kind": "ListenOps",
    "inputConnectors": [],
    "outputConnectors": [{
      "name":"Operation",
      "id": "out",
      "type": "object"
    }]
  }
};
