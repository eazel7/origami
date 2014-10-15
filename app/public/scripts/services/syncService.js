angular
.module("box.service.sync", ['ng', "box.service.remoteData", "box.service.localData", "box.browserKey", "box.info", "appSocket"])
.value("SyncLockDuration", 5000)
.service("SyncService", function (boxName, $rootScope, RemoteDataService, LocalDataService, $window, SyncLockDuration, $timeout, $q, LocalCollection, RemoteCollection, $http, BrowserKey, LocalStorage, appSocket) {
  var syncQueue = new LocalCollection('_syncQueue'),
      running = false,
      syncing = false,
      windowId = "window_" + Date.now(),
      collectionsToSync = [],
      updateSyncLock = function () {
        if (LocalStorage[boxName + '_syncLock']) {
          syncLock = JSON.parse(LocalStorage[boxName + '_syncLock']);
        } else {
          syncLock = undefined;
        }
        
        return syncLock;
      },
      getLastSyncDate = function () {
        return LocalStorage[boxName + '_lastSyncDate'] ? Number(LocalStorage[boxName + '_lastSyncDate']) : 0;
      },
      lock = function () {
        if (syncLock && 
            syncLock.windowId !== windowId &&
            syncLock.expiresAt > Date.now()) {
            // owned by another window, cannot lock
            
            return false;
        }
      
        LocalStorage[boxName + '_syncLock'] = JSON.stringify({
          ownerWindowId: windowId,
          expiresAt: Date.now() + 5000
        });
        
        return true;
      },
      unlock = function () {
        delete LocalStorage[boxName + '_syncLock'];
        
        updateSyncLock();
        
        return true;
      },
      performSync = function () {
        var defer = $q.defer();
        
        $http.get('api/collections')
        .success(function (collectionsToSync) {
          syncQueue.find({
            collection: {
              $in: collectionsToSync
            }
          })
          .then(function (queued) {
            queued.sort(function (a, b) {
              return a.date - b.date;
            });

            var processNext = function () {
              if (queued.length === 0) {
                // no more queued local actions, get the ones from the server
                var lastSyncDate = getLastSyncDate();
                
                $http.get('api/queuedSyncOperations/' + lastSyncDate.toString())
                .error(defer.reject)
                .success(function (opsToExecute) {
                  // execute them in order
                
                  opsToExecute.sort(function (a, b) {
                    return a.date - b.date;
                  });
                  
                  var removeRemoteOp = function (op) {
                    LocalStorage[boxName + '_lastSyncDate'] = op.date;
                  };
                
                  var processNextRemote = function () {
                    if (opsToExecute.length === 0) return defer.resolve();
                    
                    var remoteOp = opsToExecute.shift(),
                        local = new LocalCollection(remoteOp.collection);

                    if (remoteOp.browserKey === BrowserKey()) {
                      LocalStorage[boxName + '_lastSyncDate'] = remoteOp.date;
                      return processNextRemote();
                    }
                    
                    switch(remoteOp.op) {
                      case 'remove':
                        local.remove(JSON.parse(remoteOp.predicate), true)
                        .then(function () {
                          LocalStorage[boxName + '_lastSyncDate'] = remoteOp.date;
                        }, defer.reject)
                        .then(processNextRemote, defer.reject);
                      break;
                      case 'insert':
                        local.insert(JSON.parse(remoteOp.object), true)
                        .then(function () {
                          LocalStorage[boxName + '_lastSyncDate'] = remoteOp.date;
                        }, defer.reject)
                        .then(processNextRemote, defer.reject);
                      break;
                      case 'update':
                        local.update(JSON.parse(remoteOp.predicate), JSON.parse(remoteOp.replacement), true)
                        .then(function () {
                         LocalStorage[boxName + '_lastSyncDate'] = remoteOp.date;
                        }, defer.reject)
                        .then(processNextRemote, defer.reject);
                      break;
                    }
                  }
                
                  return processNextRemote();
                });
                
                return;
              }
              
              var op = queued.shift(),
                  removeOp = function () {
                    syncQueue.remove(op);
                  },
                  remote = new RemoteCollection(op.collection);
              
              switch(op.operation) {
                case 'remove':
                  remote.remove(JSON.parse(op.predicate))
                  .then(removeOp, defer.reject)
                  .then(processNext, defer.reject);
                break;
                case 'insert':
                  remote.insert(JSON.parse(op.object))
                  .then(removeOp, defer.reject)
                  .then(processNext, defer.reject);
                break;
                case 'update':
                  remote.update(JSON.parse(op.predicate), JSON.parse(op.replacement))
                  .then(removeOp, defer.reject)
                  .then(processNext, defer.reject);
                break;
              }
            }
            
            return processNext();
          }, function () {
            defer.reject();
          });
        })
        .error(defer.reject);
        
        
        return defer.promise;
      };
      
  $window.addEventListener('storage', function (storageEvent) {
    if (storageEvent.key === boxName + '_syncLock') {
      updateSyncLock();
    }
  });
  updateSyncLock();
  
  var socketListener, localDataListeners = [];

  var self = {
    isRunning: function () {
      return running;
    },
    isSyncing: function () {
      return syncing;
    },
    reset: function () {
      var wasRunning = self.isRunning(),
          defer = $q.defer();
      
      self.stop();
      
      LocalDataService
      .resetData()
      .then(function () {
        delete LocalStorage[boxName + '_lastSyncDate'];

        syncQueue
        .remove({})
        .then(function () {
          if (wasRunning) self.start();
          
          defer.resolve();
        });
      });
      
      return defer.promise;
    },
    start: function () {
      if (running) return;
      
      running = true;
      
      function syncCycle (){
        if (!syncing && lock()) {
          syncing = true;
          
          performSync()
          .then(function () {
            syncing = false;
            unlock();
          }, function () {
            syncing = false;
            console.log('sync failed');
            unlock(); 
          });
        }
      }
      
      syncCycle();
      
      socketListener = appSocket.on('sync-lastDate', function (syncDate) {
        if (syncDate > getLastSyncDate()) {
          syncCycle();
        }
      });
      
      localDataListeners.push($rootScope.$on('collection-operation-insert', syncCycle));
      localDataListeners.push($rootScope.$on('collection-operation-update', syncCycle));
      localDataListeners.push($rootScope.$on('collection-operation-remove', syncCycle));
    },
    stop: function () {
      running = false;
      
      appSocket.removeListener(socketListener);
      socketListener = null;
    }
  };
  
  return self;
})
.run(function ($rootScope, SyncService, LocalCollection, boxName) {
  var syncQueue = new LocalCollection('_syncQueue');
  
  $rootScope.$on('collection-operation-remove', function (event, collection, predicate) {
    if (collection !== '_syncQueue') {
      syncQueue.insert({
        collection: collection,
        operation: 'remove',
        date: Date.now(),
        predicate: JSON.stringify(predicate, undefined, 2)
      }, true);
    }
  });
  
  $rootScope.$on('collection-operation-insert', function (event, collection, object) {
    if (collection !== '_syncQueue') {
      syncQueue.insert({
        collection: collection,
        operation: 'insert',
        date: Date.now(),
        object: JSON.stringify(object, undefined, 2)
      }, true);
    }
  });
  
  $rootScope.$on('collection-operation-update', function (event, collection, predicate, replacement) {
    if (collection !== '_syncQueue') {
      syncQueue.insert({
        collection: collection,
        operation: 'update',
        date: Date.now(),
        predicate: JSON.stringify(predicate, undefined, 2),
        replacement: JSON.stringify(replacement, undefined, 2)
      }, true);
    }
  });
})
.run(function (SyncService, $rootScope, LocalStorage, $window, boxName) {
  function checkStorageConfig() {
    if (!LocalStorage[boxName + '_syncService'] || !JSON.parse(LocalStorage[boxName + '_syncService']).doNotStart) {
      // no config -> start
      // config.doNotStart -> do not start
      SyncService.start();
    } else if (SyncService.isRunning()) {
      SyncService.stop();
    }
  }

  $window.addEventListener('storage', checkStorageConfig);
  checkStorageConfig();

  $rootScope.isSyncing = function () {
    return SyncService.isSyncing();
  };
  
  $rootScope.syncIsRunning = function () {
    return SyncService.isRunning();
  };
});
