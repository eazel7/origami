angular.module("boxes3.manager")
.config(function ($stateProvider) {
  $stateProvider.state('data-transfer', {
    url: '/data-transfer',
    templateUrl: 'views/partials/data-transfer.html'
  });
})
.controller("DataTransfer", function ($scope, $q, CollectionApi, ViewsApi, BoxesApi, WorkflowsApi) {
  BoxesApi.getMyBoxes()
  .then(function (boxes) {
    $scope.boxes = boxes;
  });

  var initialConfig = {
    collections: [],
    selectedCollections: [],
    views: [],
    selectedViews: [],
    workflows: [],
    selectedWorkflows: [],
    configuration: {
      copyPackages: false,
      copyRemoteDbs: false,
      copyUserList: false
    }
  };
  
  angular.extend($scope, initialConfig);

  var isCollectionSelected = $scope.isCollectionSelected = function(c) {
    return $scope.selectedCollections.indexOf(c) > -1;
  };
  
  $scope.toggleCollectionSelected = function (c) {
    if (isCollectionSelected(c)) {
      $scope.selectedCollections.splice($scope.selectedCollections.indexOf(c), 1);
    } else {
      $scope.selectedCollections.push(c);
    }
  }

  var isViewSelected = $scope.isViewSelected = function(c) {
    return $scope.selectedViews.indexOf(c) > -1;
  };
  
  $scope.toggleViewSelected = function (c) {
    if (isViewSelected(c)) {
      $scope.selectedViews.splice($scope.selectedViews.indexOf(c), 1);
    } else {
      $scope.selectedViews.push(c);
    }
  };

  var isWorkflowSelected = $scope.isWorkflowSelected = function(c) {
    return $scope.selectedWorkflows.indexOf(c._id) > -1;
  };
  
  $scope.toggleWorkflowSelected = function (c) {
    if (isWorkflowSelected(c)) {
      $scope.selectedWorkflows.splice($scope.selectedWorkflows.indexOf(c._id), 1);
    } else {
      $scope.selectedWorkflows.push(c._id);
    }
  };
  
  $scope.selectAllCollections = function () {
    $scope.selectedCollections = angular.copy($scope.collections);
  };
  
  $scope.selectAllViews = function () {
    $scope.selectedViews = angular.copy($scope.views);
  };
  
  $scope.selectAllWorkflows = function () {
    angular.forEach($scope.workflows, function (w){
      if ($scope.selectedWorkflows.indexOf(w._id) === -1) $scope.selectedWorkflows.push(w._id);
    });
  };
      
  var preparePlan = function() {
    var actions = [];
    var source = $scope.source, target = $scope.target, selectedCollections =  $scope.selectedCollections, selectedViews = $scope.selectedViews;
    
    angular.forEach(selectedCollections, function (c) {
      actions.push({
        'message': 'Find all documents in collection ' + c + ' from ',
        'action': 'find-documents',
        'collection': c,
        'source': source,
        'target': target
      },{
        'message': 'Insert or update each document from ' + source + ' ' + c + ' in target',
        'action': 'upsert-collection',
        'collection': c,
        'source': source,
        'target': target
      },{
        'message': 'Remove documents in ' + source + ' ' + c + ' which did\'t exist in ' + source,
        'action': 'upsert-collection',
        'collection': c,
        'source': source,
        'target': target
      },{
        'message': 'Empty collection ' + c + ' in target',
        'action': 'empty-collection',
        'collection': c,
        'source': source,
        'target': target
      });
    });
    
    angular.forEach(selectedViews, function (v) {
      actions.push({
        'message': 'Insert or update the view ' + v + ' from ' + source + ' into ' + target,
        'action': 'upsert-view',
        'source': source,
        'target': target
      });
    });
    
    if ($scope.configuration.copyUserList) {
      actions.push({
        'message': 'Copy user list from ' + source + ' to ' + target,
        'action': 'copy-users',
        'source': source,
        'target': target
      });
    }
    
    if ($scope.configuration.copyPermissionGroups) {
      actions.push({
        'message': 'Copy permission groups from ' + source + ' to ' + target,
        'action': 'copy-permission-groups',
        'source': source,
        'target': target
      });
    }
    if ($scope.configuration.copyRemoteDbs) {
      actions.push({
        'message': 'Copy remote DBs from ' + source + ' to ' + target,
        'action': 'copy-remote-dbs',
        'source': source,
        'target': target
      });
    }
    
    if ($scope.configuration.copyPackages) {
      actions.push({
        'message': 'Copy packages from ' + source + ' to ' + target,
        'action': 'copy-packages',
        'source': source,
        'target': target
      });
    }
    
    return actions;
  };
  
  $scope.canTransfer = function () {
    return ($scope.source && $scope.target && $scope.source !== $scope.target && ($scope.selectedCollections.length || $scope.selectedViews.length || $scope.selectedWorkflows.length || $scope.configuration.copyUserList || $scope.configuration.copyPackages || $scope.configuration.copyRemoteDbs || $scope.configuration.copyPermissionGroups));
  };
  
  $scope.togglePlan = function () {
    if ($scope.plan) {
      $scope.plan = undefined;
    } else {
      $scope.plan = preparePlan();
    }
  };
  
  $scope.$watch("source", function (s) {
    angular.extend($scope, angular.copy(initialConfig));
    if (s) {
      loading: true
      
      $q.all([
        CollectionApi
        .getCollections(s)
        .then(function (collections) {
          var available = [];
          for (var i = collections.length - 1; i >= 0; i--) {
            if (collections[i][0] !== '_') {
              // this is a system collection
              available.push(collections[i])
            }
          }
          $scope.collections = available;
        }),
        ViewsApi
        .listViews(s)
        .then(function (views) {
          $scope.views = views;
        }),
        WorkflowsApi
        .listGraphs(s)
        .then(function (workflows) {
          $scope.workflows = workflows;
        })
      ])
      .then(function () {
        $scope.loading = false;
      });
    }
  });
});
