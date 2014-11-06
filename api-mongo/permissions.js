module.exports = function (api, callback) {
  callback(null, {
    checkPermission: function (context, callback) {
      // permission in JSON key format
      // examples:
      //
      // workflow intiated by the system, user alias not present
      // { "boxName": "the-box", "action": "start-workflow", "graphId": "abcd123" }
      //
      // result: callback([err or null], [boolean, being true for allowed and false for forbidden]
      //
      // query on collection, initiated by a user
      // { "boxName": "the-box", "alias": "user@provider", "action": "collection-find", "collection-name": "the-collection" }
      //
      // result: callback([err or null], [boolean, being true for allowed and false for forbidden], [object, being the reformatted query]
      //
      // TODO: API key pending to implement
      // insert in a collection by using an API key
      // { "boxName", "api-key": "abcd-1234-defg-5678-hijk", "action": "collection-insert", "collection-name", "object": { "_id": "vwxyz", "title": "some-title" }
      // see permissions.md for a full list
      
      
    },
    listPermissionGroups: function (boxName, callback) {
      api
      .collections
      .getCollection(boxName, "_permissions", function (err, collection) {
        if (err) return callback(err);

        collection.find({}, callback);
      });
    },
    describePermissionGroup: function (boxName, groupId, callback) {
      api
      .collections
      .getCollection(boxName, "_permissions", function (err, collection) {
        if (err) return callback(err);

        collection.findOne({_id: groupId}, callback);
      });
    },
    createPermissionGroup: function (boxName, groupName, callback) {
      api
      .collections
      .getCollection(boxName, "_permissions", function (err, collection) {
        if (err) return callback(err);

        collection.insert({name: groupName, users: [], permissions: {}}, callback);
      });
    },
    modifyPermissionGroup: function (boxName, groupId, newPermissions, callback) {
      api
      .collections
      .getCollection(boxName, "_permissions", function (err, collection) {
        if (err) return callback(err);
        
        console.log(newPermissions);

        collection.update({_id: groupId}, {$set: {permissions: newPermissions}}, callback);
      });
    },
    deletePermissionGroup: function (boxName, groupId, callback) {
      api
      .collections
      .getCollection(boxName, "_permissions", function (err, collection) {
        if (err) return callback(err);

        collection.remove({_id: groupId}, callback);
      });
    },
    addUserToGroup: function (boxName, groupId, alias, callback) {
      api
      .collections
      .getCollection(boxName, "_permissions", function (err, collection) {
        if (err) return callback(err);

        collection.update({_id: groupId}, {$addToSet: {users: alias}}, callback);
      });
    },
    removeUserFromGroup: function (boxName, groupId, alias, callback) {
      api
      .collections
      .getCollection(boxName, "_permissions", function (err, collection) {
        if (err) return callback(err);

        collection.update({_id: groupId}, {$pull: {users: alias}}, callback);
      });
    },
    listUsersInGroup: function (boxName, groupId, callback) {
      api
      .collections
      .getCollection(boxName, "_permissions", function (err, collection) {
        if (err) return callback(err);

        collection.findOne({_id: groupId}, function (err, doc) {
          if (err) return callback(err);
          
          if (!doc) return callback(new Error('Group does not exists'));
          
          callback(null, doc.users);
        });
      });
    },
    getEffectivePermissions: function (boxName, alias, callback) {
      api
      .collections
      .getCollection(boxName, "_permissions", function (err, collection) {
        if (err) return callback(err);

        collection.find({users: {$all: [alias]}}, function (err, docs) {
          if (err) return callback(err);
          
          var effective = {
              "collections" : {},
              "graphs" : {},
              "groups" : {},
              "system" : {
                  "stopAnySchedule" : false,
                  "startAnyWorkflow" : false,
                  "stopAnyWorkflow" : false,
                  "startAnySchedule" : false,
                  "fileUpload" : false,
                  "deleteUploads" : false
              }
          };
          
          for (var i = 0; i < docs.length; i++) {
            var cur = docs[i].permissions;
            
            if (cur.collections) {
              for (var c in cur.collections) {
                for (var p in cur.collections[c]) {
                  if (cur.collections[c][p]) {
                    if (!effective.collections[c]) effective.collections[c] = cur.collections[c];
                    else effective.collections[c][p] = true;
                  }
                }
              }
            }
          
            if (cur.graphs) {
              for (var g in cur.graphs) {
                for (var p in cur.graphs[g]) {
                  if (cur.graphs[g][p]) {
                    if (!effective.graphs[g]) effective.graphs[g] = cur.graphs[g];
                    else effective.graphs[g][p] = true;
                  }
                }
              }
            }
            
            if (cur.groups) {
              for (var g in cur.groups) {
                for (var p in cur.groups[g]) {
                  if (cur.groups[g][p]) {
                    if (!effective.groups[g]) effective.groups[g] = cur.groups[g];
                    else effective.groups[g][p] = true;
                  }
                }
              }
            }
            
            if (cur.system) {
              for (p in cur.system) {
                if (cur.system[p]) effective.system[p] = true;
              }
            }
          }
          
          callback(null, effective);
        });
      });
    }
  });
};
