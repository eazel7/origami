var nodemailer = require('nodemailer');
var mustache = require('mustache');

module.exports = function (api, boxName, workflowId, input, successCallback, errorCallback) {
  return { 
    api: api.wrapper(function () {
      return {
        boxName: boxName,
        workflowOf: boxName
      };
    }, function () {
      throw new Error('Invalid API usage in ' + workflowId);
    }, api),
    boxName: boxName,
    input: input,
    JSON: JSON,
    async: require('async'),
    renderTemplate: function (template, view) {
      return mustache.render(template, view);
    },
    sendMail: function (transport, email, callback) {
      nodemailer.createTransport(transport).sendMail(email, function(err, info){
        if(err) return callback(err);
        
        return callback(null, info);
      });
    },
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
          string: arguments[0]
        });
      }
    } 
  };
}
