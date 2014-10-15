module.exports = {
  "icon": "filter",
  "displayName": "Slice array",
  "defaultModel": {
    "name": "Slice array",
    "kind": "SliceArray",
    "inputConnectors": [{
      "name":"From",
      "id": "from",
      "type": "number",
      "configTemplate": require('../configTemplates').number,
      "use": "configuration"
    },{
      "name":"To",
      "id": "to",
      "type": "number",
      "configTemplate": require('../configTemplates').number,
      "use": "configuration"
    },{
      "name":"Input",
      "id": "in",
      "type": "all",
      "use": "runtime"
    }],
    "outputConnectors": [{
      "name":"Output",
      "id": "out",
      "type": "object"
    }]
  }
};
