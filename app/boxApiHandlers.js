module.exports = function (boxName, api) {
  return {
    getCollections: function (req, res) {
      return api.collections.getCollections(
        boxName,
        function (err, names){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          return res.json(names);
        });
    },
    findInCollection: function (req, res) {
      return api.collections.getCollection(
        boxName,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.find(req.body || {}, function (err, docs) {
            if (err) {
              console.log({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            return res.json(docs);
          });
        });
    },
    findOneInCollection: function (req, res) {
      return api.collections.getCollection(
        boxName,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.findOne(req.body || {}, function (err, doc) {
            if (err) {
              console.log({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            if (!doc) {
              res.status(404);
              return res.end();
            }

            return res.json(doc);
          });
        });
    },
    countInCollection: function (req, res) {
      api.collections.getCollection(
        boxName,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.count(req.body || {}, function (err, docs) {
            if (err) {
              console.log({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            return res.json(docs);
          });
        });
    },
    removeInCollection: function (req, res) {
      return api.collections.getCollection(boxName, req.params.collection, function (err, collection){
        if (err) {
          console.log({ box: boxName, url: req.params.url, err: err});
          res.status(418);
          return res.end();
        }

        collection.remove(req.body || {}, function (err) {
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          res.status(200);
          return res.end();
        }, req.headers['box.browserkey']);
      });
    },
    insertInCollection: function (req, res) {
      return api.collections.getCollection(
        boxName,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.insert(req.body || {}, function (err, newDoc) {
            if (err) {
              console.log({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            return res.json(newDoc);
          }, req.headers['box.browserkey']);
        });
    },
    updateInCollection: function (req, res) {
      return api.collections.getCollection(
        boxName,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.update((req.body || {}).predicate || {}, (req.body||{}).replacement || {}, function (err, newDoc) {
            if (err) {
              console.log({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            res.status(200);
            return res.end();
          }, req.headers['box.browserkey']);
        });
    },
    findInRemoteDb: function (req, res) {
      api.remoteDbs.getCollection (
        boxName,
        req.params.name,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.find(req.body || {})
          .toArray(function (err, docs) {
            if (err) {
              console.error({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            return res.json(docs);
          });
        });
    },
    countInRemoteDb: function (req, res) {
      api.remoteDbs.getCollection (
        boxName,
        req.params.name,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.error({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.count(req.body || {}, function (err, docs) {
            if (err) {
              console.error({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            return res.json(docs);
          });
        });
    },
    findOneInRemoteDb: function (req, res) {
      api.remoteDbs.getCollection (
        boxName,
        req.params.name,
        req.params.collection,
        boxName,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.error({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.findOne(req.body || {}, function (err, doc) {
            if (err) {
              console.error({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            if (!doc) {
              res.status(404);
              return res.end();
            }

            return res.json(doc);
          });
        });
    },
    updateInRemoteDb: function (req, res) {
      api.remoteDbs.getCollection (
        boxName,
        req.params.name,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.update((req.body || {}).predicate || {}, (req.body||{}).replacement || {}, { w: 1, multi: true }, function (err, newDoc) {
            if (err) {
              console.log({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            res.status(200);
            return res.end();
          }, req.headers['box.browserkey']);
        });
    },
    removeInRemoteDb: function (req, res) {
      api.remoteDbs.getCollection (
        boxName,
        req.params.name,
        req.params.collection,
        function (err, collection) {
          if (err) {
            console.error({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.remove(req.body, { w: 1 }, function (err) {
            if (err) {
              console.error({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            res.status(200);
            return res.end();
          }, req.headers['box.browserkey']);
      });
    },
    insertInRemoteDb: function (req, res) {
      api.remoteDbs.getCollection (
        boxName,
        req.params.name,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.insert(req.body, { w: 1 }, function (err, newDoc) {
            if (err) {
              console.log({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            return res.json(newDoc);
          }, req.headers['box.browserkey']);
        });
    },
    getQueuedSyncOps: function (req, res) {
      function handleErr (err){
        console.log(err);
        res.status(418);
        return res.end();
      }
      
      api.syncWrapper.getLog(boxName, function (err, log) {
        log
        .find({
          date: {
            $gt: Number(req.params.from)
          }
        })
        .toArray(function (err, docs) {
          if (err) return handleErr(err)
          var rawOps = docs.length;

          require('./compressOps')(docs, boxName, api, function (err, compressedOps) {
            if (err) return handleErr(err);
            
            console.log('Compression: ' + rawOps + ' vs ' + compressedOps.length);

            res.json(docs || []);
          });
        });
      });
    },
    startSchedule: function (req, res) {
      api.schedules.startSchedule(boxName, req.params.id, function (err) {
        if (err) {
          console.log(err);
          res.status(418);
        } else {
          res.status(200);
        }
        
        res.end();
      });
    },
    stopSchedule: function (req, res) {
      api.schedules.stopSchedule(boxName, req.params.id, function (err) {
        if (err) {
          console.log(err);
          res.status(418);
        } else {
          res.status(200);
        }
        
        res.end();
      });
    }
  };
};
