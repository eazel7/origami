angular
.module("box.service.localData", ['ng', 'box.info'])
.factory('Nedb', function (){
  return window.Nedb;
})
.factory("LocalCollection", function (Nedb, boxName, $q, $window, $rootScope) {
  var collections = {};
  
  function cleanupHashkeys(original) {
    var n = angular.copy(original);
    
    if (angular.isArray(n) || angular.isObject(n)) {
      angular.forEach(n, function(v, k) {
        if (k === '$$hashKey') {
          delete n[k];
        } else {
          n[k] = cleanupHashkeys(v);
        }
      });
    }
    
    return n;
  }
  
  return function (name) {
    if (!collections[name]) {
      var nedb = new Nedb({filename: "collection_" + boxName + '_' + name, autoload: true});
      
      var BindedStorageEvent = function (db, collectionName) {
        return function (event) {
          if (event.key == 'collection_' + boxName + '_' + collectionName) {
            // this collection has been updated in another window
            
            db.loadDatabase();
            $rootScope.$broadcast('collection-changed', collectionName);
          }
        };
      };
      
      $rootScope.$on("snapshot-restored", function () {
        nedb.loadDatabase();
      })
      
      $window.addEventListener('storage', new BindedStorageEvent(nedb, name));
      
      collections[name] = {
        find: function (predicate, sort) {
          predicate = cleanupHashkeys(predicate);
          
          var defer = $q.defer();
          
          var cursor = nedb.find(predicate);
          
          if (sort) cursor.sort(sort);
          
          cursor.exec(function (err, docs) {
            if (err) defer.reject(err);
            else defer.resolve(docs);
          })
          
          return defer.promise;
        },
        findOne: function (predicate) {
          var defer = $q.defer();
          
          nedb.findOne(predicate, function (err, doc) {
            if (err) defer.reject(err);
            else defer.resolve(doc);
          })
          
          return defer.promise;
        },
        insert: function (object, silent) {
          object = cleanupHashkeys(object);
          
          var defer = $q.defer();
          
          nedb.insert(object, function (err, newDoc) {
            if (err) return defer.reject(err);
            
            defer.resolve(newDoc);
            $rootScope.$broadcast('collection-changed', name);
            
            if (!silent) $rootScope.$broadcast('collection-operation-insert', name, object);
          })
          
          return defer.promise;
        },
        update: function (predicate, replacement, silent) {
          predicate = cleanupHashkeys(predicate);
          replacement = cleanupHashkeys(replacement);
        
          var defer = $q.defer();
          
          nedb.update(predicate, replacement, function (err) {
            if (err) return defer.reject(err);
            
            defer.resolve();
            $rootScope.$broadcast('collection-changed', name);
            
            if (!silent) $rootScope.$broadcast('collection-operation-update', name, predicate, replacement);
          })
          
          return defer.promise;
        },
        remove: function (predicate, silent) {
          predicate = cleanupHashkeys(predicate);
          
          var defer = $q.defer();
          
          nedb.remove(predicate, { multi: true }, function (err) {
            if (err) return defer.reject(err);
            
            defer.resolve();
            $rootScope.$broadcast('collection-changed', name);
            
            if (!silent) $rootScope.$broadcast('collection-operation-remove', name, predicate);
          })
          
          return defer.promise;
        }
      };
    }
    
    return collections[name];
  };
})
.service("LocalDataService", function (boxName, $http, $q, LocalStorage, LocalCollection, $window) {
  var self = {
    getCollection: function (name) {
      return new LocalCollection(name);
    },
    resetData: function () {
      var defer = $q.defer();
      
      var collections = self.getCollections();
      
      angular.forEach(collections, function (c) {
        self.getCollection(c.name).remove({}).then(function () {
          collections.splice(collections.indexOf(c), 1);
          delete LocalStorage['collection_' + boxName + '_' + c.name];
          
          if (collections.length === 0) {
            defer.resolve();
          }
        });
      });
      
      return defer.promise;
    },
    getCollections: function () {
      var collections = [];
      
      for (var k in $window.localStorage) {
        if (k.indexOf('collection_' + boxName + '_' ) === 0 && k !== boxName + '__syncQueue') {
          collections.push({
            name: k.slice(('collection_' + boxName + '_').length)
          });
        }
      }
      
      return collections;
    }
  };
  return self;
});
