angular
.module("box.service.workflows", ['ng', 'appSocket'])
.service("Workflows", function ($http, $q, boxName, appSocket, $rootScope) {
  appSocket.on('workflow-finished', function (workflowId) {
    $rootScope.$broadcast('workflow-finished', workflowId);
  });
  appSocket.on('workflow-output', function (workflowId, output) {
    $rootScope.$broadcast('workflow-output', workflowId, output);
  });

  return {
    getActiveConnections: function(workflowId) {
      var defer = $q.defer();
      
      $http.get('api/workflows/' + workflowId + '/activeConnections')
      .success(defer.resolve)
      .error(defer.reject);
      
      
      return defer.promise;
    },
    getGraphHistory: function(graphId) {
      var defer = $q.defer();
      
      $http.get('api/graphs/' + graphId + '/history')
      .success(defer.resolve)
      .error(defer.reject);
      
      
      return defer.promise;
    },
    startWorkflow: function (graphId, params, outputFn) {
      var defer = $q.defer();

      $http.post('api/graphs/' + graphId + '/start', params)
      .success(function (result) {
        defer.resolve(JSON.parse(result));
      })
      .error(defer.reject);

      return defer.promise;
    },
    getOutput: function (id) {
      var defer = $q.defer();

      $http.get('api/workflows/' + id + '/output')
      .success(defer.resolve)
      .error(defer.reject);

      return defer.promise;
    },
    stopWorkflow: function (id) {
      var defer = $q.defer();

      $http.post('api/workflows/' + id + '/stop', {})
      .success(defer.resolve)
      .error(defer.reject);

      return defer.promise;
    },
    deleteGraph: function (graphId, params) {
      var defer = $q.defer();

      $http.post('api/graphs/' + graphId + '/delete', params)
      .success(defer.resolve)
      .error(defer.reject);

      return defer.promise;
    },
    runningWorkflows: function () {
      var defer = $q.defer();

      $http.get('api/workflows')
      .success(defer.resolve)
      .error(defer.reject);

      return defer.promise;
    }
  };
})
.run(function ($rootScope, Workflows) {
  $rootScope.startWorkflow = Workflows.startWorkflow;
});
