/* eslint-disable semi */

function Views (collections) {
  this.collections = collections;
}

Views.prototype.listviews = function (boxName, callback) {
  var self = this;

  self.collections.getCollection(
    boxName,
    '_views',
    function (err, collection) {
      if (err) return callback(err);

      collection
      .find({}, function (err, docs) {
        if (err) return callback(err);

        var viewNames = [];

        for (var i = 0; i < docs.length; i++) {
          viewNames.push(docs[i].name);
        }

        callback(null, viewNames);
      });
    });
};

module.exports = function (collections, callback) {
  var views = new Views(collections);

  callback(null, views);
};
