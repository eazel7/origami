var async = require('async');

module.exports = function () {
  return {
    transfer: function (req, res) {
      var api = req.api;
      
      async.eachSeries(req.body.collections, function (sourceCollection, callback) {
        api.collections.find(req.body.from, collectionName, {}, function (err, docs) {
          if (err) return callback (err);
          
          api.collections.remove(req.body.target, collectionName, {}, function (err) {
            if (err) return callback (err);
            
            async.eachSeries(docs, function (doc, callback) {
              api.collections.insert(req.body.target, collectionName, doc, callback, 'system');
            }, callback);
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
