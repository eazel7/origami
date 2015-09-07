module.exports = function (collections, callback) {
  callback(null, {
    listViews: function (boxName, callback) {
      getViewsCollection(boxName, function (err, collection){
        collection
        .find({}, function (err, docs) {
          var viewNames = [];

          for (var i = 0; i < docs.length; i++) {
            viewNames.push(docs[i].name);
          }

          callback(null, viewNames);
        });
      });
    }
  });
};
