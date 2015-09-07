angular.module("nw-http-decorator", ["ng"])
.config(function ($provide) {
  $provide.factory('nwHttpInterceptor', function(boxName) {
    var r = new RegExp('^(?:[a-z]+:)?//', 'i');

    return {
      'request': function(config) {
        if (!r.test(config.url)) {
          config.url = "http://localhost:9000/" + (config.url.indexOf("/") == 0 ? "" : "/safe-affect/") + config.url;
        }
    
        return config;
      }
    };
});
