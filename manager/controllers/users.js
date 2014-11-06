module.exports = function () {
  return {
    listUsers: function (req, res) {
      var api = req.api;
      
      api.users.listUsers(function (err, users) {
        res.json(users);
      });
    },
    getUser: function (req, res) {
      var api = req.api;
      
      api.users.getUser(req.params.userAlias, function (err, user) {
        if (user) {
          res.json(user);
        } else {
          res.status(404);
          res.end();
        }
      });
    },
    getMyRoles: function (req, res) {
      var api = req.api;
      
      api.users.getUser(req.session.user.alias, function (err, user) {
        if (user) {
          res.json(user.roles);
        } else {
          res.status(404);
          res.end();
        }
      });
    },
    getMyBoxes: function (req, res) {
      var api = req.api;
      
      api.users.getAllowedBoxes(req.session.user.alias, function (err, boxes) {
        if (boxes) {
          res.json(boxes);
        } else {
          res.status(404);
          res.end();
        }
      });
    },
    setRole: function (req, res) {
     var api = req.api;
      
     if (req.body && req.body.role) {
        api.users.enableUser(req.params.userAlias, req.params.boxName, req.body.role, function (err) {
          res.status(200);
          res.end();
        });
      } else {
        api.users.disableUser(req.params.userAlias, req.params.boxName, function (err) {
          res.status(200);
          res.end();
        });
      }
    }
  };
}
