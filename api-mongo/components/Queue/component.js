module.exports = {
  "icon": "pause",
  "displayName": "Queue",
  "defaultModel": {
    "name": "Queue",
    "kind": "Queue",
    "inputConnectors": [{
        "name": "Enqueue",
        "type": "data",
        "id": "enqueue",
        "use": "runtime"
    },{
        "name": "Dequeue",
        "type": "bang",
        "id": "dequeue",
        "use": "runtime"
    },{
        "name": "Clear",
        "type": "bang",
        "id": "clear",
        "use": "runtime"
    }],
    "outputConnectors": [{
      "name": "Item",
      "type": "data",
      "id": "item"
    },{
      "name": "Length",
      "type": "int",
      "id": "length"
    }]
  }
};
