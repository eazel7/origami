'use strict';

var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    app = express(),
    morgan = require('morgan');

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var config = require('./config');

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
  
var accessLogStream = fs.createWriteStream('web.log', {flags: 'a'});

var apache_log = require('apache-log');

app.use(function (req, res, next) {
  apache_log.logger(req, res);
  next(); 
});

server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %s://%s:%d, in %s mode', config.protocol == 'spdy' ? 'https' : 'http', config.ip, config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;
