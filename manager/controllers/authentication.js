var passport = require('passport');

module.exports = function (api) {
  return {
    isAllowed: function (req, callback) {
      if ((!req.session || !req.session.user || !req.session.user.alias) && (!req.headers || !req.headers.apikey)) {
        return callback (null, false);
      } else if (req.headers && req.headers.apikey) {
        api.boxes.getBox(req.params.boxName, function (err, box) {
          callback (null, req.headers.apikey == box.apiKey);
        });
      } else {
        api.settings.get("master-user", function (masterUser) {
          if (masterUser == req.session.user.alias) return callback(null, true);

          api.boxes.getBox(req.params.boxName, function (err, box) {
            if (box && box.owner == req.session.user.alias) return callback(null, true);

            api.users.getUserRole(req.session.user.alias, req.params.boxName, function (err, role) {
              callback(err, role !== undefined);
            });
          });
        });
      }
    },
    isAdmin: function (req, callback) {
      if (!req.user || !req.user.alias) return callback (null, false);
      api.settings.get("master-user", function (masterUser) {
        if (masterUser == req.user.alias) return callback(null, true);

        api.boxes.getBox(req.params.box, function (err, box) {
          if (box && box.owner == req.user.alias) return callback(null, true);

          api.users.getUserRole(req.user.alias, boxName, function (err, role) {
            callback(err, role === 'admin');
          });
        });
      });
    },
    install: function (app) {
      var config = api.config;

      passport.serializeUser(function(user, done) {
        done(null, user);
      });

      passport.deserializeUser(function(user, done) {
        done(null, user);
      });

      app.use(passport.initialize());
      app.use(passport.session());

      app
      .route('/api/identity')
      .get(function (req, res) {
        if (req.session.user) {
          return res.json(req.session.user);
        } else {
          res.status(418);
          return res.end();
        }
      });

      var authMethods = [];
      
      for (var method in api.config.auth) {
        var auth = require(method)(api);
        authMethods.push(auth);

        auth.install(app);
      }

      app
      .route('/api/authMethods')
      .get(function (req, res) {
        var json = [];

        authMethods.forEach(function (m) {
          json.push({
            title: m.title,
            loginTemplate: m.loginTemplate,
            signupTemplate: m.signupTemplate,
            url: m.url
          });
        });

        res.json(json);
      });

      app
      .route('/login')
      .get(function (req, res) {
        res.render('login-chooser.html');
      });
    }
  };
};
