var manifestDate = String(Date.now()),
    allAssets = require('./allAssets');

module.exports = function (api) {
  return function (boxName, callback) {
    var express = require('express'),
        app = express();

    app.get('/scripts/info.js', function (req, res) {
      var script = 'angular.module(\'box-info\', [])\n' +
                   '.value(\'boxName\', ' + JSON.stringify(boxName) +  ');';

      res.setHeader('Content-Type', 'application/javascript');
      return res.end(script);
    });

    app.get('/html.manifest', function (req, res) {
      api.boxes.getBox(boxName, function (err, doc) {
        if (err) {
          res.status(418);
          return res.end();
        }
        
        res.setHeader('Content-Type', 'text/cache-manifest');
        res.send(doc.manifest);
        res.end();
      });
    });

    app.get('/scripts.json', function (req, res) {
      api.boxes.getBox(boxName, function (err, doc) {
        if (err) {
          res.status(418);
          return res.end();
        }
        
        doc.scripts.unshift("scripts/info.js");
        doc.scripts.unshift("/socket.io/socket.io.js");
        
        res.json(doc.scripts);
      });
    });
    
    app.get('/styles.json', function (req, res) {
      api.boxes.getBox(boxName, function (err, doc) {
        if (err) {
          res.status(418);
          return res.end();
        }
        
        res.json(doc.styles);
      });
    });
    
    app.get('/angular-modules.json', function (req, res) {
      api.boxes.getBox(boxName, function (err, doc) {
        if (err) {
          res.status(418);
          return res.end();
        }
        
        res.json(doc.angularModules || []);
      });
    });
    
    app.get('/api/graphs/componentGallery', function (req, res) {
      api.workflows.listComponents(function (err, gallery) {
        res.json(gallery);
      });
    });
    
    app.get('/api/collections', function (req, res) {
      api.collections.getCollections(
        boxName,
        function (err, names){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          return res.json(names);
        });
    });
    
    app.post('/api/collection/:collection/find', function (req, res) {
      api.collections.getCollection(
        boxName,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.find(req.body || {}, function (err, docs) {
            if (err) {
              console.log({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            return res.json(docs);
          });
        });
    });
    
    
    app.post('/api/collection/:collection/count', function (req, res) {
      api.collections.getCollection(
        boxName,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.count(req.body || {}, function (err, docs) {
            if (err) {
              console.log({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            return res.json(docs);
          });
        });
    });
    
    app.post('/api/collection/:collection/findOne', function (req, res) {
      return api.collections.getCollection(
        boxName,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.findOne(req.body || {}, function (err, doc) {
            if (err) {
              console.log({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            if (!doc) {
              res.status(404);
              return res.end();
            }

            return res.json(doc);
          });
        });
    });

    app.get('/api/queuedSyncOperations/:from', function (req, res) {
      function handleErr (err){
        console.log(err);
        res.status(418);
        return res.end();
      }
      
      api.syncWrapper.getLog(boxName, function (err, log) {
        log
        .find({
          date: {
            $gt: Number(req.params.from)
          }
        })
        .toArray(function (err, docs) {
          if (err) return handleErr(err)
          var rawOps = docs.length;

          require('./compressOps')(docs, boxName, api, function (err, compressedOps) {
            if (err) return handleErr(err);
            
            console.log('Compression: ' + rawOps + ' vs ' + compressedOps.length);

            res.json(docs || []);
          });
        });
      });
    });

    app.post('/api/collection/:collection/insert', function (req, res) {
      return api.collections.getCollection(
        boxName,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.insert(req.body, function (err, newDoc) {
            if (err) {
              console.log({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            return res.json(newDoc);
          }, req.headers['box.browserkey']);
        });
    });
    app.post('/api/collection/:collection/update', function (req, res) {
      return api.collections.getCollection(
        boxName,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.update(req.body.predicate, req.body.replacement, function (err, newDoc) {
            if (err) {
              console.log({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            res.status(200);
            return res.end();
          }, req.headers['box.browserkey']);
        });
    });
    app.post('/api/collection/:collection/remove', function (req, res) {
      return api.collections.getCollection(boxName, req.params.collection, function (err, collection){
        if (err) {
          console.log({ box: boxName, url: req.params.url, err: err});
          res.status(418);
          return res.end();
        }

        collection.remove(req.body, function (err) {
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          res.status(200);
          return res.end();
        }, req.headers['box.browserkey']);
      });
    });

    app.get('/api/graphs/list', function () {
      api.workflows.listGraphs(boxName, function (err, graphs){
        res.json(graphs);
      });
    });

    app.post('/api/graphs/save', function () {
      delete req.body._id;

      api.workflows.saveGraph(boxName, req.body, function (err, graphs){
        res.json(graphs);
      });
    });

    app.post('/api/graphs/:graphId', function (req, res) {
      req.body._id = req.params._id;

      api.workflows.saveGraph(boxName, req.body, function (err, graphs){
        res.json(graphs);
      });
    });

    app.get('/api/graphs/:graphId/history', function (req, res) {
      api.workflows.listPastWorkflows(boxName, req.params.graphId, function (err, past){
        res.json(past);
      });
    });

    app.post('/api/graphs/:graphId/start', function (req, res) {
      api.workflows.startWorkflow(boxName, req.params.graphId, req.body || {}, function (err, graphs){
        if (err) {
          res.status(418);
          return res.end();
        }
        res.json(graphs);
      });
    });

    app.post('/api/graphs/:graphId/delete', function (req, res) {
      api.workflows.removeGraph(boxName, req.params.graphId, function (err){
        res.status(err ? 418 : 200);
        return res.end();
      });
    });

    app.post('/api/workflows/:workflowId/stop', function (req, res) {
      api.workflows.stopWorkflow(req.params.workflowId, function (err){
        if (err) console.error(err);

        res.status(err ? 418 : 200);
        return res.end();
      });
    });

    app.get('/api/workflows/:workflowId/output', function (req, res) {
      api.workflows.getOutput(req.params.workflowId, function (err, output){
        if (err) {
          console.error(err);
          res.status(418);
          return res.end();
        }
        
        return res.json(output);
      });
    });
    
    app.get('/api/workflows/:workflowId/activeConnections', function (req, res) {
      api.workflows.getActiveConnections(req.params.workflowId, function (err, active){
        if (err) {
          console.error(err);
          res.status(418);
          return res.end();
        }
        
        return res.json(active);
      });
    });

    app.get('/api/dbs/:name/:collection/find', function (req, res) {
      api.remoteDbs.getCollection (
        boxName,
        req.params.name,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.find({})
          .toArray(function (err, docs) {
            if (err) {
              console.error({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            return res.json(docs);
          });
        });
    });
    
    app.post('/api/dbs/:name/:collection/find', function (req, res) {
      api.remoteDbs.getCollection (
        boxName,
        req.params.name,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.find(req.body || {})
          .toArray(function (err, docs) {
            if (err) {
              console.error({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            return res.json(docs);
          });
        });
    });
    
    app.post('/api/dbs/:name/:collection/count', function (req, res) {
      api.remoteDbs.getCollection (
        boxName,
        req.params.name,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.error({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.count(req.body || {}, function (err, docs) {
            if (err) {
              console.error({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            return res.json(docs);
          });
        });
    });
    
    app.post('/api/dbs/:name/:collection/findOne', function (req, res) {
      api.remoteDbs.getCollection (
        boxName,
        req.params.name,
        req.params.collection,
        boxName,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.error({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.findOne(req.body || {}, function (err, doc) {
            if (err) {
              console.error({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            if (!doc) {
              res.status(404);
              return res.end();
            }

            return res.json(doc);
          });
        });
    });

    app.post('/api/dbs/:name/:collection/insert', function (req, res) {
      api.remoteDbs.getCollection (
        boxName,
        req.params.name,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.insert(req.body, { w: 1 }, function (err, newDoc) {
            if (err) {
              console.log({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            return res.json(newDoc);
          }, req.headers['box.browserkey']);
        });
    });
    
    app.get('/api/users', function (req, res) {
      api.users.listBoxUsers(boxName, function (err, users) {
        for (var i = 0; i < users.length; i++) {
          delete users[i]._id;
          users[i].role = users[i].roles[boxName];
          delete users[i].roles;
        }

        res.json(users);
      });
    });
    
    app.post('/api/dbs/:name/:collection/update', function (req, res) {
      api.remoteDbs.getCollection (
        boxName,
        req.params.name,
        req.params.collection,
        function (err, collection){
          if (err) {
            console.log({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.update(req.body.predicate, req.body.replacement, { w: 1, multi: true }, function (err, newDoc) {
            if (err) {
              console.log({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            res.status(200);
            return res.end();
          }, req.headers['box.browserkey']);
        });
    });
    
    app.post('/api/dbs/:name/:collection/remove', function (req, res) {
      api.remoteDbs.getCollection (
        boxName,
        req.params.name,
        req.params.collection,
        function (err, collection) {
          if (err) {
            console.error({ box: boxName, url: req.params.url, err: err});
            res.status(418);
            return res.end();
          }

          collection.remove(req.body, { w: 1 }, function (err) {
            if (err) {
              console.error({ box: boxName, url: req.params.url, err: err});
              res.status(418);
              return res.end();
            }

            res.status(200);
            return res.end();
          }, req.headers['box.browserkey']);
      });
    });

    app.route('/api/workflows')
    .get(function (req, res) {
      api.workflows.listRunningWorkflows(boxName, function (err, workflows){
        if (err) {
          console.error(err);
          res.status(418);
          return res.end();
        }

        var response = [];

        for (var w in workflows) {
          response.push(workflows[w])
        };

        return res.json(response);
      });
    });
    
    function findAsset(url, res, next) {
      if (!assetsMap[url]) return next();
      
      var packageName = assetsMap[url].packageName,
          path = assetsMap[url].path;
          
      api.packages.getAsset(packageName, path, function (err, buffer) {
        if (err) { res.status(418); return res.end('Not found: ' + JSON.stringify(path)); }
        
        res.status(200);
        
        api.packages.getAssetMetadata(packageName, path, function (err, metadata) {
          if (metadata.use == 'style') {
            res.set({
              'Content-Type': 'text/css'
            });
          } else if (metadata.use == 'script') {
            res.set({
              'Content-Type': 'application/javascript'
            });
          }
                
          res.end(buffer);
        });
      });
    }
    
    app.get('/api/ping', function (req, res) {
      res.status(200);
      res.end();
    });
    
    app.get('/', function (req, res, next) {
      return findAsset('/index.html', res, next);
    });
    var assetsMap = {};
        
    app.use(function (req, res, next) {
      if (!assetsMap[req.url]) return next();
      
      findAsset(req.url, res, next);
    });
    
    api.packages.getActivePackagesWithDependencies(boxName, function(err, packages) {
      async.eachSeries(packages, function (dep, callback) {
        api.packages.getPackageType(dep, function (err, packageType) {
          if (packageType === 'global') return callback();
          
          api.packages.listAssets(dep, function (err, assets) {
            if (err) return callback (err);
          
            for (var i = 0; i < assets.length; i++) {
              assetsMap['/' + assets[i]] = { path: assets[i], packageName: dep};
            }
            
            callback();
          });
        });
      }, function (err) {
        if (err) return console.error(err);

        app.use(express.static(__dirname + '/public'));
        
        return callback(null, app);
      });
    });
  };
};
