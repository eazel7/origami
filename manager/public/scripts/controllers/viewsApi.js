'use strict';

angular.module('boxes3.manager')
.service("ViewsApi", function ($http, $q) {
  return {
    listViews: function (boxName) {
      var defer = $q.defer();
      
      $http.get("/api/box/" + encodeURIComponent(boxName) + "/views")
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    }
  };
});
