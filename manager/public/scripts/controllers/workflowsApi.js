'use strict';

angular.module('boxes3.manager')
.service("WorkflowsApi", function ($http, $q) {
  return {
    listGraphs: function (boxName) {
      var defer = $q.defer();
      
      $http.get("/api/box/" + encodeURIComponent(boxName) + "/graphs")
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    }
  };
});
