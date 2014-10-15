module.exports = {
  "icon": "cog",
  "displayName": "Wait all",
  "helpText": "Sends a message once the number of received messages equals the number of input connections",
  "defaultModel": {
    "name": "Wait all",
    "kind": "WaitAll",
    "inputConnectors": [{
      "use": "runtime",
      "name":"Input",
      "id": "in",
      "type": "all"
    }],
    "outputConnectors": [{
      "use": "runtime",
      "name":"Done",
      "id": "out",
      "type": "bang"
    }]
  }
};
