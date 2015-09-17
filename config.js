var config = require('./config-default');

config.root = __dirname;

function override (dst, src) {
  for (var k in src) {
    dst[k] = src[k];
  }
}

if (process.env.OPENSHIFT_APP_NAME) {
  var newMongo = {
    database: process.env.OPENSHIFT_APP_NAME,
    host: process.env.OPENSHIFT_MONGODB_DB_HOST,
    port: process.env.OPENSHIFT_MONGODB_DB_PORT,
    username: process.env.OPENSHIFT_MONGODB_DB_USERNAME,
    password: process.env.OPENSHIFT_MONGODB_DB_PASSWORD
  };

  override(config.auth['../auth-local'].mongo, newMongo);
  override(config.mongo, newMongo);
  override(config.mongoSessions, newMongo);

  config.mongoSessions.db = config.mongoSessions.database;
  delete config.mongoSessions.database;

  config.protocol = 'http';
  config.prefix = 'https://' + process.env.OPENSHIFT_APP_DNS + '/';
  config.ip = process.env.OPENSHIFT_NODEJS_IP;
  config.port = process.env.OPENSHIFT_NODEJS_PORT;
  config.forwardProto = true;
}

module.exports = config;
