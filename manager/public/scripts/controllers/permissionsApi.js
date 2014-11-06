'use strict';

angular.module('boxes3.permissions', [])
.service("PermissionsApi", function ($http, $q) {
  return {
    listPermissionGroups: function (boxName) {
      var defer = $q.defer();
      
      $http.get('/api/box/' + encodeURIComponent(boxName) + '/permissionGroup')
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    createPermissionGroup: function (boxName, groupName) {
      var defer = $q.defer();
      
      $http.post('/api/box/' + encodeURIComponent(boxName) + '/permissionGroup', {name: groupName})
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    describePermissionGroup: function (boxName, groupId) {
      var defer = $q.defer();
      
      $http.get('/api/box/' + encodeURIComponent(boxName) + '/permissionGroup/' + encodeURIComponent(groupId))
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    deletePermissionGroup: function (boxName, groupId) {
      var defer = $q.defer();
      
      $http.delete('/api/box/' + encodeURIComponent(boxName) + '/permissionGroup/' + encodeURIComponent(groupId))
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    modifyPermissionGroup: function (boxName, groupId, newPermissions) {
      var defer = $q.defer();
      
      $http.put('/api/box/' + encodeURIComponent(boxName) + '/permissionGroup/' + encodeURIComponent(groupId), newPermissions)
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    addUserToGroup: function (boxName, groupId, alias) {
      var defer = $q.defer();
      
      $http.post('/api/box/' + encodeURIComponent(boxName) + '/permissionGroup/' + encodeURIComponent(groupId) + '/users/' + encodeURIComponent(alias))
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    removeUserFromGroup: function (boxName, groupId, alias) {
      var defer = $q.defer();
      
      $http.delete('/api/box/' + encodeURIComponent(boxName) + '/permissionGroup/' + encodeURIComponent(groupId) + '/users/' + encodeURIComponent(alias))
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    listUsersInGroup: function (boxName, groupId, alias) {
      var defer = $q.defer();
      
      $http.get('/api/box/' + encodeURIComponent(boxName) + '/permissionGroup/' + encodeURIComponent(groupId) + '/users')
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    getEffectivePermissions: function (boxName, alias) {
      var defer = $q.defer();
      
      $http.get('/api/box/' + encodeURIComponent(boxName) + '/users/' + encodeURIComponent(alias))
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    }
  }
});
