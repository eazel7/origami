'use strict';

angular.module('box')
.controller('GraphPastRunsCtrl', function ($scope, Workflows, $routeParams) {
  $scope.graphId = $routeParams._id;
  
  $scope.$watch('graphId', function (graphId) {
    if (!graphId) return $scope.pastRuns = [];
    
    Workflows.getGraphHistory($scope.graphId)
    .then(function (pastRuns) {
      $scope.pastRuns = pastRuns;
    });
  });
  
  $scope.$on('workflow-finished', function (event) {
    if (!$scope.graphId) return;
    
    Workflows.getGraphHistory($scope.graphId)
    .then(function (pastRuns) {
      $scope.pastRuns = pastRuns;
    });
  });
  
  $scope.$on('show-graph-history', function (event, graphId) {
    $scope.graphId = graphId;
  });
});
