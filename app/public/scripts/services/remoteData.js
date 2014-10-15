angular
.module("box.service.remoteData", ['ng', 'box.browserKey'])
.factory("RemoteCollection", function ($http, $q, BrowserKey) {
  return function (name) {
    return {
      find: function (predicate) {
        var defer = $q.defer();
        
        $http.post('api/collection/' + name + '/find', JSON.stringify(predicate || {}))
        .success(defer.resolve)
        .error(defer.reject);
        
        return defer.promise;
      },
      findOne: function (predicate) {
        var defer = $q.defer();
        
        $http.post('api/collection/' + name + '/findOne', JSON.stringify(predicate || {}))
        .success(defer.resolve)
        .error(defer.reject);
        
        return defer.promise;
      },
      update: function (predicate, replacement) {
        var defer = $q.defer();
        
        $http.post('api/collection/' + name + '/update', JSON.stringify({
          predicate: predicate,
          replacement: replacement
        }), {
          headers: {
            'Box.BrowserKey': BrowserKey()
          }
        })
        .success(defer.resolve)
        .error(defer.reject);
        
        return defer.promise;
      },
      remove: function (predicate) {
        var defer = $q.defer();
        
        $http.post('api/collection/' + name + '/remove', JSON.stringify(predicate), {
          headers: {
            'Box.BrowserKey': BrowserKey()
          }
        })
        .success(defer.resolve)
        .error(defer.reject);
        
        return defer.promise;
      },
      insert: function (object) {
        var defer = $q.defer();
        
        $http.post('api/collection/' + name + '/insert', JSON.stringify(object), {
          headers: {
            'Box.BrowserKey': BrowserKey()
          }
        })
        .success(defer.resolve)
        .error(defer.reject);
        
        return defer.promise;
      }
    };
  };
})
.service("RemoteDataService", function ($http, $q, RemoteCollection) {
  return {
    getCollections: function () {
      var defer = $q.defer();
      
      $http.get('api/collections')
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    getCollection: function (name) {
      return new RemoteCollection(name);
    }
  };
});
