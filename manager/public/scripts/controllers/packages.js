angular.module("boxes3.manager")
.config(function ($stateProvider) {
  $stateProvider.state('packages', {
    url: '/packages',
    templateUrl: 'views/partials/packages.html',
    resolve: {
    },
    controller: function ($scope, $http, $upload, $q) {    
      function refreshPackages() {
        $http.get('/api/packages')
        .success(function (data) {
          $scope.packages = data;
        });
      };
      
      refreshPackages();
      
      $scope.importPackages = function ($files) {
        var proms = [];
        for (var i = 0; i < $files.length; i++) {
          var file = $files[i];
          var path = file.name;

          proms.push($upload.upload({
            url: 'api/packages/import',
            method: 'POST',
            data: {},
            file: file
          }));
        }
        
        $q.all(proms).then(refreshPackages);
      };
      
      $scope.validName = function (name) {
        return $scope.packages.indexOf(name) === -1;
      };
      
      $scope.createNewPackage = function () {
        $scope.newPackage = {};
      };
      $scope.saveNewPackage = function () {
        if(!$scope.validName($scope.newPackage.name)) return;
        
        $http.post('/api/packages/' + $scope.newPackage.name + '/create',{})
        .success(function () {
          $scope.newPackage = undefined;
          refreshPackages();
        });
      };
      $scope.cancelNewPackage = function () {
        $scope.newPackage = undefined;
      };
    }
  });
  $stateProvider.state('edit-asset', {
    url: "/edit-asset/:packageName/{path:.*}",
    templateUrl: 'views/partials/edit-asset.html',
    controller: function ($scope, $stateParams, $http, $upload) {
      
      var setupAce = function (editor) {
        ace = editor;
        editor.setFontSize(20);
        editor.commands.addCommand({
            name: 'saveFile',
            bindKey: {
            win: 'Ctrl-S',
            mac: 'Command-S',
            sender: 'editor|cli'
          },
          exec: function(env, args, request) {
            $scope.save();
          }
        });
      };
      
      $scope.aceOptions = {theme: 'twilight', showGutter: true, useWrapMode: true, onLoad: setupAce};
      var ace;
    
      $scope.save = function () {
        var data = {};
        
        data[$stateParams.path] = $scope.source;
        
        $upload.upload({
            url: 'api/packages/' + $stateParams.packageName + '/assets/' + $stateParams.path,
            method: 'POST',
            data: data
        });
      };
      
      $http.get('/api/packages/' + $stateParams.packageName + '/assets/' + encodeURIComponent($stateParams.path))
      .success(function (data) {
        $scope.source = data;
        
        $http.get('/api/packages/' + $stateParams.packageName + '/asset-metadata/' + encodeURIComponent($stateParams.path))
        .success(function (metadata) {
          debugger;
          if (metadata.use === 'script' || $stateParams.path.indexOf(".js") > -1) return $scope.aceOptions.mode = "javascript";
          if (metadata.use === 'style') return $scope.aceOptions.mode = "css";
          if ($stateParams.path.lastIndexOf(".html") >= 0) return $scope.aceOptions.mode = "html";
        });
      });
    }
  });
  $stateProvider.state('package-details', {
    url: '/packages/:packageName',
    templateUrl: 'views/partials/package-details.html',
    resolve: {
    },
    controller: function ($scope, $http, $stateParams, $upload, $location, $q) {
      $http.get('/api/packages/' + encodeURIComponent($stateParams.packageName) + '/info')
      .success(function (info) {
        $scope.packageInfo = info || {version: '', description: ''};
      })
      .error(function () {
        $scope.packageInfo = {
          version: '',
          description: ''
        };
      });
      
      $scope.savePackageInfo = function () {
        $http.put('/api/packages/' + encodeURIComponent($stateParams.packageName) + '/info', $scope.packageInfo || {});
      };
      
      $scope.canBumpVersion = function (version) {
        if (!version) return true;
      
        var split = (version || '').split('.');
        
        if (!split.length === 1 && split[0] === '') return true;
        
        for (var i = 0; i < split.length; i++) {
          if (String(Number(split[i])) !== split[i]) return false;
        }
        
        return true;
      };
      
      $scope.bumpVersion = function (version) {
        var split = (version || '').split('.');
        
        if (!split.length || !version) return '1';
        
        if (split.length == 1) return String(Number(version) + 1);
        
        return split.slice(0, split.length - 1) + '.' + (String(Number(split.slice(-1)[0]) + 1));
      };
    
      $scope.createAsset = function () {
        var path = Array.prototype.constructor.apply(this, arguments).join('/');
        
        var defer = $q.defer();
      
        $http.post("/api/packages/" + encodeURIComponent($stateParams.packageName) + "/new-blank-asset/" + encodeURIComponent(path), {})
        .success(function () {
          $scope.showCreateNewFile = false;
          
          defer.resolve();
        })
        .error(defer.reject)
        .then(refreshAssets);
        
        return defer.promise;
      };
      
      $scope.package = $stateParams.packageName;
      
      $scope.createNewFile = function () {
        $scope.showCreateNew = true;
      };
      
      function refreshOtherPackages() {
        return $http.get('/api/packages')
        .success(function (packages) {
          $scope.otherPackages = packages;
        });
      }
      
      function refreshDependencies() {
        return $http.get('/api/packages/' + encodeURIComponent($stateParams.packageName) + '/dependencies')
        .success(function (packages) {
          $scope.dependencies = packages || [];
        });
      }
      
      $q.all([refreshDependencies(), refreshOtherPackages()])
      .then(function () {
        $scope.dependsUpon = function (p) {
          return $scope.dependencies.indexOf(p) >= 0;
        };
        
        $scope.switchDependency = function (p) {
          var newDeps = angular.copy($scope.dependencies);

          if ($scope.dependsUpon(p)) {          
            newDeps.splice(newDeps.indexOf(p), 1);
          } else {
            newDeps.push(p);
          }

          $http.post('/api/packages/' + encodeURIComponent($stateParams.packageName) + '/dependencies', newDeps)
          .success(refreshDependencies);
        };
      });
      
      function refreshPackageType () {
        $http.get('/api/packages/' + encodeURIComponent($stateParams.packageName) + '/package-type')
        .success(function (res) {
          $scope.packageType = res ? res.type || 'globlal' : 'global';
        });
      }
      
      refreshPackageType();
      
      $scope.changePackageType = function (packageName, newType) {
        $http.post('/api/packages/' + encodeURIComponent($stateParams.packageName) + '/package-type', { type: newType || 'global' })
        .success(refreshPackageType);
      }
      
      function refreshFolders() {
        $http.get('/api/packages/' + encodeURIComponent($stateParams.packageName) + '/folders')
        .success(function (folders) {
          $scope.folders = folders;
        });
      }
      
      refreshFolders();
      
      $scope.$on('refresh-folders', refreshFolders);
      
      function refreshAssets() {
        $http.get('/api/packages/' + $scope.package + '/assets')
        .success(function (data) {
          $scope.assets = data;
        });
      }
      
      $scope.selectFolder = function (f) {
        $scope.selected = null;
        $scope.folderSelected = f;
      };
      
      $scope.selectAsset = function (a) {
        $scope.selected = a;
        
        $http
        .get('/api/packages/' + encodeURIComponent($scope.package)  +'/asset-metadata/' + encodeURIComponent(a))
        .success(function (metadata) {
          $scope.selectedMetadata = metadata;
        });
      };
      
      $scope.deleteFolder = function (f) {
        $http.post('/api/packages/' + encodeURIComponent($scope.package) + '/remove-folder/' + encodeURIComponent(f))
        .success(function () {
          refreshFolders();
          refreshAssets();
        });
      };
      
      $scope.inFolder = function (folder) {
        return function (file) {
          if (!folder) return file.indexOf('/') === -1;
          
          return file.indexOf(folder + '/') === 0;
        };
      };
      
      $scope.removePackage = function () {
        $http.post('/api/packages/' + $scope.package + '/delete', {})
        .success(function () {
          $location.url('/packages');
        });
      };
      
      refreshAssets();
      
      $scope.exportPacakge = function () {
        $window.open('/api/packages/' + $scope.package + '/export', '_blank');
      };
      
      $scope.replaceFileSelect = function (a) {
        return function($files) {
          for (var i = 0; i < $files.length; i++) {
            var file = $files[i];
            $scope.upload = $upload.upload({
              url: 'api/packages/' + $scope.package + '/assets/' + a,
              method: 'POST',
              data: {},
              file: file
            }).then(refreshAssets);
          }
        }
      }
      
      $scope.onFileSelect = function($files, folder) {
      
        for (var i = 0; i < $files.length; i++) {
          var file = $files[i];
          var path = file.name;
          if (folder) path = folder + '/' + path;
          $scope.upload = $upload.upload({
            url: 'api/packages/' + $scope.package + '/assets/' + path,
            method: 'POST',
            data: {},
            file: file
          }).then(refreshAssets);
        }
      };
      
      $scope.switchMetadata = function (asset, metadata, use) {
        if (!metadata) metadata = {};
        metadata.use = metadata.use !== use ? use : null;
        
        $http
        .post('/api/packages/' + encodeURIComponent($scope.package)  +'/asset-metadata/' + encodeURIComponent(asset), metadata)
        .success(function (metadata) {
          $http
          .get('/api/packages/' + encodeURIComponent($scope.package)  +'/asset-metadata/' + encodeURIComponent(asset))
          .success(function (metadata) {
            $scope.selectedMetadata = metadata;
          });
        });
      };
      
      $scope.unzipAsset = function (asset) {
        $http.post('/api/packages/' + encodeURIComponent($scope.package)  +'/unzip-asset/' + encodeURIComponent(asset), {})
        .success(function () {
          $scope.selected = null;
          refreshAssets();
        });
      };
      
      $scope.removeAsset = function (asset) {
        $http
        .post('/api/packages/' + encodeURIComponent($scope.package)  +'/remove-asset/' + encodeURIComponent(asset), {})
        .success(function () {
          $scope.selected = null;
          refreshAssets();
        });
      };
    }
  });
})
.controller("BoxPackagesCtrl", function ($scope, $http, $stateParams) {
  var boxName = $stateParams.boxName;
  
  $http.get('/api/packages')
  .success(function (packages) {
    $scope.packages = packages;
  });
  
  function refreshActive() {
    $http.get('/api/box/' + encodeURIComponent($stateParams.boxName) + '/packages')
    .success(function(packages) {
      $scope.activePackages = packages;
      
      $http.get('/api/box/' + encodeURIComponent($stateParams.boxName) + '/packagesWithDeps')
      .success(function(dependencies) {
        $scope.dependencies = dependencies;
      });
    });
  }
  
  refreshActive();
  
  $scope.isActive = function (p) {
    return $scope.activePackages.indexOf(p) !== -1;
  };

  $scope.isNotActive = function (p) {
    return !$scope.isActive(p);
  };
  
  $scope.isDependency = function (p) {
    return $scope.dependencies !== undefined && !$scope.isActive(p) && $scope.dependencies.indexOf(p) >= 0;
  };
  
  $scope.packagePriority = function (p) {
    return $scope.activePackages.indexOf(p) + 1;
  };
  
  $scope.priorityUp = function (p, $event) {
    $event.stopPropagation();
    
    var index = $scope.activePackages.indexOf(p);
    if (index == 0) return;
    
    var active = angular.copy($scope.activePackages);
    
    active[index] = active[index - 1];
    active[index - 1] = p;
    
    $http
    .post('/api/box/' + encodeURIComponent($stateParams.boxName) + '/packages/resort', active)
    .success(refreshActive);
  };
  
  $scope.priorityDown = function (p, $event) {
    $event.stopPropagation();
    
    var active = angular.copy($scope.activePackages);
    
    var index = active.indexOf(p);
    if (index == (active.length - 1)) return;
    
    active[index] = active[index + 1];
    active[index + 1] = p;
    
    $http
    .post('/api/box/' + encodeURIComponent($stateParams.boxName) + '/packages/resort', active)
    .success(refreshActive);
  };
  
  $scope.switchPackage = function (p) {
    if ($scope.isActive(p)) {
      $http
      .post('/api/box/' + encodeURIComponent($stateParams.boxName) + '/packages/' + encodeURIComponent(p) + '/deactivate')
      .success(refreshActive);
    } else {
      $http
      .post('/api/box/' + encodeURIComponent($stateParams.boxName) + '/packages/' + encodeURIComponent(p) + '/activate')
      .success(refreshActive);
    }
  };
})
.controller("PackageScriptsCtrl", function ($scope, $stateParams, $http, arrayMove) {
  var package = $stateParams.packageName;
  
  function refreshScripts() {
    $http.get('/api/packages/' + encodeURIComponent(package) + '/scripts')
    .success(function (scripts) {
      $scope.scripts = scripts;
    });
  }
  
  function save(scripts) {
    $http.post('/api/packages/' + encodeURIComponent(package) + '/scripts', scripts)
    .success(refreshScripts);
  }
  
  $scope.moveUp = function (s) {
    var scripts = angular.copy($scope.scripts);
    arrayMove(scripts, scripts.indexOf(s), scripts.indexOf(s) - 1);
    save(scripts);
  };
  $scope.moveDown = function (s) {
    var scripts = angular.copy($scope.scripts);
    arrayMove(scripts, scripts.indexOf(s), scripts.indexOf(s) + 1);
    save(scripts);
  };
  
  $scope.refreshScripts = refreshScripts;
  
  refreshScripts();
})
.value("arrayMove", function (array, old_index, new_index) {
  while (old_index < 0) {
      old_index += array.length;
  }
  while (new_index < 0) {
      new_index += array.length;
  }
  if (new_index >= array.length) {
    var k = new_index - array.length;
    while ((k--) + 1) {
      array.push(undefined);
    }
  }
  array.splice(new_index, 0, array.splice(old_index, 1)[0]);
  return array; // for testing purposes
})
.controller("PackageStylesCtrl", function ($scope, $stateParams, $http, arrayMove) {
  var package = $stateParams.packageName;
  
  function refreshStyles() {
    $http.get('/api/packages/' + encodeURIComponent(package) + '/styles')
    .success(function (styles) {
      $scope.styles = styles;
    });
  }
  
  function save(styles) {
    $http.post('/api/packages/' + encodeURIComponent(package) + '/styles', styles)
    .success(refreshStyles);
  }
  
  $scope.moveUp = function (s) {
    var styles = angular.copy($scope.styles);
    arrayMove(styles, styles.indexOf(s), styles.indexOf(s) - 1);
    save(styles);
  };
  $scope.moveDown = function (s) {
    var styles = angular.copy($scope.styles);
    arrayMove(styles, styles.indexOf(s), styles.indexOf(s) + 1);
    save(styles);
  };
  
  $scope.refreshStyles = refreshStyles;
  
  refreshStyles();
})
.controller("AngularModulesCtrl", function ($scope, $stateParams, $http, arrayMove) {
  var package = $stateParams.packageName;
  
  function refreshModules() {
    $http.get('/api/packages/' + encodeURIComponent(package) + '/angular-modules')
    .success(function (angularModules) {
      if (!angular.isArray(angularModules)) angularModules = [];
      $scope.angularModules = angularModules;
    });
  }

  $scope.addModule = function () {
    var modules = angular.copy($scope.angularModules || []);
    modules.push($scope.newModule);
    
    $http.post('/api/packages/' + encodeURIComponent(package) + '/angular-modules', modules)
    .success(function () {
      $scope.newModule = '';
      refreshModules();
    });
  };
  
  $scope.remove = function (module) {
    var modules = angular.copy($scope.modules);
    
    $http.post('/api/packages/' + encodeURIComponent(package) + '/angular-modules', modules)
    .success(function () {
      refreshModules();
    });
  };
  
  $scope.refreshModules = refreshModules;
  
  refreshModules();
})
.controller("PackageRowCtrl", function ($scope, $http) {
  $scope.$watch('package', function (p) {
    if (!p) return $scope.packageInfo = null;
    $http.get('/api/packages/' + encodeURIComponent(p) + '/info')
    .success(function (info) {
      $scope.info = info;
    });
  });
})
.controller("CreateFolderCtrl", function ($scope, $stateParams, $http) {
  $scope.createFolder = function (folderName) {
    $http
    .post('/api/packages/' + encodeURIComponent($stateParams.packageName) + '/create-folder/' + encodeURIComponent(folderName),
    {})
    .success(function () {
      $scope.showCreate = false;
      $scope.$emit('refresh-folders');
    });
  };
});
