'use strict';

angular.module('boxes3.manager')
.service("BoxesApi", function ($http, $q) {
  return {
    getAllBoxes: function () {
      var defer = $q.defer();

      $http.get('/api/boxes')
           .success(defer.resolve)
           .error(defer.reject);

      return defer.promise;
    },
    randomName: function () {
      var defer = $q.defer();

      $http.get('/api/randomName')
           .success(defer.resolve)
           .error(defer.reject);

      return defer.promise;
    },
    unusedBoxName: function (boxName) {
      var defer = $q.defer();

      if (boxName) {
        $http.get('/api/isNameFree/'+ boxName)
            .success(defer.resolve)
            .error(defer.reject);
      } else {
        defer.reject();
      }

      return defer.promise;
    },
    createBox: function (box) {
      var defer = $q.defer();

      $http.post('/api/createBox/' + box.name, box)
          .success(defer.resolve)
          .error(defer.reject);

      return defer.promise;
    },
    listBoxUsers: function (boxName) {
      var defer = $q.defer();
      
      $http.get('/api/box/' + boxName + '/users')
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    getBoxInfo: function (boxName) {
      var defer = $q.defer();
      
      $http.get('/api/box/'+ boxName + '/info')
           .success(defer.resolve)
           .error(defer.reject);
      
      return defer.promise;
    },
    getBoxLogs: function (boxName) {
      var defer = $q.defer();
      
      $http.get('/api/box/' + boxName + '/logs')
           .success(defer.resolve)
           .error(defer.reject);
      
      return defer.promise;
    },
    listRemoteDbs: function (boxName) {
      var defer = $q.defer();
      
      $http.get('/api/box/' + boxName + '/remoteDbs')
           .success(defer.resolve)
           .error(defer.reject);
      
      return defer.promise;
    },
    setRemoteDb: function (boxName, dbName, url) {
      var defer = $q.defer();
      
      $http.post('/api/box/' + boxName + '/remoteDbs', { name: dbName, url: url })
           .success(defer.resolve)
           .error(defer.reject);
      
      return defer.promise;
    },
    unsetRemoteDb: function (boxName, dbName, url) {
      var defer = $q.defer();
      
      $http.post('/api/box/' + boxName + '/remoteDbs/' + dbName)
           .success(defer.resolve)
           .error(defer.reject);
      
      return defer.promise;
    },
    saveBoxInfo: function (name, info) {
      var defer = $q.defer();
      
      $http.post('/api/box/' + name + '/info', info)
           .success(defer.resolve)
           .error(defer.reject);
      
      return defer.promise;
    }
  };
});
