angular.module("boxes3.manager")
.config(function ($stateProvider) {
  $stateProvider.state('data-transfer', {
    url: '/data-transfer',
    templateUrl: 'views/partials/data-transfer.html',
    resolve: {
    },
    controller: function ($scope, BoxesApi, CollectionApi) {
      BoxesApi.getAllBoxes().then(function (boxes) {
        $scope.boxes = boxes;
      });
      
      $scope.isSelected = function (c) {
        return $scope.selectedCollections.indexOf(c) > -1;
      };
      
      $scope.toggleSelected = function (c) {
        if ($scope.isSelected(c)) $scope.selectedCollections.splice($scope.selectedCollections.indexOf(c), 1);
        else $scope.selectedCollections.push(c);
      };
      
      $scope.$watch("from", function (box) {
        $scope.selectedCollections = [];
      
        if (!box) { $scope.sourceCollections = []; return; };
        
        CollectionApi.getCollections(box).then(function (cols) {
          $scope.sourceCollections = cols;
        });
      });
      
      $scope.$watch("target", function (box) {
        if (!box) { $scope.sourceCollections = []; return; };
        CollectionApi.getCollections(box).then(function (cols) {
          $scope.targetCollections = cols;
        });
      });
      
      $scope.canTransfer = function () {
        return $scope.from && $scope.target && $scope.from != $scope.target && $scope.selectedCollections.length > 0;
      };
      
      $scope.transfer = function () {
        CollectionApi.transfer($scope.from, $scope.target, $scope.selectedCollections)
        .then(function () {      
          $scope.busy = false;
        }, function () {
          $scope.busy = false;
        });
        
        $scope.busy = true;
      };
    }
  });
});

