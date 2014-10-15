module.exports = {
  "icon": "plus",
  "displayName": "Create object",
  "defaultModel": {
    "name": "Create object",
    "kind": "CreateObject",
    "inputConnectors": [{
      "name":"Trigger",
      "use": "runtime",
      "id": "trigger",
      "type": "bang"
    }],
    "outputConnectors": [{
      "name": "New object",
      "type": "object",
      "id": "object"
    }]
  }
};
