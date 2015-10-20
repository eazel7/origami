module.exports = function (db, settings, callback) {
  var self = {
    listUsers: function (callback) {
      db
      .collection('users')
      .find({}, {_id: 1, displayName: 1, alias: 1})
      .toArray(callback);
    },
    setCreateBoxQuota: function (alias, quota, callback) {
      self.getUserMetadata(alias.toLowerCase(), function (err, metadata) {
        if (err) return callback(err);
        
        metadata.createBoxQuota = quota;
        
        self.setUserMetadata(alias, metadata, callback);
      });
    },
    getCreateBoxQuota: function (alias, callback) {
      self.getUserMetadata(alias.toLowerCase(), function (err, metadata) {
        if (err) return callback(err);
        
        callback(null, metadata.createBoxQuota);
      });
    },
    getMasterUser: function (callback) {
      settings.get('master-user', callback);
    },
    setMasterUser: function (newMasterUser, callback) {
      if (!newMasterUser) return callback ('Master user cannot be blank');
      
      self.isValid(newMasterUser, function (err, isValid) {
        if (err) return callback(err);
        if (!isValid) return callback('Invalid user alias');
        
        settings.set('master-user', newMasterUser, callback);
      });
    },
    listBoxUsers: function (boxName, callback) {
      var query = {};

      query['roles.' + boxName] = {
        $exists: true
      };

      db
      .collection('users')
      .find(query, {_id: 1, displayName: 1, alias: 1, roles: 1})
      .toArray(function (err, users) {
        if (err) return callback (err);
        
        for (var i = 0; i < users.length; i++) {
          users[i].role = users[i].roles[boxName];
          
          delete users[i].role;
        }
        
        callback (null, users);
      });
    },
    getUser: function (userAlias, callback) {
      db
      .collection('users')
      .findOne({
        alias: userAlias.toLowerCase()
      }, callback);
    },
    enableUser: function (userAlias, boxName, role, callback) {
      if (!userAlias) throw new Error ("No user alias");
      if (!boxName) throw new Error ("No box name");
      if (!role) throw new Error ("No role");
    
      db
      .collection('users')
      .findOne({
        alias: userAlias.toLowerCase()
      }, function (err, doc) {
        var roles = doc.roles || {};

        roles[boxName] = role;

        db
        .collection('users')
        .update({
          alias: userAlias
        }, {
          $set: {
            roles: roles
          }
        }, callback);
      });
    },
    registerUser: function (userAlias, displayName, callback) {
      db
      .collection('users')
      .findOne({
        alias: userAlias.toLowerCase()
      }, function (err, doc) {
        if (doc) return callback('User alias already exists');
        
        db
        .collection('users')
        .insert({
          alias: userAlias.toLowerCase(),
          displayName: displayName,
          roles: {}
        }, function (err) {
          self.getMasterUser(function (err, master) {
            if (!master) {
              self.setMasterUser(userAlias.toLowerCase(), callback);
            } else {
              callback (err);
            }
          });
        });
      });
    },
    getUserRole: function (userAlias, boxName, callback) {
      db
      .collection('users')
      .findOne({
        alias: userAlias.toLowerCase()
      }, function (err, doc) {
        if (doc && doc.roles) {
          return callback(err, doc.roles[boxName]);
        }

        callback(err);
      });
    },
    disableUser: function (userAlias, boxName, callback) {
      db
      .collection('users')
      .findOne({
        alias: userAlias.toLowerCase()
      }, function (err, doc) {
        var roles = doc.roles || {};

        delete roles[boxName];

        db
        .collection('users')
        .update({
          alias: userAlias
        }, {
          $set: {
            roles: roles
          }
        }, callback);
      });
    },
    isValid: function (userAlias, callback) {
      db
      .collection("users")
      .count({
        alias: userAlias.toLowerCase()
      }, function (err, count) {
        callback(null, count === 1);
      });
    },
    forgetUser: function (userAlias, callback) {
      db
      .collection("users")
      .remove({
        alias: userAlias.toLowerCase()
      }, callback);
    },
    /**
     * # Returns the list of box names where user has tn owner role.
     *
     * ### Examples:
     *
     * ```
     *     boxesApi.getOwnedBox('my-box', function (err, boxNames) {
     *       console.log('User can do whatever he/she wants with these boxes: ', boxNames.join(','));
     *     });
     * ```
     *
     * @param {String} alias of the user.
     * @return {Function} callback function. It gets two arguments (err, boxNames).
     * @api public
     */
    getOwnedBoxes: function (userAlias, callback) {
      db
      .collection('users')
      .findOne({
        alias: userAlias.toLowerCase()
      }, function (err, doc) {
        var boxNames = [];

        if (doc.roles) {
          for (var boxName in doc.roles) {
            if (doc.roles[boxName] == 'owner') {
              boxNames.push(boxName);
            }
          }
        }

        callback(null, boxNames);
      });
    },
    /**
     * # Returns the list of box names where user has any role
     *
     * ### Examples:
     *
     * ```
     *     boxesApi.getAllowedBoxes('my-box', function (err, boxNames) {
     *       console.log('User can log in in these boxes: ', boxNames.join(','));
     *     });
     * ```
     *
     * @param {String} alias of the user.
     * @return {Function} callback function. It gets two arguments (err, boxNames).
     * @api public
     */
    getAllowedBoxes: function (userAlias, callback) {
      db
      .collection('users')
      .findOne({
        alias: userAlias.toLowerCase()
      }, function (err, doc) {
        var boxNames = [];
        
        if (!doc) {
          return callback (null,  []);
        }

        if (doc.roles) {
          for (var boxName in doc.roles) {
            boxNames.push(boxName);
          }
        }

        callback(null, boxNames);
      });
    },
    getUserMetadata: function (userAlias, callback) {
      db
      .collection('users')
      .findOne({
        alias: userAlias.toLowerCase()
      }, {
        metadata: 1
      }, function (err, doc) {
        if (doc) return callback(err, doc.metadata);

        return callback (err);
      })
    },
    setUserMetadata: function (userAlias, metadata, callback) {
      db
      .collection('users')
      .update({
        alias: userAlias.toLowerCase()
      }, {
        $set: {
          metadata: metadata
        }
      }, callback);
    }
  };

  callback(null, self);
}
