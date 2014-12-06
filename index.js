'use strict';

var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    app = express(),
    morgan = require('morgan'),
    config = require('./config');


// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

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

require('./express-io')(app, io);

app.use(morgan('dev'));

server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %s://%s:%d, in %s mode', config.protocol == 'spdy' ? 'https' : 'http', config.ip, config.port, app.get('env'));
  console.log('Browse to ' + config.prefix);
});

// Expose app
exports = module.exports = app;
