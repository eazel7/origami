'use strict';

angular.module('boxes3.manager')
.service("CollectionApi", function ($http, $q) {
  return {
    transfer: function (from, target, collections) {
      var defer = $q.defer();
      
      $http.post('/api/data-transfer', {from: from, target: target, collections: collections})
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
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
      
      $http.get('/api/box-api/' + boxName + '/collections')
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    destroyCollection: function (boxName, collectionName) {
      var defer = $q.defer();
      
      $http.post('/api/box-api/' + boxName + '/destroy-collection/' + collectionName, {})
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    remove: function (boxName, collectionName, object) {
      var defer = $q.defer();
      
      $http.post('/api/box-api/' + boxName + '/collection/' + collectionName + '/remove', object)
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    insert: function (boxName, collectionName, object) {
      var defer = $q.defer();
      
      $http.post('/api/box-api/' + boxName + '/collection/' + collectionName + '/insert', object)
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    update: function (boxName, collectionName, predicate, object) {
      var defer = $q.defer();
      
      $http.post('/api/box-api/' + boxName + '/collection/' + collectionName + '/update', {
        predicate: predicate,
        object: object
      })
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    count: function (boxName, collectionName, filter) {
      var defer = $q.defer();
      
      $http.post('/api/box-api/' + boxName + '/collection/' + collectionName + '/count', filter)
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    },
    find: function (boxName, collectionName, filter) {
      var defer = $q.defer();
      
      $http.post('/api/box-api/' + boxName + '/collection/' + collectionName + '/find', filter)
      .success(defer.resolve)
      .error(defer.reject);
      
      return defer.promise;
    }
  };
});
