module.exports = function () {
  return {
    infoScript: function(req, res) {
      var api = req.api;
      
      var script = 'angular.module(\'box.manager.configInfo\', [])\n' +
                 '.value(\'configInfo\', ' + JSON.stringify({
                  prefix: api.config.prefix
                 }) +  ');';
   
      res.setHeader('Content-Type', 'application/javascript');
      return res.end(script);
    }
  };
}
