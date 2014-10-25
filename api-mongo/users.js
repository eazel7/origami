module.exports = function (config, callback) {
  require('./connect')(config.mongo, function (err, db) {
    callback(null, {
      listUsers: function (callback) {
        db
        .collection('users')
        .find({}, {_id: 1, displayName: 1, alias: 1})
        .toArray(callback);
      },
      listBoxUsers: function (boxName, callback) {
        var query = {};

        query['roles.' + boxName] = {
          $exists: true
        };

        db
        .collection('users')
        .find(query, {_id: 1, displayName: 1, alias: 1})
        .toArray(callback);
      },
      getUser: function (userAlias, callback) {
        db
        .collection('users')
        .findOne({
          alias: userAlias
        }, callback);
      },
      enableUser: function (userAlias, boxName, role, callback) {
        if (!userAlias) throw new Error ("No user alias");
        if (!boxName) throw new Error ("No box name");
        if (!role) throw new Error ("No role");
      
        db
        .collection('users')
        .findOne({
          alias: userAlias
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
          }, {
            journal: true
          }, callback);
        });
      },
      registerUser: function (userAlias, displayName, callback) {
        db
        .collection('users')
        .findOne({
          alias: userAlias
        }, function (err, doc) {
          if (doc) return callback('User alias already exists');
          
          db
          .collection('users')
          .insert({
            alias: userAlias,
            displayName: displayName,
            roles: {}
          }, callback);
        });
      },
      getUserRole: function (userAlias, boxName, callback) {
        db
        .collection('users')
        .findOne({
          alias: userAlias
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
          alias: userAlias
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
          }, {
            journal: true
          }, callback);
        });
      },
      isValid: function (userAlias, callback) {
        db
        .collection("users")
        .count({
          alias: userAlias
        }, function (err, count) {
          callback(null, count === 1);
        });
      },
      forgetUser: function (userAlias, callback) {
        db
        .collection("users")
        .remove({
          alias: userAlias
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
          alias: userAlias
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
          alias: userAlias
        }, function (err, doc) {
          var boxNames = [];

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
          alias: userAlias
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
          alias: userAlias
        }, {
          $set: {
            metadata: metadata
          }
        }, callback);
      }
    });
  });
}
