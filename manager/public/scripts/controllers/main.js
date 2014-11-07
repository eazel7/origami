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
    controller: function ($scope, $window) {
      $scope.clearStorage = function () {
      
      };
    }
  });
});
