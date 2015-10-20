var formidable = require('formidable'), fs = require('fs');

module.exports = function () {
  return {
    listBoxes: function (req, res) {
      var api = req.api;

      api.boxes.listBoxes(function (err, boxes) {
        var boxNames = [];
        for (var i = 0; i < boxes.length; i++) {
          boxNames.push(boxes[i].name);
        }

        res.json(boxNames);
      });
    },
    getActivePackagesWithDependencies: function (req, res) {
      var api = req.api;

      api.packages.getActivePackagesWithDependencies(req.params.boxName, function (err, all) {
        if (err) {
          console.error(err);
          res.status(418);
          return res.end();
        }

        res.json(all);
      });
    },
    isNameFree: function (req, res) {
      var api = req.api;

      api.boxes.listBoxes(function (err, boxes) {
        var free = true;
        for (var i = 0; i < boxes.length; i++) {
          if (boxes[i].name == req.params.boxName) {
            free = false;
            break;
          }
        }

        res.status(free ? 200 : 418);
        res.end();
      });
    },
    getBoxInfo: function (req, res) {
      var api = req.api;

      api.boxes.getBoxInfo(req.params.boxName, function (err, info) {
        if (!info) {
          res.status(404);
          res.end();
        } else {
          res.json(info);
        }
      });
    },
//    getBoxAccess: function (req, res) {
//      var api = req.api;
//
//      api.boxes.getBox(req.params.boxName, function (err, box) {
//        if (!box) {
//          res.status(404);
//          res.end();
//        } else {
//          res.json({
//            server: api.config.mongo.host,
//            port: api.config.mongo.port,
//            username: 'readUser',
//            password: box.accessPassword
//          });
//        }
//      });
//    },
    listBoxUsers: function (req, res) {
      var api = req.api;

      var boxName = req.params.boxName;
      api.users.listBoxUsers(boxName, function (err, users) {
        var boxUsers = {};

        for (var i = 0; i < users.length; i++) {
          if (users[i].roles) boxUsers[users[i].alias] = users[i].roles[boxName];
        }

        res.json(boxUsers);
      });
    },
    saveBoxInfo: function (req, res) {
      var api = req.api;

      api.boxes.saveInfo(req.params.boxName, req.body, function (err) {
        res.status(200);
        res.end();
      });
    },
    createBox: function (req, res) {
      var api = req.api;

      api.boxes.createBox(req.params.boxName, req.session.user.alias, function (err) {
        res.status(200);
        res.end();
      });
    },
    createCollection: function (req, res) {
      var api = req.api;

      api.collections.createCollection(req.params.boxName, req.body.name, function (err) {
        res.status(err ? 418 : 200);
        res.end();
      });
    },
    destroyCollection: function (req, res) {
      var api = req.api;

      api.collections.destroyCollection(req.params.boxName, req.params.collectionName, function (err) {
        res.status(err ? 418 : 200);
        res.end();
      });
    },
    setRemoteDb: function (req, res) {
      var api = req.api;

      api.remoteDbs.setForBox(req.params.boxName, req.body.name, req.body.url, function (err) {
        res.status(err ? 418 : 200);
        res.end();
      });
    },
    unsetRemoteDb: function (req, res) {
      var api = req.api;

      api.remoteDbs.setForBox(req.params.boxName, req.params.name, function (err) {
        res.status(err ? 418 : 200);
        res.end();
      });
    },
    listRemoteDbs: function (req, res) {
      var api = req.api;

      api.remoteDbs.listForBox(req.params.boxName, function (err, dbs) {
        if (err) {
          console.error(err);
          res.status(418);
          return res.end();
        }

        res.json(dbs);
      });
    },
    getUsageStatistics: function (req, res) {
      var api = req.api;

      var from = req.body.from, to = req.body.to, collection = req.body.collection;
      api.stats.getBoxUsage(req.params.boxName, from, to, collection, function (err, stats) {
        if (err) {
          console.error(err);
          res.status(418);
          return res.end();
        }

        res.json(stats);
      });
    },
    getErrorStatistics: function (req, res) {
      var api = req.api;

      var from = req.body.from, to = req.body.to;
      api.stats.getBoxErrors(req.params.boxName, from, to, function (err, stats) {
        if (err) {
          console.error(err);
          res.status(418);
          return res.end();
        }

        res.json(stats);
      });
    },
    exportBox: function (req, res) {
      var api = req.api;

      api.boxes.export(req.params.boxName, function (err, buffer) {
        if (err) {
          console.error(err);

          res.status(418);
          return res.end();
        }

        res.set('Content-Type', 'application/zip, application/octet-stream');
        res.set('Content-Disposition', 'attachment; filename=' + req.params.boxName + '.box');
        res.send(buffer);
        res.end();
      });
    },
    importBox: function (req, res) {
      var api = req.api;

      var form = new formidable.IncomingForm();

      form.parse(req, function (err, fields, files) {
        if (Object.keys(files).length !== 1) {
          console.error(new Error("Only one file expected"));

          res.status(418);
          return res.end();
        }

        var file = files[Object.keys(files)[0]];
        var bytes = fs.readFileSync(file.path);

        api.boxes.import(req.params.boxName, bytes, function (err) {
          if (err) {
            console.error(err);
            res.status(418);
            return res.end();
          }

          res.status(200);
          return res.end();
        });
      });
    }
  };
};
