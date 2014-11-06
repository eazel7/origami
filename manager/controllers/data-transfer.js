var async = require('async');

module.exports = function () {
  return {
    transfer: function (req, res) {
      var api = req.api;
      
      async.eachSeries(req.body.collections, function (collectionName, callback) {
        api.collections.getCollection(req.body.from, collectionName, function (err, sourceCollection) {
          if (err) return callback (err);
          
          api.collections.getCollection(req.body.target, collectionName, function (err, targetCollection) {
            if (err) return callback (err);
            
            sourceCollection.find({}, function (err, docs) {
              if (err) return callback (err);
              
              targetCollection.remove({}, function (err) {
                if (err) return callback (err);
                
                async.eachSeries(docs, function (doc, callback) {
                  targetCollection.insert(doc, callback, 'system');
                }, callback);
              });
            });
          });
        });
      }, function (err) {
        if (err) {
          console.error(err);
          res.status(500);
          return res.end();
        }
        
        res.status(200);
        res.end();
      });
    }
  }
};
