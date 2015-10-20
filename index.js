'use strict';

var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    app = express(),
    morgan = require('morgan'),
    config = require('./config');


function spdyServer(app) {
  var spdy = require('spdy');

  var options = {
    key: fs.readFileSync(path.resolve(__dirname, config.keys.key)),
    cert: fs.readFileSync(path.resolve(__dirname, config.keys.cert)),
    ca: fs.readFileSync(path.resolve(__dirname, config.keys.ca))
  };

  var server = spdy.createServer(options, app);

  return server;
}

function httpServer(app){
  // Start server
  return require('http').Server(app);
}

var server;

if (config.protocol == 'spdy') {
  server = spdyServer(app);
} else {
  server = httpServer(app);
}

var io = require('socket.io')(server);

var debugFns = {};

var debug = function (name) {
  if (!debugFns[name]) debugFns[name] = require('debug')(name);

  return debugFns[name];
}

require('./express-io')(app, io, debug, function (err) {
  app.use(morgan('dev'));

  server.listen(config.port, config.ip, function () {
    console.log('Express server listening on %s://%s:%d/', config.protocol == 'spdy' ? 'https' : 'http', config.ip, config.port);
  });
});
