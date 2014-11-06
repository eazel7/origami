module.exports = function (api, boxName, workflowId, input, successCallback, errorCallback) {
  return { 
    input: input,
    db: {
      getCollection: function (collectionName) {
        return {
          find: function (predicate) {
            var defer = Q.defer();
            
            api.collections.getCollection(boxName, collectionName, function (err, collection) {
              if (err) {
                console.error(err);
                return defer.reject(err);
              }
              
              collection
              .find(predicate, function (err, docs) {
                if (err) return defer.reject(err);
                
                defer.resolve(docs);
              });
            });
            
            return defer.promise;
          },
          findOne: function (predicate) {
            var defer = Q.defer();
            
            api.collections.getCollection(boxName, collectionName, function (err, collection) {
              if (err) {
                console.error(err);
                return defer.reject(err);
              }
              
              collection
              .findOne(predicate, function (err, doc) {
                if (err) return defer.reject(err);
                
                defer.resolve(doc);
              });
            });
            
            return defer.promise;
          },
          insert: function (object) {
            var defer = Q.defer();
            
            api.collections.getCollection(boxName, collectionName, function (err, collection) {
              if (err) {
                console.error(err);
                return defer.reject(err);
              }
              
              collection
              .insert(object, function (err, doc) {
                if (err) return defer.reject(err);
                
                defer.resolve(doc);
              });
            });
            
            return defer.promise;
          },
          update: function (predicate, replacement) {
            var defer = Q.defer();
            
            api.collections.getCollection(boxName, collectionName, function (err, collection) {
              if (err) {
                console.error(err);
                return defer.reject(err);
              }
              
              collection
              .update(predicate, replacement, function (err) {
                if (err) return defer.reject(err);
                
                defer.resolve();
              });
            });
            
            return defer.promise;
          }
        }
      }
    },
    success: successCallback,
    error: errorCallback,
    notifyUser: function (alias, message) {
      api.eventBus.emit('desktop-notification-user', boxName, alias, message);
    },
    JSON: JSON,
    console: {
      log: function () {
        api.eventBus.emit('workflow-output', boxName, workflowId, {
          date: new Date().valueOf(),
          string: JSON.stringify(arguments)
        });
      }
    } 
  };
}
