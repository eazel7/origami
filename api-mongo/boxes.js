/**
 * # boxes.js
 *
 * This file contains boxes database API.
 *
 * @author Diego Pérez <eazel7@gmail.com>
 * @version 0.0.1
 */

/**
 * # Export function
 *
 * ### Example
 *
 * ```
 *   require('./lib/db/boxes')({
 *     mongo: {
 *       hostname: 'localhost',
 *       port: 27017,
 *       username: 'admin',
 *       password: 'P@ssw0rd!',
 *       authenticationDatabase: 'admin'
 *     }
 *   }, function (err, boxesApi) {
 *     // interact with Boxes API
 *   });
 * ```
 * @param {Object} configuration
 * @param {Function} callback gets two parameters (err, api).
 */
module.exports = function (config, collections, views, eventBus, callback) {
  function fairlySimplePassword() {
    var a = Date.now(), b = a / 10000, c = (a - (Math.floor(b) * 10000)).toString();

    while(c.length !== 4) {
      c = '0' + c;
    }

    return require('origami-random-names')() + '-' + c;
  }

  require('./connect')(config.mongo, function (err, db) {
    function getBox (name, callback) {
      db
      .collection('boxes')
      .findOne({
        name: name
      }, callback);
    };

    callback(err, {
      /**
       * # Saves a new box into the database and returns the box document.
       *
       * ### Examples:
       *
       * ```
       *     boxesApi.createBox('my-box', 'user@alias.com', function (err, box) {
       *       if (!err) return console.log('New box ID: ' + box._id.toString());
       *     });
       * ```
       *
       * @param {String} name of the box.
       * @param {String} user alias of the owner.
       * @return {Function} callback function gets two arguments (err, box).
       * @api public
       */
      createBox: function (boxName, owner, callback) {
        return getBox(boxName, function (err, box) {
          if (box) {
            callback(new Error('A box with that name already exists'))
          } else if (err) {
            callback(err);
          } else {
            var boxObj = {
              name: boxName,
              owner: owner,
              apiKey: apiKey
            };

            if (!config.singleDbMode) {
              boxObj.accessPassword = fairlySimplePassword();
            }

            var apiKey = fairlySimplePassword()

            db
            .collection('boxes')
            .insert(boxObj, {
              journal: true
            }, function (err, results) {
              if (err) return callback(err);
              if (results) results = results[0];

              require('./users')(config, function (err, usersApi) {
                usersApi.enableUser(owner, boxName, 'owner', function (err) {
                  if (!config.singleDbMode) {
                    db
                    .db(boxName)
                    .addUser("readUser", mongoPassword, { "j": true, roles: ["read"] }, function (err) {
                      if (err) console.log("addUser err:" + err);
                    });
                  }

                  collections
                  .createCollection(boxName, "_views", function (err) {
                    collections
                    .createCollection(boxName, "_graphs", function (err) {
                      collections
                      .createServerCollection(boxName, "_workflows", callback);
                    });
                  });
                });
              });
            });
          }
        })
      },
      /**
       * # Lists all boxes in the database.
       *
       * ### Examples:
       *
       * ```
       *     boxesApi.listBoxes(function (err, boxes) {
       *       if (!err) return console.log(boxes.length.toString() + ' boxes found.');
       *     });
       * ```
       *
       * @return {Function} callback function. It gets two arguments (err, box).
       * @api public
       */
      listBoxes: function (callback) {
        return db
        .collection('boxes')
        .find({})
        .toArray(callback);
      },
      /**
       * # Returns a box document as stored in the database.
       *
       * ### Examples:
       *
       * ```
       *     boxesApi.getBox('my-box', function (err, box) {
       *       // if not found, box parameter is undefined
       *     });
       * ```
       *
       * @param {String} name of the box.
       * @return {Function} callback function. It gets two arguments (err, box).
       * @api public
       */
      getBox: getBox,
      /**
       * # Updates the box info field.
       *
       * ### Examples:
       *
       * ```
       *     boxesApi.saveInfo("my-box", { "description": "My box" }, function (err) {
       *       console.log("Info updated");
       *     });
       * ```
       *
       * @return {Function} callback function. It gets one argument (err).
       * @api public
       */
      saveInfo: function (boxName, info, callback) {
        db
        .collection("boxes")
        .update({
          "name": boxName
        }, {
          $set: {
            "info": info
          }
        }, callback);
      }
    });
  });
}
