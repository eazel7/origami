var passport = require('passport'),
    LocalStrategy = require('passport-local'),
    hashing = require('password-hash'),
    path = require('path');

module.exports = function (api) {
  return {
    title: "Usuario @buenosaires.gob.ar",
    // url: "/auth/local",
    loginTemplate: "/views/buenosaires/login.html",
    install: function (app) {
      var express = require('express');

      app
      .use('/views/buenosaires', express.static(require('path').join(__dirname, 'views')));

      var strategy = new LocalStrategy(function(username, password, done) {
      
        var alias = username + '@buenosaires.gob.ar',
            urlWsdl = api.config.auth["origami-auth-buenosaires"].url,
            soap = require('soap');
        
        var args = {
            email: alias,
            clave: password
        };
        
        soap.createClient(urlWsdl, function(err, client) {
          if (err) return callback (err);

          client.validar(args, function(err, result) {
            if (err) return done (err);
            
            console.log(result);
            if (result["return"] == 1) {
              done(null, { alias: alias, displayName: alias })
            }
            else {
              done('Falló');
            }
          });
        });
      });
      
      strategy.name = 'ba';
      
      passport.use(strategy);

      app
      .route('/api/auth/buenosaires/login')
      .post(function (req, res, next) {
        passport.authenticate('ba', {}, function (err, user) {
        console.log(err);
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
    }
  };
}
