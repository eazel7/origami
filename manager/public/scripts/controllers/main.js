'use strict';

angular.module('boxes3.manager')
.controller('MainCtrl', function ($scope, $rootScope) {
  $rootScope.pageTitle = 'Boxes';
})
.config(function ($stateProvider) {
  $stateProvider.state('boxes', {
    url: '/boxes',
    templateUrl: 'views/partials/boxes.html',
    controller: function ($scope, BoxesApi) {
      BoxesApi.getAllBoxes().then(function (boxes) {
        $scope.boxes = boxes;;
      });
    }
  });
});
