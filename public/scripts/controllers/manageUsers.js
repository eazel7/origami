'use strict';

angular.module('boxes3.manager')
.controller("UsersCtrl", function ($scope, UsersApi) {
  UsersApi.getAllUsers()
  .then(function (users) {
    $scope.users = users;
  });
});

