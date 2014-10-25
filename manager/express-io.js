'use strict';

var expressSecret = 'thisIsAnObviousSecret',
    express = require('express'),
    favicon = require('static-favicon'),
    morgan = require('morgan'),
    compression = require('compression'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    errorHandler = require('errorhandler'),
    path = require('path'),
    config = require('./config'),
    MongoStore = require('connect-mongo')(session);

/**
 * Express configuration
 */
module.exports = function(app, io) {
  var env = app.get('env');
  app.use(compression());
  app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
  app.use(express.static(path.join(config.root, 'public')));
  app.set('views', path.join(config.root, 'public', 'views'));
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');
  app.use(morgan('dev'));
  
  var appCookieParser = cookieParser(expressSecret);
  app.use(appCookieParser) // required before session.
  
  var appSessionStore = new MongoStore(config.mongoSessions);
  app.use(session({
    secret: expressSecret,
    store: appSessionStore,
    cookie: {maxAge: 3600000*24*14}
  }));
  app.use(bodyParser());

  app.use(methodOverride());

  // Error handler - has to be last
  if ('development' === app.get('env')) {
    app.use(errorHandler());
  }
  
  function onAuthorizeSuccess(data, accept){
    // The accept-callback still allows us to decide whether to
    // accept the connection or not.
    accept(null, true);

    // OR

    // If you use socket.io@1.X the callback looks different
    accept();
  }

  function onAuthorizeFail(data, message, error, accept){
    if(error)
      throw new Error(message);

    // We use this callback to log all of our failed connections.
    accept(null, false);

    // OR

    // If you use socket.io@1.X the callback looks different
    // If you don't want to accept the connection
    if(error)
      accept(new Error(message));
    // this error will be sent to the user as a special error-package
    // see: http://socket.io/docs/client-api/#socket > error-object
  }
  
  require('origami-api-mongo')(config, function (err, api) {
    if (err) {
      app.use(function (req, res) {
        res.status(500);
        res.send('General application error: \n' + err)
        return res.end();
      });

      return;
    }
    require('./routes')(app, api);

    var passportSocketIo = require("./socketioauth");
    
    io.use(passportSocketIo.authorize({
      cookieParser: cookieParser,
      secret:      expressSecret,    // the session_secret to parse the cookie
      store:       appSessionStore,        // we NEED to use a sessionstore. no memorystore please
      success:     onAuthorizeSuccess,  // *optional* callback on success - read more below
      fail:        onAuthorizeFail,     // *optional* callback on fail/error - read more below
    }));
    
    api.eventBus.on('op', function (op) {
      io
      .of('/' + op.box)
      .emit('sync-lastDate', op.date);
    });
    
    api.eventBus.on('desktop-notification', function (boxName, message) {
      io
      .of('/' + boxName)
      .emit('desktop-notification', message);
    });
    
    api.eventBus.on('workflow-started', function (boxName, workflowId) {
      io
      .of('/' + boxName)
      .emit('workflow-started', workflowId);
    });
    
    api.eventBus.on('workflow-finished', function (boxName, workflowId) {
      io
      .of('/' + boxName)
      .emit('workflow-finished', workflowId);
    });
    
    api.eventBus.on('workflow-output', function (boxName, workflowId, output) {
      io
      .of('/' + boxName)
      .emit('workflow-output', workflowId, output);
    });
    
    api.eventBus.on('workflow-connection-on', function (boxName, workflowId, connectionId) {
      io
      .of('/' + boxName)
      .emit('workflow-connection-on', workflowId, connectionId);
    });
    
    api.eventBus.on('workflow-connection-off', function (boxName, workflowId, connectionId) {
      io
      .of('/' + boxName)
      .emit('workflow-connection-off', workflowId, connectionId);
    });
  });
};
