'use strict';

angular.module('box')
.config(function ($routeProvider) {
  $routeProvider.when('/graphs', {
    templateUrl: 'views/partials/graphs.html'
  });
  $routeProvider.when('/graphs/:_id/edit', {
    templateUrl: 'views/partials/edit-graph.html',
    reloadOnSearch: false
  });
  $routeProvider.when('/graphs/new', {
    templateUrl: 'views/partials/new-graph.html'
  });
})
.controller('GraphsCtrl', function ($scope, boxName, LocalDataService, Workflows, appSocket, $location) {
  var refreshing;
  function refreshWorkflows() {
    if (!refreshing) {
      refreshing = Workflows.runningWorkflows()
      .then(function (workflows) {
        $scope.workflows = workflows;
        refreshing = null;
      }, function () {
        refreshing = null;
      });
    }
  };
  
  var outputListener, hideConsole = function () {
    if (outputListener) outputListener();
    
    $scope.showConsole = false;
    $scope.showingConsoleFor = null;
  };
  
  $scope.hideConsole = hideConsole;
  $scope.viewConsole = function (id, $event) {
    if ($event) $event.stopPropagation();
    hideConsole();
    Workflows.getOutput(id)
    .then(function (output) {
      $scope.showConsole = true;
      $scope.showingConsoleFor = id;
      $scope.output = output;
      outputListener = $scope.$on('workflow-output', function (event, outputWorkflowId, output) {
        $scope.output.push(output);
      });
    });
  };
  
  $scope.$watch('graphs', function (graphs) {
    angular.forEach(graphs, function (g) {
      graphs[g._id] = g;
    });
  });
  
  refreshWorkflows();
  appSocket.on("workflow-started", refreshWorkflows);
  appSocket.on("workflow-finished", refreshWorkflows);

  $scope.startWorkflow = function (graphId) {
    Workflows.startWorkflow(graphId, {});
  };

  $scope.copyGraph = function (graphId) {
    LocalDataService
    .getCollection('_graphs')
    .findOne({
      _id: graphId
    }).then(function (g) {
      delete g._id;
      LocalDataService
      .getCollection('_graphs')
      .insert(g);
    });
  };

  $scope.stopWorkflow = function (id) {
    Workflows.stopWorkflow(id);
  };

  $scope.editRunningWorkflow = function (graphId, workflowId) {
    $location.url('/graphs/' + graphId + '/edit?workflowId=' + workflowId);
  };

  $scope.deleteGraph = function (graphId) {
    Workflows.deleteGraph(graphId);
  };
})
.controller('NewGraphCtrl', function ($scope, boxName, LocalDataService, $location) {
  $scope.graph = {
    graph: {
      connectors: [],
      nodes: [],
      sheetSize: 'A4',
      pages: [{
        x: 1,
        y: 1
      }],
      totalPages: {
        x: 1,
        y: 1
      }
    },
    pages: {
      x: 1,
      y: 1
    },
    params: []
  };
  
  $scope.save = function () {
    var copy = angular.copy($scope.graph);
    
    angular.forEach(copy.graph.nodes, function (node) {
      delete node.inputConnectors;
      delete node.outputConnectors;
    });
    LocalDataService
    .getCollection('_graphs')
    .insert($scope.graph)
    .then(function (graph) {
      $location.url('/graphs/' + graph._id + '/edit');
    })
  };
});
