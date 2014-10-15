module.exports = {
  "icon": "comment-o",
  "displayName": "Broadcast notification",
  "helpText": "Sends a desktop notification to all possible users",
  "defaultModel": {
    "name": "Broadcast desktop notification",
    "kind": "BroadcastDesktopNotification",
    "inputConnectors": [{
      "use": "runtime",
      "name":"Message",
      "id": "in",
      "type": "string"
    }],
    "outputConnectors": []
  }
};
