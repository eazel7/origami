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
      
      $scope.isCollectionSelected = function (c) {
        return $scope.selectedCollections.indexOf(c) > -1;
      };
      
      $scope.toggleCollectionSelected = function (c) {
        if ($scope.isViewSelected(c)) $scope.selectedCollections.splice($scope.selectedCollections.indexOf(c), 1);
        else $scope.selectedCollections.push(c);
      };
      
      $scope.isViewSelected = function (v) {
        return $scope.selectedViews.indexOf(v._id) > -1;
      };
      
      $scope.toggleViewSelected = function (c) {
        if ($scope.isViewSelected(c)) $scope.selectedViews.splice($scope.selectedViews.indexOf(c), 1);
        else $scope.selectedViews.push(c);
      };
      
      $scope.$watch("from", function (box) {
        $scope.selectedCollections = [];
        $scope.selectedViews = [];
      
        if (!box) { $scope.sourceCollections = []; return; };
        
        CollectionApi.getCollections(box).then(function (cols) {
          $scope.sourceCollections = cols;
        });
        CollectionApi.find(box, "_views", {})
        .then(function (views) {
          $scope.sourceViews = views;
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
})
.controller("DataTransferCollection", function ($scope, CollectionApi) {
  $scope.$watch("from", function (b) {
    if (!b) $scope.sourceCount = '?'
    else CollectionApi.count(b, $scope.c, {}).then(function (c) {
      $scope.sourceCount = c;
    });
  });
  $scope.$watch("target", function (b) {
    if (!b) $scope.targetCount = '?'
    else CollectionApi.count(b, $scope.c, {}).then(function (c) {
      $scope.targetCount = c;
    });
  });
});

