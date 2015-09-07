var passport = require('passport'),
    LocalStrategy = require('passport-local'),
    hashing = require('password-hash'),
    path = require('path');

module.exports = function (api) {
  return {
    title: "Origami users",
    // url: "/auth/local",
    loginTemplate: "/views/local/login.html",
    signupTemplate: "/views/local/signup.html",
    install: function (app) {
      var express = require('express');

      app
      .use('/views/local', express.static(require('path').join(__dirname, 'views')));

      passport.use(new LocalStrategy(
        function(username, password, done) {
          var alias = username + '@local';
          api.users.getUserMetadata(alias, function (err, metadata) {
            if (err) return done(err);
            if (!metadata || !metadata.passwordHash) return done('User has no password');

            if (hashing.verify(password, metadata.passwordHash)) {
              done(null, { alias: alias, displayName: alias })
            } else {
              done('Invalid password');
            }
          });
        }
      ));

      app
      .route('/api/auth/local/login')
      .post(function (req, res, next) {
        passport.authenticate('local', {}, function (err, user) {
          if (err) {
            res.status(418);
            res.end();
          } else {
            req.session.user = user;
            res.status(200);
            res.end();
          }
        })(req, res, next);
      });

      app
      .route('/api/auth/local/signup')
      .post(function (req, res, next) {
        function error () {
          res.status(418);
          return res.end();
        }
        if (!req.body.username || !req.body.password || !req.body.email) {
          res.status(418);
          return res.end();
        } else {
          var alias = req.body.username + '@local';

          api.users.registerUser(alias, alias, function (err) {
            if (err) return error();

            api.users.getUserMetadata(alias, function (err, metadata) {
              if (err) return error();

              metadata = metadata || {};

              metadata.passwordHash = hashing.generate(req.body.password);

              api.users.setUserMetadata(alias, metadata, function (err) {
                if (err) return error();

                res.status(200);
                res.end();
              });
            })
          });
        }
      });
    }
  };
}
