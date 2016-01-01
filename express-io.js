/* eslint-disable semi */

var express = require('express');
var favicon = require('serve-favicon');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var path = require('path');
var config = require('./config');
var async = require('async');
var MongoStore = require('connect-mongo')(session);

/**
 * Express configuration
 */
module.exports = function (app, io, debugLog, callback) {
  var debug = debugLog('origami:express-io');

  debug('install compression');

  app.use(compression());

  if (config.forwardProto) {
    debug('configure x-forwarded-proto');

    app.use(function (req, res, next) {
      if (req.headers['x-forwarded-proto'] === 'http') {
        res.redirect('https://' + req.headers.host + req.path);
      } else {
        return next();
      }
    });
  }

  debug('install favicon');
  app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));

  var mmm = require('mmmagic');
  var magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE | mmm.MAGIC_MIME_ENCODING);

  debug('install mmmagic content-type handler');
  app.use(function (req, res, next) {
    var orig = res.send;

    res.send = function (body) {
      var self = this;
      var args = arguments;

      if (!res.get('Content-Type')) {
        magic.detect(new Buffer(body), function (err, result) {
          if (err) return next(err);
          res.set('Content-Type', result);

          orig.apply(self, args);
        });
      } else {
        orig.apply(this, arguments);
      }
    };
    next();
  });

  app.use(function (req, res, next) {
    var orig = res.end;

    res.end = function (body) {
      var self = this;
      var args = arguments;

      if (body && !res.get('Content-Type')) {
        magic.detect(new Buffer(body), function (err, result) {
          if (err) return next(err);
          res.set('Content-Type', result);

          orig.apply(self, args);
        });
      } else {
        orig.apply(this, arguments);
      }
    };
    next();
  });

  app.use(express.static(path.join(config.root, 'public')));
  app.set('views', path.join(config.root, 'public', 'views'));
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');

  var appCookieParser = cookieParser(config.expressSecret);
  app.use(appCookieParser) // required before session.

  require('./api')(config, function (err, api) {
    if (err) {
      console.error(err);

      app.use(express.static(path.join(config.root, 'dbOffline')));

      return;
    }

    var appSessionStore = new MongoStore(config.mongoSessions);
    app.use(session({
      resave: true,
      saveUninitialized: true,
      secret: config.expressSecret,
      store: appSessionStore,
      cookie: {
        maxAge: 3600000 * 24 * 14
      }
    }));
    app.use(bodyParser.json());

    app.use(methodOverride());

    function onAuthorizeSuccess (data, accept) {
      accept();
    }

    function onAuthorizeFail (data, message, error, accept) {
      if (error) {
        accept(new Error(message));
      }
    }

    function userSocketDisconnected (alias) {
      return function () {
        console.log('user socket disconnected', alias);
        api.eventBus.emit('user-socket-disconnected', alias);
      };
    }

    io.on('connection', function (socket) {
      var alias = socket.client.request.user.alias;

      console.log('user socket connected', alias);
      api.eventBus.emit('user-socket-connected', alias);

      socket.on('disconnect', userSocketDisconnected(alias));
    });

    require('./routes')(app, api);

    var passportSocketIo = require('./socketioauth');

    function AuthorizeIO () {
      var ppAuthorize = passportSocketIo.authorize({
        cookieParser: cookieParser,
        secret: config.expressSecret, // the session_secret to parse the cookie
        store: appSessionStore,       // we NEED to use a sessionstore. no memorystore please
        success: onAuthorizeSuccess,  // *optional* callback on success - read more below
        fail: onAuthorizeFail         // *optional* callback on fail/error - read more below
      });

      return function (data, accept) {
        require('passport').initialize();
        ppAuthorize(data, accept);
      }
    }

    io.use(new AuthorizeIO());

    api.eventBus.on('op', function (op) {
      io
      .of('/' + op.box)
      .emit('sync-lastDate', op.date);
    });

    api.eventBus.on('desktop-notification-box', function (boxName, message) {
      io
      .of('/' + boxName)
      .emit('desktop-notification', message);
    });

    api.eventBus.on('box-created', function (boxName) {
      debug('box-created: %s', boxName);

      io.of('/' + boxName);
    });

    api.eventBus.on('desktop-notification-user', function (boxName, user, message) {
      var ns = io.of('/' + boxName);

      for (var socket in ns.sockets) {
        if (ns.sockets[socket].client.request.user.alias === user) {
          ns.sockets[socket].emit('desktop-notification', message);
        }
      }
    });

    api.eventBus.on('workflow-started', function (boxName, workflowId) {
      debug('workflow-started: %s/%s', boxName, workflowId);

      io
      .of('/' + boxName)
      .emit('workflow-started', workflowId);
    });

    api.eventBus.on('workflow-finished', function (boxName, workflowId) {
      debug('workflow-finished: %s/%s', boxName, workflowId);

      io
      .of('/' + boxName)
      .emit('workflow-finished', workflowId);
    });

    api.eventBus.on('workflow-output', function (boxName, workflowId, output) {
      debug('workflow-output: %s/%s %s', boxName, workflowId, JSON.stringify(output));

      io
      .of('/' + boxName)
      .emit('workflow-output', workflowId, output);
    });

    api.eventBus.on('workflow-connection-on', function (boxName, workflowId, data) {
      debug('workflow-connection-on: %s/%s %s', boxName, workflowId, JSON.stringify(data));

      io
      .of('/' + boxName)
      .emit('workflow-connection-on', workflowId, data);
    });

    api.eventBus.on('workflow-connection-off', function (boxName, workflowId, data) {
      debug('workflow-connection-off: %s/%s %s', boxName, workflowId, JSON.stringify(data));

      io
      .of('/' + boxName)
      .emit('workflow-connection-off', workflowId, data);
    });

    api.schedules.ensureSchedules(function (err) {
      if (err) console.log(err);
    });

    api.boxes.listBoxes(function (err, boxes) {
      if (err) return callback(err);

      async.eachSeries(boxes, function (box, callback) {
        io.of('/' + box.name);

        callback();
      }, callback);
    });
  });
};
