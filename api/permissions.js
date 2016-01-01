/* eslint-disable semi */

function PermissionsAPI (collections, users) {
  this.collections = collections;
  this.users = users;
}

PermissionsAPI.prototype.listPermissionGroups = function (boxName, callback) {
  var self = this;

  self.collections
  .find(boxName, '_permissions', {}, callback);
};

PermissionsAPI.prototype.describePermissionGroup = function (boxName, groupId, callback) {
  var self = this;

  self.collections.findOne(boxName, '_permissions', {_id: groupId}, callback);
};

PermissionsAPI.prototype.createPermissionGroup = function (boxName, groupName, callback) {
  var self = this;

  self.collections
  .insert(boxName, '_permissions', {name: groupName, users: [], permissions: {}}, callback);
};

PermissionsAPI.prototype.modifyPermissionGroup = function (boxName, groupId, newPermissions, callback) {
  var self = this;

  self.collections
  .update(boxName, '_permissions', {_id: groupId}, {$set: {permissions: newPermissions}}, callback);
};

PermissionsAPI.prototype.deletePermissionGroup = function (boxName, groupId, callback) {
  var self = this;

  self.collections
  .remove(boxName, '_permissions', {_id: groupId}, callback);
};

PermissionsAPI.prototype.addUserToGroup = function (boxName, groupId, alias, callback) {
  var self = this;

  self.collections
  .update(
    boxName,
    '_permissions',
    {
      _id: groupId
    },
    {
      $addToSet: {
        users: alias
      }
    },
    callback);
};

PermissionsAPI.prototype.removeUserFromGroup = function (boxName, groupId, alias, callback) {
  var self = this;

  self.collections
  .update(
    boxName,
    '_permissions',
    {
      _id: groupId
    },
    {
      $pull: {
        users: alias
      }
    },
    callback);
};

PermissionsAPI.prototype.listUsersInGroup = function (boxName, groupId, callback) {
  var self = this;

  self.collections
  .findOne(
    boxName,
    '_permissions', {
      _id: groupId
    },
    function (err, doc) {
      if (err) return callback(err);

      if (!doc) return callback(new Error('Group does not exists'));

      callback(null, doc.users);
    });
};

PermissionsAPI.prototype.getSyncCollections = function (boxName, alias, callback) {
  var self = this;

  if (!boxName) return callback(new Error('No box name given'));
  if (!alias) return callback(new Error('No user alias given'));

  self.users
  .getUserRole(alias, boxName, function (err, role) {
    if (err) return callback(err);

    if (['owner', 'admin', 'dev'].indexOf(role) !== -1) {
      return self.collections.getCollections(boxName, callback);
    } else {
      self.getEffectivePermissions(boxName, alias, function (err, effective) {
        if (err) return callback(err);

        var syncCollections = [];

        for (var c in effective.collections) {
          if (effective.collections[c].sync) syncCollections.push(c);
        }

        if (syncCollections.indexOf('_views') === -1 || syncCollections.indexOf('_graphs') === -1) {
          self.users
          .getUserRole(alias, boxName, function (err, role) {
            if (err) return callback(err);

            if (['owner', 'admin', 'dev'].indexOf(role) !== -1) {
              if (syncCollections.indexOf('_views') === -1) syncCollections.push('_views');
              if (syncCollections.indexOf('_graphs') === -1) syncCollections.push('_graphs');
            }

            callback(null, syncCollections);
          });
        }
      });
    }
  });
};

PermissionsAPI.prototype.getEffectivePermissions = function (boxName, alias, callback) {
  var self = this;

  self.collections
  .find(
    boxName,
    '_permissions',
    {
      users: {
        $all: [alias]
      }
    },
    function (err, docs) {
      if (err) return callback(err);

      var effective = {
        'collections': {},
        'graphs': {},
        'groups': {},
        'system': {
          'stopAnySchedule': false,
          'startAnyWorkflow': false,
          'stopAnyWorkflow': false,
          'startAnySchedule': false,
          'fileUpload': false,
          'deleteUploads': false
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
            for (var p2 in cur.graphs[g]) {
              if (cur.graphs[g][p2]) {
                if (!effective.graphs[g]) effective.graphs[g] = cur.graphs[g];
                else effective.graphs[g][p2] = true;
              }
            }
          }
        }

        if (cur.groups) {
          for (var g2 in cur.groups) {
            for (var p3 in cur.groups[g2]) {
              if (cur.groups[g2][p3]) {
                if (!effective.groups[g2]) effective.groups[g2] = cur.groups[g2];
                else effective.groups[g2][p3] = true;
              }
            }
          }
        }

        if (cur.system) {
          for (var p4 in cur.system) {
            if (cur.system[p4]) effective.system[p4] = true;
          }
        }
      }

      callback(null, effective);
    });
};

module.exports = PermissionsAPI;
