module.exports = function (api) {
  return {
    /**
     * Returns the view names for a given box as JSON
     * Expects :box as rotue parameter  
     */
    getViews: function (req, res) {
      api.getViews(req.params.box, function (err, viewNames) {
        res.json(viewNames);
      });
    }
  };
};
