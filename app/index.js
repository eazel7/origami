var manifestDate = String(Date.now()),
    allAssets = require('./allAssets'),
    formidable = require('formidable');

    
function findAsset(req, url, res, next) {
  var api = req.api, assetsMap = req.assetsMap;

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
          'Content-Type': 'application/javascript;charset=utf-8'
        });
      }
            
      res.end(buffer);
    });
  });
}

module.exports = function (boxName, app, callback) {
  var boxApi = require('./boxApiHandlers')(boxName),
      fs = require('fs');
      
  var mmm = require('mmmagic');
  var magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE | mmm.MAGIC_MIME_ENCODING);

  app.use(function (req, res, next) {
    var api = req.api;
    
    api.packages.getActivePackagesWithDependencies(boxName, function(err, packages) {
      var assetsMap = {};
      
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
        if (err) {
          console.error(err);
        }
            
        req.assetsMap = assetsMap;
          
        return next(err);
      });
    });
  });

  app.use(function (req, res, next) {
    var orig = res.send;
    
    res.send = function (body) {
      var self = this, args = arguments;
      
      if (!res.get('Content-Type')) {
        magic.detect(new Buffer(body), function(err, result) {
            res.set('Content-Type', result);
            
            console.log(res.get('Content-Type'));
            
            orig.apply(self, args);
        });
      } else {
        orig.apply(this, arguments);
      }
    };
    next();
  });
  app.use(function (req, res, next) {
    var orig = res.end;
    
    res.end = function (body) {
      var self = this, args = arguments;
      
      if (body && !res.get('Content-Type')) {
        magic.detect(new Buffer(body), function(err, result) {
            res.set('Content-Type', result);
            
            console.log(res.get('Content-Type'));
            
            orig.apply(self, args);
        });
      } else {
        orig.apply(this, arguments);
      }
    };
    next();
  });

  app.get('/scripts/info.js', function (req, res) {
    var script = 'angular.module(\'box-info\', [])\n' +
                 '.value(\'boxName\', ' + JSON.stringify(boxName) +  ');';

    res.setHeader('Content-Type', 'application/javascript');
    return res.end(script);
  });

  app.get('/html.manifest', function (req, res) {
    var api = req.api;

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
    var api = req.api;

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
    var api = req.api;

    api.boxes.getBox(boxName, function (err, doc) {
      if (err) {
        res.status(418);
        return res.end();
      }
      
      res.json(doc.styles);
    });
  });
  
  app.get('/angular-modules.json', function (req, res) {
    var api = req.api;

    api.boxes.getBox(boxName, function (err, doc) {
      if (err) {
        res.status(418);
        return res.end();
      }
      
      res.json(doc.angularModules || []);
    });
  });
  
  app.get('/api/graphs/componentGallery', function (req, res) {
    var api = req.api;

    api.workflows.listComponents(function (err, gallery) {
      res.json(gallery);
    });
  });
  
  app.get('/api/collections', boxApi.getCollections);
  app.post('/api/collection/:collection/find', boxApi.findInCollection);
  app.post('/api/collection/:collection/count', boxApi.countInCollection);
  app.post('/api/collection/:collection/findOne', boxApi.findOneInCollection);
  app.post('/api/collection/:collection/insert', boxApi.insertInCollection);
  app.post('/api/collection/:collection/update', boxApi.updateInCollection);
  app.post('/api/collection/:collection/remove', boxApi.removeInCollection);

  app.get('/api/queuedSyncOperations/:from', boxApi.getQueuedSyncOps);

  app.get('/api/graphs/list', function () {
    var api = req.api;

    api.workflows.listGraphs(boxName, function (err, graphs){
      res.json(graphs);
    });
  });

  app.post('/api/graphs/save', function () {
    var api = req.api;

    delete req.body._id;

    api.workflows.saveGraph(boxName, req.body, function (err, graphs){
      res.json(graphs);
    });
  });

  app.post('/api/graphs/:graphId', function (req, res) {
    var api = req.api;

    req.body._id = req.params._id;

    api.workflows.saveGraph(boxName, req.body, function (err, graphs){
      res.json(graphs);
    });
  });

  app.get('/api/graphs/:graphId/history', function (req, res) {
    var api = req.api;

    api.workflows.listPastWorkflows(boxName, req.params.graphId, function (err, past){
      res.json(past);
    });
  });

  app.post('/api/graphs/:graphId/start', function (req, res) {
    var api = req.api;

    api.workflows.startWorkflow(boxName, req.params.graphId, req.body || {}, function (err, graphs){
      if (err) {
        res.status(418);
        return res.end();
      }
      res.json(graphs);
    });
  });

  app.post('/api/graphs/:graphId/delete', function (req, res) {
    var api = req.api;

    api.workflows.removeGraph(boxName, req.params.graphId, function (err){
      res.status(err ? 418 : 200);
      return res.end();
    });
  });

  app.post('/api/workflows/:workflowId/stop', function (req, res) {
    var api = req.api;

    api.workflows.stopWorkflow(req.params.workflowId, function (err){
      if (err) console.error(err);

      res.status(err ? 418 : 200);
      return res.end();
    });
  });

  app.get('/api/workflows/:workflowId/output', function (req, res) {
    var api = req.api;

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
    var api = req.api;

    api.workflows.getActiveConnections(req.params.workflowId, function (err, active){
      if (err) {
        console.error(err);
        res.status(418);
        return res.end();
      }
      
      return res.json(active);
    });
  });
  
  app.post('/api/schedules/:id/start', boxApi.startSchedule);
  app.post('/api/schedules/:id/stop', boxApi.stopSchedule);

  app.post('/api/dbs/:name/:collection/find', boxApi.findInRemoteDb);
  app.post('/api/dbs/:name/:collection/count', boxApi.countInRemoteDb);
  app.post('/api/dbs/:name/:collection/findOne', boxApi.findOneInRemoteDb);
  app.post('/api/dbs/:name/:collection/insert', boxApi.insertInRemoteDb);
  app.post('/api/dbs/:name/:collection/update', boxApi.updateInRemoteDb);
  app.post('/api/dbs/:name/:collection/remove', boxApi.removeInRemoteDb);
  
  app.get('/api/users', function (req, res) {
    var api = req.api;

    api.users.listBoxUsers(boxName, function (err, users) {
      for (var i = 0; i < users.length; i++) {
        delete users[i]._id;
        users[i].role = users[i].roles[boxName];
        delete users[i].roles;
      }

      res.json(users);
    });
  });

  app.route('/api/workflows')
  .get(function (req, res) {
    var api = req.api;

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
  
  app.get('/api/ping', function (req, res) {
    res.status(200);
    res.end();
  });
  
  app.post('/api/error', function (req, res) {
    var api = req.api;

    api.collections.getCollection (boxName, "_errors", function (err, collection) {
      if (err) {
        console.error(err);
        res.status(418);
        return res.end();
      }
      
      var error = req.body;
      error.user = req.session.user.alias;
      error.box = boxName;
      
      collection.insert(req.body, function (err) {
        if (err) {
          console.error(err);
          res.status(418);
          return res.end();
        }
        res.status(200);
        res.end();
      });
    });
  });
  
  app.get('/', function (req, res, next) {
    var api = req.api;
    
    return findAsset(req, '/index.html', res, next);
  });
      
  app.use(function (req, res, next) {
    var assetsMap = req.assetsMap, api = req.api;
          
    if (!assetsMap[req.url]) return next();
    
    findAsset(req, req.url, res, next);
  });
  
  app.get('/api/download/:id', function (req, res) {
    var api = req.api;

    api.boxes.serveFile(boxName, req.params.id, function (err, buffer) {
      if (err) {
        console.error(err);
        res.status(418);
        return res.end();
      }
      
      if (!buffer) {
        res.status(404);
        return res.end();
      } else {
        res.setHeader('Cache-Control', 'public, max-age=345600'); // 4 days
        res.setHeader('Expires', new Date(Date.now() + 345600000).toUTCString());

        res.status(200);
        return res.end(buffer);
      }
    });
  });
  app.delete('/api/download/:id', function (req, res) {
    var api = req.api;

    api.boxes.deleteFile(boxName, req.params.id, function (err) {
      if (err) {
        console.error(err);
        res.status(418);
        return res.end();
      }
      
      res.status(200);
      return res.end(buffer);
    });
  });
  app.get('/api/download', function (req, res) {
    var api = req.api;

    api.boxes.listFiles(boxName, function (err, uploads) {
      if (err) {
        console.error(err);
        res.status(418);
        return res.end();
      }
      
      res.json(uploads);
    });
  });
  
  app.use('/api/upload', function (req, res) {
    var api = req.api;

    var form = new formidable.IncomingForm();
    var uploads = [];
    
    form.parse(req, function (err, fields, files) {
      async.eachSeries(Object.keys(files), function (fileEntry, callback) {
        var file = files[fileEntry],
            filename = req.params.path + (req.params[0] ? req.params[0] : ''),
            bytes = fs.readFileSync(file.path);

          api.boxes.uploadFile(boxName, bytes, function (err, res) {
            if (err) return callback (err);
            
            uploads.push(res._id.toString());
            
            callback(null);
          });
      }, function (err) {
        if (err) {
          console.error(err);
          res.status(418);
          return res.end();
        }
          
        async.eachSeries(Object.keys(fields), function (fileEntry, callback) {
          var filename = fileEntry,
              bytes = new Buffer(fields[fileEntry]);

          api.boxes.uploadFile(boxName, bytes, function (err, res) {
            if (err) return callback (err);
            
            uploads.push(res._id.toString());
            
            callback(null);
          });
        }, function (err) {
          if (err) {
            console.error(err);
            res.status(418);
            return res.end();
          }
        
          res.json(uploads);
        });
      });
    });
  });
            
  callback(null, app);
};
