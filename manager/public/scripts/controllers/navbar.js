'use strict';

angular.module('boxes3.manager')
.controller('ManageBoxSelectorCtrl', function ($scope, BoxesApi, $state) {
  BoxesApi
  .getAllBoxes()
  .then(function (boxes) {
    $scope.boxes = boxes;
  })
  $scope.$watch('selectedBox', function (b) {
    if (b) {
      $state.go('^.manageBox', { boxName: b });
    }
    
    $scope.selectedBox = undefined;
  })
});
