module.exports = {
  "icon": "paragraph",
  "displayName": "Create string",
  "helpText": "Creates a string from a template",
  "defaultModel": {
    "name": "Create string",
    "kind": "CreateString",
    "inputConnectors": [{
      "name": "Values",
      "use": "runtime",
      "id": "values",
      "type": "object"
    },{
      "name": "Template",
      "use": "configuration",
      "id": "template",
      "type": "string",
      "configTemplate": require('../configTemplates').textArea
    }],
    "outputConnectors": [{
      "name": "String",
      "id": "string",
      "type": "string"
    }]
  }
};
