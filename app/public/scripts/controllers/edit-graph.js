'use strict';

angular.module('box')
.controller("GraphParamsCtrl", function ($scope) {
  $scope.addParam = function () {
    if (!$scope.graph) return;
    if (!$scope.graph.params) $scope.graph.params = [];
    $scope.graph.params.push({type:"string", name: ""});
  };
  $scope.removeParam = function (p,$event) {
    if ($event) $event.stopPropagation();
    $scope.graph.params.splice($scope.graph.params.indexOf(p), 1);
  }
})
.controller('EditGraphCtrl', function ($scope, $http, boxName, LocalDataService, $routeParams, Workflows, RemoteDataService, $sce, appSocket, ToggleHelper, $timeout, $location, $interval, makeid) {
  angular.element('body').removeClass('has-sidebar-left');

  $scope.$on('show-console', function () {
    $scope.outputVisible = true;
  });  
  $scope.$on('hide-console', function () {
    $scope.outputVisible = false;
  });  
  
  $scope.$on('$destroy', $scope.$root.$on('mobile-angular-ui.toggle.toggled', function (event, id, state) {
    if (id == 'rightSidebar' && state === false) {
      $scope.sidebarFor = null;
      $scope.$apply();
    }
  }));
  
  $scope.showHistory = function ($event) {
    if ($event) $event.stopPropagation();
    $scope.sidebarFor = 'graph-history';
    $scope.toggle('rightSidebar', 'on');
    $scope.$root.$broadcast('show-graph-history', $routeParams.graphId);
  };
  
  $scope.toggleOutput = function (visible, $event) {
    if ($event) $event.stopPropagation();
    if ($scope.runningWorkflowId && (visible === true || (visible === undefined && !$scope.outputVisible))) {
      $scope.$broadcast('show-workflow-output', $scope.runningWorkflowId);
    } else if (visible === false || (visible === undefined && $scope.outputVisible)) {
      $scope.$broadcast('hide-console');
    }
  };
  $scope.routeParams = $routeParams;
  $scope.runningWorkflowId = $location.search().workflowId;
  
  if ($scope.runningWorkflowId) {
    Workflows.getActiveConnections($scope.runningWorkflowId)
    .then(function (active) {
      $scope.activeConnections = active;
      Workflows.getOutput($scope.runningWorkflowId)
      .then(function (output) {
        $scope.output = output;
      });
    }, function () {
      $location.search({});
      $scope.runningWorkflowId = null;
    })
  }
    
  function updatePages (x,y){
    var pages = [];
    
    for (var i = 1; i <= x; i++) {
      for (var j = 1; j <= y; j++) {
        pages.push({
          x: i,
          y: j
        });
      }
    }
    
    if ($scope.chartViewModel) {
      $scope.chartViewModel.data.pages = pages;
      $scope.chartViewModel.data.totalPages = {x : x, y: y };
    }
  }
  
  $scope.activeConnections = [];
  $scope.isActiveConnection = function (id) {
    return $scope.activeConnections.indexOf(id) !== -1;
  };
  
  appSocket.on('workflow-connection-on', function (workflowId, connectionId) {
    if ($scope.runningWorkflowId == workflowId && $scope.activeConnections.indexOf(connectionId) == -1) {
       $scope.activeConnections.push(connectionId);
    }
  });
  
  appSocket.on('workflow-connection-off', function (workflowId, connectionId) {
    if ($scope.runningWorkflowId == workflowId && $scope.activeConnections.indexOf(connectionId) != -1) {
       $scope.activeConnections.splice($scope.activeConnections.indexOf(connectionId), 1);
    }
  });
    
  $scope.$watch('graph.pages.x', function (x) {
    if (!x) x = 1;
    
    var y = $scope.$eval('graph.pages.y');
    if (!y) y = 1;
    
    updatePages(x,y);
  });
  
  $scope.$watch('graph.pages.y', function (y) {
    if (!y) y = 1;
    
    var x = $scope.$eval('graph.pages.x');
    if (!x) x = 1;
    
    updatePages(x,y);
  });
  $scope.stopWorkflow = function ($event) {
    if ($event) $event.stopPropagation();
    Workflows.stopWorkflow($scope.runningWorkflowId)
    .then(function () {
      $location.search({});
      $scope.runningWorkflowId = null;
      $scope.activeConnections = [];
    }, function () {
      $location.search({});
      $scope.runningWorkflowId = null;
      $scope.activeConnections = [];
    });
  };

  $scope.startWorkflow = function ($event) {
    if ($event) $event.stopPropagation();
    $scope.output = [];
    Workflows.startWorkflow($routeParams._id, {})
    .then(function (workflowId) {
      $scope.runningWorkflowId = workflowId;
      $scope.toggleOutput(true);
      
      Workflows.getActiveConnections(workflowId)
      .then(function(active) {
        $scope.activeConnections = active;
        console.log(active);
      });
      $location.search({
        workflowId: workflowId
      });
    });
  };
  
  $scope.$on('workflow-finished', function (event, finishedWorkflowId) {
    if ($scope.runningWorkflowId == finishedWorkflowId) {
      $scope.runningWorkflowId = null;
      $scope.activeConnections = [];
      $location.search({});
    }
  });
  
  $scope.enableNode = function ($event) {
    if ($event) $event.stopPropagation();
    delete $scope.chartViewModel.getSelectedNodes()[0].data.disabled;
  };
  
  $scope.disableNode = function ($event) {
    if ($event) $event.stopPropagation();
    $scope.chartViewModel.getSelectedNodes()[0].data.disabled = true;
  };
  
  $scope.isSelectedNodeEnabled = function () {
    return !$scope.chartViewModel.getSelectedNodes()[0].data.disabled;
  };
  $scope.isSelectedNodeDisabled = function () {
    return $scope.chartViewModel.getSelectedNodes()[0].data.disabled;
  };

  $scope.save = function ($event) {
    if ($event) $event.stopPropagation();
    $scope.graph.graph = $scope.chartViewModel.data;

    LocalDataService
    .getCollection('_graphs')
    .update({
      _id: $scope.graph._id
    }, $scope.graph);
  };

  $scope.showEdit = function ($event) {
    if ($event) $event.stopPropagation();
    $scope.sidebarFor = 'editComponent';
    $scope.toggle('rightSidebar', 'on');
  };

  $scope.addNode = function ($event) {
    if ($event) $event.stopPropagation();
    $scope.sidebarFor = 'addNode';
    $scope.toggle('rightSidebar', 'on');
  }

  //
  // Code for the delete key.
  //
  var deleteKeyCode = 46;

  //
  // Code for control key.
  //
  var ctrlKeyCode = 65;

  //
  // Set to true when the ctrl key is down.
  //
  var ctrlDown = false;

  //
  // Code for A key.
  //
  var aKeyCode = 17;

  //
  // Code for esc key.
  //
  var escKeyCode = 27;

  //
  // Selects the next node id.
  //
  var nextNodeID = 10;

  //
  // Setup the data-model for the chart.
  //
  //
  // Event handler for key-down on the flowchart.
  //
  $scope.keyDown = function (evt) {

    if (evt.keyCode === ctrlKeyCode) {

      ctrlDown = true;
      evt.stopPropagation();
      evt.preventDefault();
    }
  };

  //
  // Event handler for key-up on the flowchart.
  //
  $scope.keyUp = function (evt) {

    if (evt.keyCode === deleteKeyCode) {
      //
      // Delete key.
      //
      $scope.chartViewModel.deleteSelected();
    }

    if (evt.keyCode == aKeyCode && ctrlDown) {
      //
      // Ctrl + A
      //
      $scope.chartViewModel.selectAll();
    }

    if (evt.keyCode == escKeyCode) {
      // Escape.
      $scope.chartViewModel.deselectAll();
    }

    if (evt.keyCode === ctrlKeyCode) {
      ctrlDown = false;

      evt.stopPropagation();
      evt.preventDefault();
    }
  };

  $scope.addComponent = function (component) {
    var node = angular.copy(component.defaultModel);
    
    node.x = $("svg").parent().scrollLeft();
    node.y = $("svg").parent().scrollTop();

    node.id = makeid();
    $scope.chartViewModel.addNode(node);
    $scope.toggle('rightSidebar', 'off');
  };

  $scope.configure = function ($event) {
    if ($event) $event.stopPropagation();
    
    $scope.sidebarFor = 'configure';
    $scope.toggle('rightSidebar', 'on');
  };

  $scope.newParam = {};

  $scope.addParameter = function () {
    $scope.graph.params.push({
      name: $scope.newParam.name,
      default: ""
    });
    $scope.newParam = {};
  };

  $scope.deleteSelected = function () {
    $scope.chartViewModel.deleteSelected();
  };

  $scope.editComponent = function ($event) {
    if ($event) $event.stopPropagation();
    
    $scope.editingComponent = $scope.chartViewModel.getSelectedNodes()[0];
    $scope.sidebarFor = "editComponent";
    $scope.toggle('rightSidebar', 'on');
  }

  $http.get('api/graphs/componentGallery')
  .success(function (gallery) {
    $scope.componentGallery = gallery;
    for (var i = 0; i < gallery.length; i++) {
      gallery[gallery[i].defaultModel.kind] = gallery[i];
      
      for (var j = 0; j < gallery[i].defaultModel.inputConnectors.length; j++) {
        if (gallery[i].defaultModel.inputConnectors[j].configTemplate) $sce.trustAsHtml(gallery[i].defaultModel.inputConnectors[j].configTemplate);
      }
    }

    $scope.$watch('graph', function (g) {
      if (g) {
        angular.forEach(g.graph.nodes, function (node) {
          var mapInitials = {};
          
          angular.forEach(node.inputConnectors, function (ic) {
            mapInitials[ic.id] = ic.initial;
          });
        
          node.inputConnectors = angular.copy(gallery[node.kind].defaultModel.inputConnectors);
          
          angular.forEach(node.inputConnectors, function (ic) {
            ic.initial = mapInitials[ic.id];
          });
          
          node.outputConnectors = angular.copy(gallery[node.kind].defaultModel.outputConnectors);
        });
        
        angular.forEach(g.graph.connections, function (conn) {
          if (!conn.metadata) conn.metadata = {};
          if (!conn.metadata.id) conn.metadata.id = makeid();
        });
        $scope.chartViewModel = new flowchart.ChartViewModel(g.graph);
      }
    });
  });
})

.controller("WorkflowOutputCtrl", function ($scope, Workflows) {
  $scope.workflowId = null;
  
  $scope.$on('workflow-output', function (event, workflowId, outputLine) {
    if (workflowId == $scope.workflowId) {
      $scope.output.push(outputLine);
    }
  });
  
  $scope.$on('show-workflow-output', function (event, workflowId) {
    $scope.$emit('show-console');
    $scope.output = [];
    Workflows.getOutput(workflowId)
    .then (function (output) {
      $scope.workflowId = workflowId;
      
      $scope.output.push.apply($scope.output, output);
    });
  });
})

.controller('CustomComponentsCtrl', function ($scope, LocalDataService) {
  LocalDataService
  .getCollection("_graphs")
  .find({
//    component: true
  })
  .then(function (custom) {
    $scope.customComponents = [];
    
    angular.forEach(custom, function (graph) {
      $scope.customComponents.push({
        displayName: graph.name,
        icon: 'cog'
      });
    });
  });
});
