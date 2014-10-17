module.exports = {
  "root": __dirname,
  "env": "development",
  "ip": "0.0.0.0",
  "port": 9000,
  "singleDbMode": true,
  "auth": {
    "origami-auth-local": {
      "mongo": {
        "database": "origami-dev",
        "host": "127.0.0.1",
        "port": 27017,
        "username": "admin",
        "password": "P@ssw0rd!",
        "collection": "local-users"
      }
    }
  },
  "protocol": "spdy",
  "prefix": "https://localhost:9000/",
  "mongo": {
    "database": "origami-dev",
    "host": "127.0.0.1",
    "port": 27017,
    "username": "admin",
    "password": "P@ssw0rd!"
  },
  "mongoSessions": {
    "db": "origami-dev",
    "host": "127.0.0.1",
    "port": 27017,
    "username": "admin",
    "password": "P@ssw0rd!"
  },
  "keys": {
    "key": "keys/server.key",
    "cert": "keys/server.crt",
    "ca": "keys/server.csr"
  },
  "defaultHomeTemplate": "<div class=\"section\">  <h1>Welcome home</h1>\n  <p>\n    <a href=\"#/e/home\">Edit me</a>\n  </p>\n</div>",
  "defaultSidebarTemplate": "<div>\n  <a class=\"list-group-item\"  ng-href=\"{{viewLink('home')}}\">Home<i class=\"fa fa-chevron-right pull-right\"></i></a>\n  <a class=\"list-group-item\" href=\"#/e/left-sidebar\">Edit me<i class=\"fa fa-chevron-right pull-right\"></i></a>\n</div>"
};
