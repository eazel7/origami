module.exports = function (config) {
  return {
    boxes: require('./boxes')(),
    config: require('./config')(config),
    misc: require('./misc')(),
    users: require('./users')(),
    views: require('./views')(),
    permissions: require('./permissions')(),
    workflows: require('./workflows')(),
    authentication: require('./authentication')(),
    packages: require('./packages')(),
    dataTransfer: require('./data-transfer')()
  };
}
