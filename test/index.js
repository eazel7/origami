describe('origami', function () {
  var api;

  before(function (done) {
    this.timeout(30000);
    require('mongodb').MongoClient.connect(
      'mongodb://localhost:27017/origami-test',
      function (err, db) {
        if (err) return done(err);

        var collectionNames = [];
        db.listCollections().each(function (err, object) {
          if (err) return done(err);

          if (object) return collectionNames.push(object.name);

          require('async').eachSeries(
            collectionNames,
            function (collectionName, callback) {
              db.dropCollection(collectionName, callback);
            },
            done
          );
        });
      });
    // require('../api')({
    //
    // }, function (err, apiInstance) {
    //   if (err) return done(err);
    //
    //   api = apiInstance;
    //
    //   done();
    // })
  })

  describe('BoxesAPI', function () {
    describe('.list', function () {
      it('lists boxes', function () {

      });
    });
  });
});
