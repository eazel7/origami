'use strict';

angular.module('boxes3.manager')
.config(function ($stateProvider) {
  $stateProvider.state('newBox', {
    url: '/new-box',
    templateUrl: 'views/partials/newBox.html',
    controller: ["$scope", "BoxesApi", "$state", function ($scope, BoxesApi, $state) {
      if (!$scope.identity) {
        return $state.go('^.requireLogin');
      }

      $scope.$watch('box.name', function (boxName) {
        BoxesApi.unusedBoxName(boxName)
        .then(function () {
          $scope.boxNameTaken = false;
        }, function () {
          $scope.boxNameTaken = true;
        });
      });
      $scope.box = {
        plan: 'beta'
      };
      $scope.newName = function () {
        BoxesApi.randomName().then(function (name) {
          angular.extend($scope, {
            box: {
              name: name,
              plan: $scope.$eval('box.plan')
            }
          });
        });
      };
      $scope.newName();
      $scope.createBox = function (box) {
        BoxesApi.createBox(box)
        .then(function () {
          $state.go('^.manageBox', { boxName: box.name });
        }, function () {
          $scope.error = 'We ran out of coffee, can\'t create it right now';
        });
      };
    }]
  });
});
