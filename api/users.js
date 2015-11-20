/* eslint-disable semi */

function Users (db, settings) {
  this.db = db;
  this.settings = settings;
}

Users.prototype.listUsers = function (callback) {
  var self = this;

  self.db
  .collection('users')
  .find({}, {_id: 1, displayName: 1, alias: 1})
  .toArray(callback);
};

Users.prototype.setCreateBoxQuota = function (alias, quota, callback) {
  var self = this;

  self.getUserMetadata(alias.toLowerCase(), function (err, metadata) {
    if (err) return callback(err);

    metadata.createBoxQuota = quota;

    self.setUserMetadata(alias, metadata, callback);
  });
};

Users.prototype.getCreateBoxQuota = function (alias, callback) {
  var self = this;

  self.getUserMetadata(alias.toLowerCase(), function (err, metadata) {
    if (err) return callback(err);

    callback(null, metadata.createBoxQuota);
  });
};

Users.prototype.getMasterUser = function (callback) {
  var self = this;

  self.settings.get('master-user', callback);
};

Users.prototype.setMasterUser = function (newMasterUser, callback) {
  var self = this;

  if (!newMasterUser) return callback('Master user cannot be blank');

  self.isValid(newMasterUser, function (err, isValid) {
    if (err) return callback(err);
    if (!isValid) return callback('Invalid user alias');

    self.settings.set('master-user', newMasterUser, callback);
  });
};

Users.prototype.listBoxUsers = function (boxName, callback) {
  var self = this;
  var query = {};

  query['roles.' + boxName] = {
    $exists: true
  };

  self.db
  .collection('users')
  .find(query, {_id: 1, displayName: 1, alias: 1, roles: 1})
  .toArray(function (err, users) {
    if (err) return callback(err);

    for (var i = 0; i < users.length; i++) {
      users[i].role = users[i].roles[boxName];

      delete users[i].role;
    }

    callback(null, users);
  });
};

Users.prototype.getUser = function (userAlias, callback) {
  var self = this;

  self.db
  .collection('users')
  .findOne({
    alias: userAlias.toLowerCase()
  }, callback);
};

Users.prototype.enableUser = function (userAlias, boxName, role, callback) {
  var self = this;

  if (!userAlias) callback('No user alias');
  if (!boxName) callback('No box name');
  if (!role) callback('No role');

  self.db
  .collection('users')
  .findOne({
    alias: userAlias.toLowerCase()
  }, function (err, doc) {
    if (err) return callback(err);

    var roles = doc.roles || {};

    roles[boxName] = role;

    self.db
    .collection('users')
    .update({
      alias: userAlias
    }, {
      $set: {
        roles: roles
      }
    }, callback);
  });
};

Users.prototype.registerUser = function (userAlias, displayName, callback) {
  var self = this;

  self.db
  .collection('users')
  .findOne({
    alias: userAlias.toLowerCase()
  }, function (err, doc) {
    if (err) return callback(err);
    if (doc) return callback('User alias already exists');

    self.db
    .collection('users')
    .insert({
      alias: userAlias.toLowerCase(),
      displayName: displayName,
      roles: {}
    }, function (err) {
      if (err) return callback(err);

      self.getMasterUser(function (err, master) {
        if (!master) {
          self.setMasterUser(userAlias.toLowerCase(), callback);
        } else {
          callback(err);
        }
      });
    });
  });
};

Users.prototype.getUserRole = function (userAlias, boxName, callback) {
  var self = this;

  self.db
  .collection('users')
  .findOne({
    alias: userAlias.toLowerCase()
  }, function (err, doc) {
    if (doc && doc.roles) {
      return callback(err, doc.roles[boxName]);
    }

    callback(err);
  });
};

Users.prototype.disableUser = function (userAlias, boxName, callback) {
  var self = this;

  self.db
  .collection('users')
  .findOne({
    alias: userAlias.toLowerCase()
  }, function (err, doc) {
    if (err) return callback(err);

    var roles = doc.roles || {};

    delete roles[boxName];

    self.db
    .collection('users')
    .update({
      alias: userAlias
    }, {
      $set: {
        roles: roles
      }
    }, callback);
  });
};

Users.prototype.isValid = function (userAlias, callback) {
  var self = this;

  self.db
  .collection('users')
  .count({
    alias: userAlias.toLowerCase()
  }, function (err, count) {
    if (err) return callback(err);

    callback(null, count === 1);
  });
};

Users.prototype.forgetUser = function (userAlias, callback) {
  var self = this;

  self.db
  .collection('users')
  .remove({
    alias: userAlias.toLowerCase()
  }, callback);
};

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
Users.prototype.getOwnedBoxes = function (userAlias, callback) {
  var self = this;

  self.db
  .collection('users')
  .findOne({
    alias: userAlias.toLowerCase()
  }, function (err, doc) {
    if (err) return callback(err);

    var boxNames = [];

    if (doc.roles) {
      for (var boxName in doc.roles) {
        if (doc.roles[boxName] === 'owner') {
          boxNames.push(boxName);
        }
      }
    }

    callback(null, boxNames);
  });
};

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
Users.prototype.getAllowedBoxes = function (userAlias, callback) {
  var self = this;

  self.db
  .collection('users')
  .findOne({
    alias: userAlias.toLowerCase()
  }, function (err, doc) {
    if (err) return callback(err);

    var boxNames = [];

    if (!doc) {
      return callback(null, []);
    }

    if (doc.roles) {
      for (var boxName in doc.roles) {
        boxNames.push(boxName);
      }
    }

    callback(null, boxNames);
  });
};

Users.prototype.getUserMetadata = function (userAlias, callback) {
  var self = this;

  self.db
  .collection('users')
  .findOne({
    alias: userAlias.toLowerCase()
  }, {
    metadata: 1
  }, function (err, doc) {
    if (doc) return callback(err, doc.metadata);

    return callback(err);
  })
};

Users.prototype.setUserMetadata = function (userAlias, metadata, callback) {
  var self = this;

  self.db
  .collection('users')
  .update({
    alias: userAlias.toLowerCase()
  }, {
    $set: {
      metadata: metadata
    }
  }, callback);
};

module.exports = function (db, settings, callback) {
  var users = new Users(db, settings);

  callback(null, users);
};
