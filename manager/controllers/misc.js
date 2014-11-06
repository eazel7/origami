module.exports = function () {
  return {
    index: function (req, res) {
      res.render('index');
    },
    masterUser: function (req, res) {
      var api = req.api;
      
      api.settings.get("master-user", function (value) {
        res.json(value);
      });
    },
    randomName: function (req, res) {
      var randomName = require('origami-random-names')();
      return res.end(randomName);
    }
  };
}
