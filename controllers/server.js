module.exports = function () {
  return {
    importGithub: function (req, res) {
      var api = req.api;

      api.packages.importGithub(function (err) {
        if (err) {
          console.error(err);
          res.status(418);
        } else {
          res.status(200);
        }

        res.end();
      })
    }
  }
};
