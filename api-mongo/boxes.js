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
var Grid = require('mongodb').Grid, ObjectID = require('mongodb').ObjectID;

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
    
    var self = {
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
        if (!boxName) throw new Error("No box name");
        if (!owner) throw new Error("No owner");      
      
        return getBox(boxName, function (err, box) {
          if (box) {
            callback(new Error('A box with that name already exists'))
          } else if (err) {
            callback(err);
          } else {
            var boxObj = {
              name: boxName,
              owner: owner,
              apiKey: apiKey,
              angularModules: [],
              styles: [],
              collections: {},
              manifest: "CACHE MANIFEST\n",
              packages: [],
              scripts: []
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
      },
      uploadFile: function (boxName, buffer, callback) {
        var grid = new Grid(db, boxName + "-_uploads");
          
        grid.put(buffer, {}, callback);
      },
      deleteFile: function (boxName, id, callback) {
        var grid = new Grid(db, boxName + "-_uploads");
          
        grid.delete(new ObjectID(id), {}, callback);
      },
      listFiles: function (boxName, callback) {
        db
        .collection(boxName + "-_uploads.files")
        .find({}, {_id: 1})
        .toArray(function (err, docs) {
          if (err) return callback (err);
          var ids = [];
          
          for (var i = 0; i < docs.length; i++) ids.push(docs[i]._id.toString());
          
          callback(null, ids);
        });
      },
      serveFile: function (boxName, id, callback) {
        var grid = new Grid(db, boxName + "-_uploads");
        
        grid.get(new ObjectID(id), callback);
      },
      export: function (boxName, callback) {
        // collections
        // packages
        // uploads
        
        var AdmZip = require('adm-zip');

        var zip = new AdmZip();
        async
        .series([function (callback) {
          self.listFiles(boxName, function (err, files) {
            if (err) return callback (err);
          
            async
            .each(files, function (file, fileCallback) {
              self.serveFile(boxName, file, function (err, buffer) {
                if (err) return fileCallback(err);
                
                zip.addFile("uploads/" + file, buffer);
                
                fileCallback();
              });
            }, callback);
          });
        },function (callback) {
          collections.getCollections(boxName, function (err, collectionNames) {
            if (err) return callback (err);
          
            async
            .eachSeries(collectionNames, function (collectionName, collectionCallback) {
              collections.getCollection(boxName, collectionName, function (err, collection) {
                if (err) return collectionCallback (err);
                
                collection.find({}, function (err, docs) {
                  if (err) return collectionCallback(err);
                  
                  zip.addFile("collections/" + collectionName + ".json", new Buffer(JSON.stringify(docs, undefined, 2)));
                  
                  collectionCallback();
                });
              });
            }, callback);
          });
        }, function (callback) {
          self.getBox(boxName, function (err, box) {
            if (err) return callback (err);
            
            zip.addFile("box.json", new Buffer(JSON.stringify({info: box.info, packages: box.packages}, undefined, 2)));
            
            callback();
          });
        }], function (err) {
          if (err) return callback (err);
          
          callback(null, zip.toBuffer());
        });
      },
      import: function (boxName, bytes, callback) {
        var ZipFile = require("adm-zip/zipFile"),
            AdmZipUtil = require("adm-zip/util");
        
        var zip = new ZipFile (bytes, AdmZipUtil.Constants.BUFFER);
        
        var box = JSON.parse(zip.getEntry("box.json").getData().toString());
        
        var entries = zip.entries;
        
        async.series([
          function (callback) {
            db
            .collection('boxes')
            .update({
              name: boxName
            }, {
            $set: {
              info: box.info,
              packages: box.packages
            }
          }, function (err) {
            if (err) return callback(err);
            
            eventBus.emit('box-packages-updated', boxName);
            
            callback();
          });
         }, function (callback) {
           async.eachSeries(entries, function (entry, entryCallback) {
             if (entry.entryName.indexOf('uploads/') === 0) {
               var entryBuffer = entry.getData(),
                 uploadId = new ObjectID(entry.entryName.slice("uploads/".length)),
                 grid = new Grid(db, boxName + "-_uploads");
                 
                 grid.put(entryBuffer, {_id: uploadId}, entryCallback);
              } else if (entry.entryName.indexOf('collections/') === 0) {
                var collectionName = entry.entryName.slice("collections/".length, entry.entryName.lastIndexOf('.json')),
                  data = JSON.parse(zip.getEntry(entry.entryName).getData().toString());
                    
                async.series([function (callback) {
                  collections.createCollection(boxName, collectionName, callback);
                }, function (callback) {
                  collections.getCollection(boxName, collectionName, function (err, collection) {
                    if (err) return callback (err);
                    
                    collection.remove({}, function (err) {
                      if (err) return callback(err);
                      
                      async.eachSeries(data, function (obj, callback) {
                        collection.insert(obj, callback);
                      }, callback);
                    });
                  });
                }], entryCallback);
              } else return entryCallback();
            }, callback);
         }
        ], callback);
      }
    };

    callback(err, self);
  });
}
