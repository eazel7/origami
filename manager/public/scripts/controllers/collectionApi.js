'use strict';

angular.module('boxes3.manager')
.service("CollectionApi", function ($http, $q) {
  return {
    createCollection: function (boxName, collectionName) {
      var defer = $q.defer();
      
      $http.post('/api/box/' + boxName + '/createCollection', {
        name: collectionName
      })
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    getCollections: function (boxName) {
      var defer = $q.defer();
      
      $http.get('/' + boxName + '/api/collections')
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    remove: function (boxName, collectionName, object) {
      var defer = $q.defer();
      
      $http.post('/api/box/' + boxName + '/collection/' + collectionName + '/remove', object)
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    insert: function (boxName, collectionName, object) {
      var defer = $q.defer();
      
      $http.post('/api/box/' + boxName + '/collection/' + collectionName + '/insert', object)
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    update: function (boxName, collectionName, predicate, object) {
      var defer = $q.defer();
      
      $http.post('/api/box/' + boxName + '/collection/' + collectionName + '/update', {
        predicate: predicate,
        object: object
      })
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    count: function (boxName, collectionName, filter) {
      var defer = $q.defer();
      
      $http.post('/api/box/' + boxName + '/collection/' + collectionName + '/count', filter)
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    find: function (boxName, collectionName, filter) {
      var defer = $q.defer();
      
      $http.post('/api/box/' + boxName + '/collection/' + collectionName + '/find', filter)
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    }
  };
});
