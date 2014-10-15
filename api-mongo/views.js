module.exports = function (config, connect, router, wrapper, callback) {
  function getViewsCollection(boxName, callback) {
    connect(function (err, db) {
      router.routeCollection(boxName, "_views", function (err, route) {
        wrapper.wrap(db
                     .db(route.database)
                     .collection(route.collection), {
                       collection: '_views',
                       box: boxName
                     }, callback);
      });
    });
  };

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
    },
    getView: function (boxName, viewName, callback) {
      getViewsCollection(boxName, function (err, collection){
        collection
        .findOne({
          name: viewName
        }, callback);
      });
    },
    removeView: function (boxName, viewName, callback) {
      getViewsCollection(boxName, function (err, collection) {
        collection
        .remove({
          name: viewName
        }, callback);
      });
    },
    saveView: function (boxName, viewName, template, callback) {
      getViewsCollection(boxName, function (err, collection) {
        collection
        .findOne({
          name: viewName
        }, function (err, doc) {
          if (err) return callback(err);

          if (doc) {
            collection
            .update({
              name: viewName
            }, {
              $set: {
                template: template
              }
            }, callback);
          } else {
            collection
            .insert({
              name: viewName,
              template: template
            }, callback);
          }
        });
      });
    }
  });
};
