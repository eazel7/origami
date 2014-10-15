module.exports = {
  "icon": "cloud-download",
  "displayName": "HTTP GET",
  "defaultModel": {
    "name": "HTTP GET",
    "kind": "HTTPGet",
    "inputConnectors": [{
        "name": "URL",
        "use": "configuration",
        "type": "string",
        "configTemplate": require('../configTemplates').string,
        "id": "url"
    },{
        "name": "Query string",
        "use": "runtime",
        "type": "object",
        "id": "querystring"
    }],
    "outputConnectors": [{
      "name": "Success",
      "type": "data",
      "id": "success"
    },{
      "name": "Error",
      "type": "data",
      "id": "error"
    }]
  }
};
