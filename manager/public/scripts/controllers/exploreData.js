'use strict';

angular.module('boxes3.manager')
.controller("AppendCollectionObjectCtrl", function ($stateParams, $scope, CollectionApi) {
  $scope.newObject = {};
  $scope.insert = function () {
    CollectionApi.insert($stateParams.boxName, $stateParams.collectionName, $scope.newObject)
    .then(function () {
      $scope.newObject = {};
    })
  };
})
.config(function ($stateProvider) {
  $stateProvider.state('exploreData', {
    url: '/:boxName/explore-data/:collectionName',
    templateUrl: 'views/partials/exploreData.html'
  });
})
.controller("ExploreDataCtrl", function ($scope, CollectionApi, $stateParams) {
  $scope.find = {
    filter: {},
    results: []
  };
  $scope.refresh = function () {
    CollectionApi.find($stateParams.boxName, $stateParams.collectionName, $scope.find.filter || {})
    .then(function (results) {
      $scope.find.results = results;
    });
  };
  $scope.select = function (o) {
    if (o) {
      $scope.selectedObject = angular.copy(o);
    } else {
      $scope.selectedObject = o;
    }
    $scope.tab = {
      details: o !== undefined
    };
  };
})
.controller("ObjectDetailsCtrl", function ($scope, CollectionApi, $stateParams) {
  $scope.remove = function (o) {
    CollectionApi.remove($stateParams.boxName, $stateParams.collectionName, {
      _id: o._id
    })
    .then(function () {
      $scope.select();
      $scope.refresh();
    });
  };
  $scope.save = function (o) {
    CollectionApi.update($stateParams.boxName, $stateParams.collectionName, {
      _id: o._id
    }, o)
    .then(function () {
      $scope.select();
      $scope.refresh();
    });
  };
})
.controller("CollectionResultsCtrl", function ($scope, CollectionApi, $stateParams) {
  $scope.$watch('find.filter', function(filter) {
    $scope.refresh();
  });
  $scope.$watch('find.results', function (results) {
    var allKeys = ['_id'];
    angular.forEach(results, function (r) {
      angular.forEach(r, function (value, key) {
        if (allKeys.indexOf(key) === -1) {
          allKeys.push(key);
        }
      });
    });
    $scope.find.allKeys = allKeys;
  });
});
