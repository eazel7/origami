'use strict';

angular.module('boxes3.manager')
.service("ServerApi", function ($http, $q) {
  return {
    importGithub: function () {
      var p = $q.defer();

      $http.post('/api/server/import-github', {}).success(p.resolve).error(p.reject);

      return p.promise;
    }
  };
});
