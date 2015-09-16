'use strict';

angular.module('boxes3.manager')
.controller("LoginCtrl", function ($scope, $http, $location, $state, $stateParams, $rootScope) {
  $http.get("/api/masterUser")
  .success(function (data) {
    if (!data) {
      $scope.noMasterUser = true;
    }
  });
  $http.get('/api/authmethods')
  .success(function (data) {
    $scope.methods = data;
  });

  $scope.$on('login-succeded', function () {
    $state.go($stateParams.backTo.name, $stateParams.backTo.params, { reload: true });
  });

  $scope.loginWith = function (method) {
    if(method.loginTemplate) {
      $scope.loginForm = method.loginTemplate;
    } else {
      $location.url(method.url)
    }
  }
});
