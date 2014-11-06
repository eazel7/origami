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
    }
  });
};
