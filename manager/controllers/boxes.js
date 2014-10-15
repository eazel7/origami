module.exports = function (api) {
  return {
    listBoxes: function (req, res) {
      api.boxes.listBoxes(function (err, boxes) {
        var boxNames = [];
        for (var i = 0; i < boxes.length; i++) {
          boxNames.push(boxes[i].name);
        }

        res.json(boxNames);
      });
    },
    getActivePackagesWithDependencies: function (req, res) {
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
      api.boxes.getBox(req.params.boxName, function (err, box) {
        if (!box) {
          res.status(404);
          res.end();
        } else {
          res.json(box.info);
        }
      });
    },
    getBoxAccess: function (req, res) {
      api.boxes.getBox(req.params.boxName, function (err, box) {
        if (!box) {
          res.status(404);
          res.end();
        } else {
          res.json({
            server: api.config.mongo.host,
            port: api.config.mongo.port,
            username: 'readUser',
            password: box.accessPassword
          });
        }
      });
    },
    listBoxUsers: function (req, res) {
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
      api.boxes.saveInfo(req.params.boxName, req.body, function (err) {
        res.status(200);
        res.end();
      });
    },
    createBox: function (req, res) {
      api.boxes.createBox(req.params.boxName, req.session.user.alias, function (err) {
        res.status(200);
        res.end();
      });
    },
    createCollection: function (req, res) {
      api.collections.createCollection(req.params.boxName, req.body.name, function (err) {
        res.status(err ? 418 : 200);
        res.end();
      });
    }
  };
};
