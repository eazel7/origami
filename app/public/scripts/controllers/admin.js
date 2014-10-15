'use strict';

angular.module('box')
.config(function ($routeProvider) {
  $routeProvider.when('/admin', {
    templateUrl: 'views/partials/admin.html'
  });
})
.controller('AdminCtrl', function ($scope, boxName, SyncService, LocalStorage, LocalDataService, SnapshotsService, ViewsService) {
  $scope.collections = LocalDataService.getCollections();
  $scope.snapshots = SnapshotsService.listSnapshots();
  
  $scope.reset = function () {
    SyncService.reset()
    .then(function () {
      $scope.collections = LocalDataService.getCollections();
    });
  };
  
  $scope.createSnapshot = function () {
    SnapshotsService.createSnapshot();
    $scope.snapshots = SnapshotsService.listSnapshots();
  };
  
  $scope.deleteSnapshot = function (s) {
    SnapshotsService.deleteSnapshot(s.name);
    $scope.snapshots = SnapshotsService.listSnapshots();
  };
  
  $scope.restoreSnapshot = function (s) {
    SnapshotsService.restoreSnapshot(s.name);
  };
  
  $scope.config =  {
    synchronization: SyncService.isRunning(),
    programmerMode: LocalStorage[boxName + '_programmerMode'] === 'true'
  };
  
  $scope.$watch('config.synchronization', function (val) {
    if (!val) {
      SyncService.stop();
      LocalStorage[boxName + '_syncService'] = "{\"doNotStart\": true}";
    } else {
      SyncService.start();
      delete LocalStorage[boxName + '_syncService'];
    }
  });
  
  $scope.$watch('config.programmerMode', function (val) {
    if (val) LocalStorage[boxName + '_programmerMode'] = true;
    else delete LocalStorage[boxName + '_programmerMode'];
  });
});
