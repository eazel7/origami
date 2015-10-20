'use strict';

angular.module('boxes3.manager')
.controller('MainCtrl', function ($scope, $rootScope) {
  $rootScope.pageTitle = 'Boxes';
})
.config(function ($stateProvider) {
  $stateProvider.state('home', {
    url: '/',
    templateUrl: 'views/partials/home.html',
    controller: function ($scope, BoxesApi, UsersApi) {
      BoxesApi.getMyBoxes().then(function (boxes) {
        $scope.boxes = boxes;
      });
      UsersApi.getMyRoles().then(function (roles) {
        $scope.roles = roles;
      });
    }
  });
  $stateProvider.state('devs', {
    url: '/devs',
    templateUrl: 'views/partials/devs.html',
    controller: function ($scope, $window, $http) {
      $scope.clearTempData = function () {
        for (var k in $window.localStorage) {
          delete $window.localStorage[k];
        }

        if ($window.indexedDB.webkitGetDatabaseNames) {
          $window.indexedDB.webkitGetDatabaseNames().onsuccess = function(sender,args) {
            for (var i = sender.target.result.length - 1; i >= 0; i--) {
              $window.indexedDB.deleteDatabase(sender.target.result[i]);
            }
          };
        }
      };

      $scope.rebuildManifests = function () {
        $http.post('/api/rebuild-manifests', {});
      };
    }
  });
});
