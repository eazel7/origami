/**
 * # box.js
 *
 * This file contains box collections database API.
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
 *   require('./lib/db/box')({
 *     mongo: {
 *       hostname: 'localhost',
 *       port: 27017,
 *       username: 'admin',
 *       password: 'P@ssw0rd!',
 *       authenticationDatabase: 'admin'
 *     }
 *   }, function (err, boxApi) {
 *     // interact with boxes collections API
 *   });
 * ```
 * @param {Object} configuration
 * @param {Function} collectionWrapper wraps collections before being returned
 * @param {Function} callback gets two parameters (err, api).
 */
module.exports = function (config, connect, collectionWrapper, router, callback) {
  connect(function (err, db) {
    callback(null, {
      /**
       * # Gets a collection API object for the given box and collection.
       *
       * ### Examples:
       *
       * ```
       * boxApi.getCollection('my-box', 'my-collection', function (err, collection) {
       *   if (!err) collection.count(function (err, count) {
       *     console.log('Total documents: ' + count.toString());
       *   });
       * });
       * ```
       *
       * @param {String} box name.
       * @param {String} collection name.
       * @return {Function} callback function gets two arguments (err, collection).
       * @api public
       */
      getCollection: function (boxName, collectionName, callback) {
        router.routeCollection(boxName, collectionName, function (err, route) {
          collectionWrapper.wrap(db
            .db(route.database)
            .collection(route.collection), {
              "box": boxName,
              "collection": collectionName
            }, callback);
        });
      },
      /**
       * # Gets the collection names for a given box.
       *
       * ### Examples:
       *
       * ```
       * boxApi.getCollections('my-box', function (err, collections) {
       *   console.log("These are the collections: ", collections.join(','));
       * });
       * ```
       *
       * @param {String} box name.
       * @return {Function} callback function gets two arguments (err, collectionNames).
       * @api public
       */
      getCollections: function (boxName, callback) {
        db
        .collection("boxes")
        .findOne({
          name: boxName
        }, function (err, box) {
          var collections = [];

          for (var name in box.collections) {
            if (box.collections[name].sync === undefined || box.collections[name].sync !== false) {
              collections.push(name);
            }
          }

          callback(null, collections);
        });
      },
      /**
       * # Creates a collection for a given box.
       *
       * ### Examples:
       *
       * ```
       * boxApi.createCollection('my-box', 'my-collection', function (err, collections) {
       *   console.log("These are the collections: ", collections.join(','));
       * });
       * ```
       *
       * @param {String} box name.
       * @return {Function} callback function gets one argument (err).
       * @api public
       */
      createCollection: function (boxName, collectionName, callback) {
        db
        .collection("boxes")
        .findOne({
          name: boxName
        }, function (err, box) {
          var collections = box.collections || {};

          router.routeCollection(boxName, collectionName, function (err, route) {
            collections[collectionName] = {
              database: route.database,
              collection: route.collection
            };

            db
            .collection("boxes")
            .update({
              name: boxName
            }, {
              $set: {
                collections: collections
              }
            }, {
              journal: true
            }, function (err) {
              callback(err);
            });
          });
        });
      },
      /**
       * # Creates a collection for a given box, marked with sync:false.
       *
       * ### Examples:
       *
       * ```
       * boxApi.createCollection('my-box', 'my-collection', function (err, collections) {
       *   console.log("These are the collections: ", collections.join(','));
       * });
       * ```
       *
       * @param {String} box name.
       * @return {Function} callback function gets one argument (err).
       * @api public
       */
      createServerCollection: function (boxName, collectionName, callback) {
        db
        .collection("boxes")
        .findOne({
          name: boxName
        }, function (err, box) {
          var collections = box.collections || {};

          router.routeCollection(boxName, collectionName, function (err, route) {
            collections[collectionName] = {
              database: route.database,
              collection: route.collection,
              sync: false
            };

            db
            .collection("boxes")
            .update({
              name: boxName
            }, {
              $set: {
                collections: collections
              }
            }, {
              journal: true
            }, function (err) {
              callback(err);
            });
          });
        });
      }
    });
  });
}
