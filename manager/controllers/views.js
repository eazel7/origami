module.exports = function () {
  return {
    /**
     * Returns the view names for a given box as JSON
     * Expects :box as rotue parameter  
     */
    getViews: function (req, res) {
      var api = req.api;
      
      api.views.listViews(req.params.boxName, function (err, viewNames) {
        if (err) {
          console.log(err);
          res.status(418);
          return res.end();
        }
        res.json(viewNames);
      });
    }
  };
};
