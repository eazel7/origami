module.exports = function () {
  return {
    index: function (req, res) {
      res.render('index');
    },
    getMasterUser: function (req, res) {
      var api = req.api;
      
      api.users.getMasterUser(function (err, value) {
        console.log(value);
        res.json(value);
      });
    },
    importAllPackages: function (req, res) {
      var api = req.api;
      
      var form = new formidable.IncomingForm();
      
      form.parse(req, function (err, fields, files) {
        if (Object.keys(files).length !== 1) {
          console.error('Just one file expected');
          
          res.status(418);
          return res.end();
        }
        
        async.each(files, function (fileEntry, callback) {
          var file = files[fileEntry],
              filename = req.params.path + (req.params[0] ? req.params[0] : '');
              
          var bytes = fs.readFileSync(file.path);
          
          api.packages.importPackages(bytes, callback);
        }, function (err) {
          if (err) console.error(err);
          res.status(err ? 418 : 200);
          res.end();        
        });
      });
    },
    exportAllPackages: function (req, res) {
      var api = req.api;
      
      api.packages.exportAllPackages(function (err, exported) {
        if (err) {
          console.error(err);
          
          res.status(418);
          return res.end();
        }

        res.set('Content-Type', 'application/zip, application/octet-stream');
        res.set('Content-Disposition', 'attachment; filename=packages-' + String(new Date().valueOf()) + '.zip');
        res.send(exported);
        res.end();
      });
    },
    importAllBoxes: function (req, res) {
      var api = req.api;
      
      var form = new formidable.IncomingForm();
      
      form.parse(req, function (err, fields, files) {
        if (Object.keys(files).length !== 1) {
          console.error('Just one file expected');
          
          res.status(418);
          return res.end();
        }
        
        async.each(files, function (fileEntry, callback) {
          var file = files[fileEntry],
              filename = req.params.path + (req.params[0] ? req.params[0] : '');
              
          var bytes = fs.readFileSync(file.path);
          
          api.boxes.importBoxes(bytes, callback);
        }, function (err) {
          if (err) console.error(err);
          res.status(err ? 418 : 200);
          res.end();        
        });
      });
    },
    exportAllBoxes: function (req, res) {
      var api = req.api;
      
      api.boxes.exportAllBoxes(function (err, exported) {
        if (err) {
          console.error(err);
          
          res.status(418);
          return res.end();
        }

        res.set('Content-Type', 'application/zip, application/octet-stream');
        res.set('Content-Disposition', 'attachment; filename=boxes-' + String(new Date().valueOf()) + '.zip');
        res.send(exported);
        res.end();
      });
    },
    setMasterUser: function (req, res) {
      api.users.setMasterUser(res.body, function (err) {
        if (err) {
          console.error(err);
          res.status(418);
        } else {
          res.status(200);
        }
        
        res.end();
      });
    },
    randomName: function (req, res) {
      var randomName = require('../api/random-names')();
      return res.end(randomName);
    }
  };
}
