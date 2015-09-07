function onFailFor(res) {
  return function () {
    res.status(405);
    res.end();
  }
}

module.exports = function wrap(contextProvider, res, api) {
  return api.wrapper(contextProvider, onFailFor(res));
}

