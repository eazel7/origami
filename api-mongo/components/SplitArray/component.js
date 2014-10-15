module.exports = {
  "icon": "reorder",
  "displayName": "Split array",
  "helpText": "For every input array sends each element to the output",
  "defaultModel": {
    "name": "Split array",
    "kind": "SplitArray",
    "inputConnectors": [{
      "name": "Array",
      "use": "runtime",
      "id": "in",
      "type": "array"
    }],
    "outputConnectors": [{
      "name": "Objects",
      "id": "out",
      "type": "object"
    }]
  }
};
