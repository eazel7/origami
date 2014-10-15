module.exports = {
  "icon": "terminal",
  "displayName": "Log to console",
  "helpText": "Logs the input the input to the workflow console",
  "defaultModel": {
    "name": "Log to console",
    "kind": "LogToConsole",
    "inputConnectors": [{
      "use": "runtime",
      "name":"Input",
      "id": "in",
      "type": "all"
    }],
    "outputConnectors": []
  }
};
