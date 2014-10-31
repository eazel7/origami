module.exports = function (connect, router, syncWrapper, callback) {
  connect(function (err, db) {
    if (err) return callback (err);
    
    callback (null, {
      getBoxUsage: function (boxName, from, to, collection, callback) {
        var filter = {
          date: {
            $gte: new Date(from).valueOf(),
            $lte: new Date(to).valueOf()
          }
        };
        
        if (collection) filter.collection = collection;
        
        syncWrapper
        .getLog(boxName, function (err, logCollection) {
          if (err) return callback (err);
        
          logCollection
          .find(filter, {
            date: 1,
            _id: -1
          })
          .sort({
            date: 1
          })
          .toArray(function (err, docs) {
            if (err) return callback (err);
            
            var byDate = {};
            
            for (var i = 0; i < docs.length; i++){
              var date = new Date(docs[i].date);
              date.setHours(0,0,0,0);
              
              var key = date.valueOf();
              byDate[key] = (byDate[key] || 0) + 1;
            }
            
            var list = [];
            
            for (var k in byDate) {
              list.push({
                date: k,
                value: byDate[k]
              });
            }
            
            list.sort(function (a, b) {
              if (a.date > b) return -1;
              if (a.date < b) return 1;
              return 0;
            })
            
            callback(null, list);
          });        
        });
      }
    });
  });
};
