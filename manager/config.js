var config = require('./config-default');

config.root = __dirname;

override(dst, src) {
  for (var k in src) {
    dst[k] = src[k];
  }
}

if (process.env.OPENSHIFT_APP_NAME) {
  var newMongo = {
    database: process.env.OPENSHIFT_APPNAME,
    host: process.env.OPENSHIFT_MONGODB_DB_HOST,
    port: process.env.OPENSHIFT_MONGODB_DB_PORT,
    username: process.env.OPENSHIFT_MONGODB_DB_USERNAME,
    password: process.env.OPENSHIFT_MONGODB_DB_PASSWORD
  };

  override(config.auth['origami-auth-local'].mongo, newMongo);
  override(config.mongo, newMongo); 
  override(config.mongoSessions, newMongo);
  config.protocol = 'http';
  config.prefix = 'https://' + process.env.OPENSHIFT_APPNAME + '.rhcloud.com/';
  config.ip = process.env.OPENSHIFT_NODEJS_IP;
  config.port = process.env.OPENSHIFT_NODEJS_PORT;
}

module.exports = config;
