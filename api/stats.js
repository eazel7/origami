/* eslint-disable semi */

function Stats (collections, syncWarpper) {
  this.collections = collections;
  this.syncWarpper = syncWarpper;
}

Stats.prototype.getBoxUsage = function (boxName, from, to, collection, callback) {
  var self = this;

  var day0 = new Date(from);
  var dayZ = new Date(to);
  day0 = day0.setHours(0, 0, 0, 0);
  dayZ = dayZ.setHours(0, 0, 0, 0) + (1000 * 60 * 60 * 24);

  var filter = {
    date: {
      $gte: day0,
      $lte: dayZ
    }
  };

  var byDate = {};
  while (day0 < dayZ) {
    byDate[day0] = 0;
    day0 = day0 + (1000 * 60 * 60 * 24);
  }

  if (collection) filter.collection = collection;

  self.syncWrapper
  .getLog(boxName, function (err, logCollection) {
    if (err) return callback(err);

    logCollection
    .find(filter, {
      date: 1,
      _id: -1
    })
    .sort({
      date: 1
    })
    .toArray(function (err, docs) {
      if (err) return callback(err);

      for (var i = 0; i < docs.length; i++) {
        var date = new Date(docs[i].date);
        date.setHours(0, 0, 0, 0);

        var key = date.valueOf();
        byDate[key] = (byDate[key] || 0) + 1;
      }

      var list = [];

      for (var k in byDate) {
        list.push({
          date: Number(k),
          value: byDate[k]
        });
      }

      list.sort(function (a, b) {
        if (a.date > b) return -1;
        if (a.date < b) return 1;
        return 0;
      });

      callback(null, list);
    });
  });
};

Stats.prototype.getBoxErrors = function (boxName, from, to, callback) {
  var self = this;

  var day0 = new Date(from);
  var dayZ = new Date(to);

  day0 = day0.setHours(0, 0, 0, 0);
  dayZ = dayZ.setHours(0, 0, 0, 0) + (1000 * 60 * 60 * 24);

  var filter = {
    date: {
      $gte: day0,
      $lte: dayZ
    }
  };

  self.collections
  .count(boxName, '_errors', filter, callback);
}

module.exports = function (collections, syncWrapper, callback) {
  var stats = new Stats(collections, syncWrapper);

  callback(null, stats);
};
