module.exports = function (collections, users, callback) {
  var self = {
    listPermissionGroups: function (boxName, callback) {
      collections
      .find(boxName, "_permissions", {}, callback);
    },
    describePermissionGroup: function (boxName, groupId, callback) {
      collections.findOne(boxName, "_permissions", {_id: groupId}, callback);
    },
    createPermissionGroup: function (boxName, groupName, callback) {
      collections
      .insert(boxName, "_permissions", {name: groupName, users: [], permissions: {}}, callback);
    },
    modifyPermissionGroup: function (boxName, groupId, newPermissions, callback) {
      collections
      .update(boxName, "_permissions", {_id: groupId}, {$set: {permissions: newPermissions}}, callback);
    },
    deletePermissionGroup: function (boxName, groupId, callback) {
      collections
      .remove(boxName, "_permissions", {_id: groupId}, callback);
    },
    addUserToGroup: function (boxName, groupId, alias, callback) {
      collections
      .update(boxName, "_permissions", {_id: groupId}, {$addToSet: {users: alias}}, callback);
    },
    removeUserFromGroup: function (boxName, groupId, alias, callback) {
      collections
      .update(boxName, "_permissions", {_id: groupId}, {$pull: {users: alias}}, callback);
    },
    listUsersInGroup: function (boxName, groupId, callback) {
      collections.findOne(boxName, "_permissions", {_id: groupId}, function (err, doc) {
        if (err) return callback(err);

        if (!doc) return callback(new Error('Group does not exists'));

        callback(null, doc.users);
      });
    },
    getSyncCollections: function (boxName, alias, callback) {
      if (!boxName) return callback(new Error("No box name given"));
      if (!alias) return callback(new Error("No user alias given"));

      users.getUserRole(alias, boxName, function (err, role) {
        if (err) return callback (err);

        if (['owner', 'admin', 'dev'].indexOf(role) !== -1) {
          return collections.getCollections(boxName, callback);
        } else {
          self.getEffectivePermissions(boxName, alias, function (err, effective) {
            if (err) return callback (err);

            var syncCollections = [];

            for (var c in effective.collections) {
              if (effective.collections[c].sync) syncCollections.push(c);
            }

            if (syncCollections.indexOf("_views") === -1 || syncCollections.indexOf("_graphs") === -1) {
              users.getUserRole(alias, boxName, function (err, role) {
                if (err) return callback (err);

                if (["owner", "admin", "dev"].indexOf(role) !== -1) {
                  if (syncCollections.indexOf("_views") === -1) syncCollections.push("_views");
                  if (syncCollections.indexOf("_graphs") === -1) syncCollections.push("_graphs");
                }

                callback (null, syncCollections);
              });
            }
          });
        }
      });
    },
    getEffectivePermissions: function (boxName, alias, callback) {
      collections.find(boxName, "_permissions", {users: {$all: [alias]}}, function (err, docs) {
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
    }
  };

  return callback(null, self);
};
