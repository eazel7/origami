module.exports = function (api) {
  return {
    boxes: require('./boxes')(api),
    config: require('./config')(api),
    misc: require('./misc')(api),
    users: require('./users')(api),
    views: require('./views')(api),
    authentication: require('./authentication')(api),
    packages: require('./packages')(api),
    dataTransfer: require('./data-transfer')(api)
  };
}
