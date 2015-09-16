module.exports = function (ops, boxName, api, callback) {
  var opsByCollection = {}
      async = require('async'),
      newOps = [];
  
  for (var i = 0; i < ops.length; i++) {
    var op = ops[i];
    if (!opsByCollection[op.collection]) opsByCollection[op.collection] = [];
    
    opsByCollection[op.collection].push(i);
  }
  
  async.each(Object.keys(opsByCollection), function (collName, collCallback) {
    api
    .collections
    .count(boxName, collName, {}, function (err, count) {
      if (count < opsByCollection[collName].length) {
        // there are more operations that the collection's actual size
        // it is safe to replace them all with a single reset instruction
        // or a remove op followed by inserts
        
        var firstOpDate = ops[opsByCollection[collName][0]].date,
            lastOpDate = firstOpDate;
        
        for (var i = 0; i < opsByCollection[collName].length; i++) {
          if (lastOpDate < ops[opsByCollection[collName][i]].date) lastOpDate = ops[opsByCollection[collName][i]].date;
          ops[opsByCollection[collName][i]] = undefined;
        }
        
        ops[ops.indexOf(undefined)] = {
          op: 'remove',
          collection: collName,
          predicate: JSON.stringify({}),
          date: firstOpDate
        };
        
        return api.collections.find(boxName, collName, {}, function (err, docs) {
          for (var i = 0; i < docs.length; i++) {
            ops[ops.indexOf(undefined)] = {
              op: 'insert',
              collection: collName,
              date: lastOpDate,
              object: JSON.stringify(docs[i])
            };
          }
      
          collCallback();
        });
      }
      
      collCallback();
    });
  }, function (err) {
    for (var i = ops.length - 1; i >= 0; i--) {
      if (ops[i] === undefined) ops.splice(i, 1); 
    }
    
    callback(err, ops);
  });
};
