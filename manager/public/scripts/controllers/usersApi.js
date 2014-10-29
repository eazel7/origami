'use strict';

angular.module('boxes3.usersapi', [])
.service("UsersApi", function ($http, $q) {
  return {
    getAllUsers: function () {
      var defer = $q.defer();
      
      $http.get('/api/users')
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    getUser: function (alias) {
      var defer = $q.defer();
      
      $http.get('/api/users/' + alias)
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    getMyRoles: function () {
      var defer = $q.defer();
      
      $http.get('/api/my-roles')
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    enableUser: function (boxName, userAlias, role) {
      var defer = $q.defer();
      
      $http
      .post('/api/box/' + boxName + '/users/' + userAlias, {
        role: role || 'user'
      })
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    getBoxUsers: function (boxName) {
      var defer = $q.defer();
      
      $http.get('/api/box/' + boxName + '/users')
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    }
  }
});
