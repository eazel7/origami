module.exports = function (api, callback) {
  callback(null, {
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
