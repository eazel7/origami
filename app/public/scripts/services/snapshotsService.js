angular
.module("box.snapshots", ["box.service.localData", "box.info"])
.service("SnapshotsService", function (boxName, LocalStorage, $rootScope) {
  return {
    listSnapshots: function () {
      var snapshots = [];
    
      for (var k in LocalStorage) {
        if (k.indexOf("snapshot_") === 0) {
          snapshots.push({
            name: k.slice("snapshot_".length)
          });
        }
      }
      
      return snapshots;
    },
    renameSnapshot: function (oldName, newName) {
      LocalStorage['snapshot_' + newName] = LocalStorage['snapshot_' + oldName];
      delete LocalStorage['snapshot_' + oldName];
    },
    deleteSnapshot: function (name) {
      delete LocalStorage['snapshot_' + name];
    },
    createSnapshot: function (name) {
      var key = "snapshot_" + (name || String(Date.now())),
      snapshot = {
        date: Date.now(),
        values: {}
      };
      
      for (var k in LocalStorage) {
        if (k.indexOf('collection_' + boxName + '_') === 0) {
          snapshot.values[k] = LocalStorage[k];
        }
        snapshot.values['lastSyncDate'] = LocalStorage['lastSyncDate'];
      }
      
      LocalStorage[key] = JSON.stringify(snapshot);
    },
    restoreSnapshot: function (name) {
      var key = "snapshot_" + name;
      
      if (!LocalStorage[key]) return;
      
      var snapshot = JSON.parse(LocalStorage[key]);
      
      delete LocalStorage['lastSyncDate'];
      for (var k in snapshot.values) {
        LocalStorage[k] = snapshot.values[k];
      }
      
      for (var k in LocalStorage) {
        if (k.indexOf('collection_' + boxName + '_') === 0 && !snapshot.values[k]) {
          delete LocalStorage[k];
        }
      }
      
      $rootScope.$broadcast("snapshot-restored");
    }
  };
});
