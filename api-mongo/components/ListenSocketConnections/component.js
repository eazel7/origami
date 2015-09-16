module.exports = {
  "icon": "cogs",
  "displayName": "Listen socket connections",
  "defaultModel": {
    "name": "List socket connections",
    "kind": "ListenSocketConnections",
    "inputConnectors": [],
    "outputConnectors": [{
      "name":"Disconnected",
      "id": "disconnected",
      "type": "object"
    },{
      "name":"Connected",
      "id": "connected",
      "type": "object"
    }]
  }
};
