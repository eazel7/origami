'use strict';

angular.module('boxes3.manager')
.controller("MigrationCtrl", function ($scope, $upload, $stateParams, $location) {
  $scope.import = function($files) {
    if ($files.length > 1) return;
    
    for (var i = 0; i < $files.length; i++) {
      var file = $files[i];
      var path = file.name;
      
      $scope.upload = $upload.upload({
        url: 'api/box/' + encodeURIComponent($stateParams.boxName) + '/import',
        method: 'POST',
        data: {},
        file: file
      }).then(function () {
        $location.reload();
      });
    }
  };
})
.controller("BoxUsageCtrl", function ($scope, $http, $stateParams) {
  $scope.options = {
    chart: {
      type: 'lineChart',
      height: 300,
      width: 1040,
      margin : {
        top: 20,
        right: 20,
        bottom: 40,
        left: 55
      },
      useInteractiveGuideline: true,
      x: function(d){ 
        return d.x; 
      },
      y: function(d){ 
        return d.y; 
      },
      xAxis: {
        tickFormat: function (d) {
          return d3.time.format('%d/%m/%Y')(new Date(d));
        }
      },
      yAxis: {
        tickFormat: function(d){
          return Number(d).toFixed(0);
        }
      }
    }
  };
  
  $scope.operations = [{
    values: [],
    key: "Operations",
    color: "#0f0"
  },{
    values: [],
    key: "Folds",
    color: "#00f"
  }];
  $scope.errors = [{
    values: [],
    key: "Errors",
    color: "#f00"
  }];
  
  var oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  oneWeekAgo.setHours(0,0,0,0);
    
  var boxName = $stateParams.boxName;
  $http.post("/api/box/" + encodeURIComponent(boxName) + "/stats/usage", JSON.stringify({
    from: oneWeekAgo,
    to: new Date().valueOf(),
    collection: {
      $nin: ['_graphs', '_views']
    }
  }))
  .success(function (data) {
    var values = $scope.operations[0].values;
    
    for (var i = 0; i < data.length; i++) {
      values.push({
        x: data[i].date,
        y: new Date(data[i].value)
      });
    }
  });
  $http.post("/api/box/" + encodeURIComponent(boxName) + "/stats/usage", JSON.stringify({
    from: oneWeekAgo,
    to: new Date().valueOf(),
    collection: {
      $in: ['_graphs', '_views']
    }
  }), {
    
  })
  .success(function (data) {
    var values = $scope.operations[1].values;
    
    for (var i = 0; i < data.length; i++) {
      values.push({
        x: data[i].date,
        y: new Date(data[i].value)
      });
    }
  });
  $http.post("/api/box/" + encodeURIComponent(boxName) + "/stats/errors", {
    from: oneWeekAgo,
    to: new Date().valueOf()
  })
  .success(function (data) {
    var values = $scope.errors[0].values;
    
    for (var i = 0; i < data.length; i++) {
      values.push({
        x: data[i].date,
        y: new Date(data[i].value)
      });
    }
  });
})
.controller("CreateCollectionCtrl", function ($scope, CollectionApi) {
  $scope.createCollection = function () {
    CollectionApi.createCollection($scope.boxName, $scope.collection.name)
    .then(function (collection) {
      $scope.collections.push($scope.collection.name);
      $scope.collection = {};
    });
  };
})
.controller("CollectionObjectsCtrl", function ($scope, CollectionApi, $stateParams) {
  $scope.queryCount = function (collection) {
    CollectionApi.count($stateParams.boxName, collection.name, {})
    .then(function (count) {
      collection.count = count;
    });
  };
})
.controller("BoxAdministratorsCtrl", function ($scope, $stateParams, UsersApi, CollectionApi) {
  $scope.revoke = function (user) {
    $scope.box.info.admins.splice($scope.box.info.admins.indexOf(user), 1);
    $scope.$emit('changes');
  };
  UsersApi.getAllUsers()
  .then(function (users) {
    $scope.users = users;
  });
  
  $scope.getUser = function(user) {
    if (!$scope.users) return;
    for (var i = 0; i < $scope.users.length; i++) {
      if ($scope.users[i]._id == user) {
        return $scope.users[i];
      }
    }
  };
  $scope.userFormatter = function (user) {
    var u = $scope.getUser(user);
    if (u) {
      return u.displayName;
    }
  }
  $scope.$watch('newAdmin', function(newAdmin) {
    if ($scope.newAdmin && $scope.box.info.admins.indexOf(newAdmin) === -1) {
      $scope.box.info.admins.push(newAdmin);
      $scope.$emit('changes');
      $scope.newAdmin = '';
    }
  });
})
.controller("BoxCollectionsCtrl", function ($scope, $state, $stateParams, CollectionApi) {
  CollectionApi.getCollections($stateParams.boxName)
  .then(function (collections) {
    $scope.collections = collections;
  });
  $scope.exploreData =  function (collection) {
    $state.go('^.exploreData', { boxName: $stateParams.boxName, collectionName: collection.name });
  };
  $scope.isSystem = function (c) {
    return c[0] !== '_';
  };
})
.controller("RemoveCollecitonCtrl", function ($scope, $state, $stateParams, CollectionApi) {
  CollectionApi.count($stateParams.boxName, $scope.collection, {})
  .then(function (count) {
    $scope.count = count;
  });
  $scope.removeCollection = function () {
    CollectionApi.remove($stateParams.boxName, $scope.collection, {})
    .then(function () {
      CollectionApi.count($stateParams.boxName, $scope.collection, {})
      .then(function (count) {
        $scope.count = count;
      });
    });
  };
})
.controller("BoxUsersCtrl", function ($scope, $stateParams, UsersApi, CollectionApi) {
  var boxName = $stateParams.boxName;

  function refresh() {
    UsersApi.getAllUsers()
    .then(function (users) {
      $scope.users = users;
    });
  };
  
  CollectionApi
  .getCollections(boxName)
  .then(function (collections) {
    $scope.collections = collections;
  });
  
  $scope.notSystemCollection = function (c) {
    return c && c[0] !== '_';
  }
  
  refresh();
  
  $scope.$on('refresh-users', refresh);
})
.controller("BoxUserDetailsCtrl", function ($scope, UsersApi, $stateParams) {
  $scope.$watch('alias', function (alias) {
    UsersApi.getUser(alias)
    .then(function (profile) {
      $scope.profile = profile;
    });
  });
  
  $scope.setNewRole = function (alias, newRole) {
    UsersApi.enableUser($stateParams.boxName, alias, newRole)
    .then(function () {
      $scope.$emit('refresh-users');
    });
  };
})
.controller("SearchUserCtrl", function ($scope) {

})
.config(function ($stateProvider) {
$stateProvider.state('manageBox', {
  url: '/manage-box/:boxName',
  templateUrl: 'views/partials/manageBox.html',
  resolve: {
    boxInfo: ["BoxesApi", "$stateParams", function (BoxesApi, $stateParams) {
      return BoxesApi.getBoxInfo($stateParams.boxName);
    }]
  },
  controller: function ($scope, BoxesApi, boxInfo, configInfo, $stateParams, UsersApi, $http, PermissionsApi, WorkflowsApi) {
      var boxName = $stateParams.boxName;
      
      function refreshUsers() {
        UsersApi.getBoxUsers(boxName)
        .then(function (users) {
          $scope.boxUsers = users;
        });
      }
      
  
      function refreshGroups() {
        PermissionsApi
        .listPermissionGroups(boxName)
        .then(function (groups) {
          $scope.groups = groups;
        });
      }
      refreshGroups();
      
      refreshUsers();
      
      function refreshEffectivePermissions() {
        if ($scope.editingGroupsOfUser) {
          WorkflowsApi
          .listGraphs($stateParams.boxName)
          .then(function (graphs) {
            $scope.workflows = graphs;
          });
        
          PermissionsApi.getEffectivePermissions($stateParams.boxName, $scope.editingGroupsOfUser)
          .then(function (effective) {
            $scope.effectivePermissions = effective;
          });
        }
      }
      
      $scope.$on('refresh-groups', refreshGroups);
      
      $scope.editGroupsFor = function (alias) {
        $scope.editingGroupsOfUser = alias;
        refreshEffectivePermissions();
      };
      
      $scope.toggleUserGroup = function (alias, pg) {
        if (pg.users.indexOf(alias) > -1) PermissionsApi.removeUserFromGroup($stateParams.boxName, pg._id, alias).then(refreshGroups).then(refreshEffectivePermissions);
        else PermissionsApi.addUserToGroup($stateParams.boxName, pg._id, alias).then(refreshGroups).then(refreshEffectivePermissions);
      };
      
      $scope.$on('refresh-users', refreshUsers);
      
      $scope.addUser = function (user) {
        UsersApi.enableUser(boxName, user)
        .then(refreshUsers);
      };
      
      $scope.$on('changes', function () {
        $scope.changes = true;
      });
      BoxesApi.getBoxInfo(boxName)
      .then(function (info) {
        $scope.info = info;
      });
      $scope.save = function () {
        BoxesApi.saveBoxInfo(boxName, $scope.info)
        .then(function () {
          $scope.changes = false;
        });
      };
      
      $scope.box = boxInfo;
      $scope.boxName = boxName;
      $scope.boxUrl = function (box) {
        return configInfo.prefix + boxName + '/#/';
      };
      
//      $http.get('/api/box/' + boxName + '/access')
//      .success(function (access) {
//        $scope.mongoUrl = function (showPassword) {
//          return 'mongodb://readUser' + (!showPassword ? ':' + access.password : '') +'@' + access.server + (access.port && access.port === 27017 ? ':' + access.port.toString() : '') + '/' + boxName;
//        };
//      });
    }
  });
})
.controller("BoxRemoteDbsCtrl", function ($scope, BoxesApi, $stateParams) {
    var boxName = $stateParams.boxName;
    
    function refreshDbs() {
      BoxesApi.listRemoteDbs(boxName)
      .then(function (dbs) {
        $scope.remoteDbs = dbs;
      });
    }
    
    refreshDbs();
    
    $scope.remote = {
      name: "",
      url: ""
    };
    
    $scope.setRemote = function () {
      BoxesApi.setRemoteDb(boxName, $scope.remote.name, $scope.remote.url)
      .then(refreshDbs)
      .then(function () {
        $scope.remote = {
          name: "",
          url: ""
        };
      })
    };
    
    $scope.unsetRemote = function (remote) {
      BoxesApi.unsetRemoteDb(boxName, remote.name)
      .then(refreshDbs);
    }
})
.controller("BoxPermissionsCtrl", function ($scope, $stateParams, PermissionsApi, CollectionApi, WorkflowsApi) {
  var boxName = $stateParams.boxName;
  
  $scope.createPermissionsGroup = function () {
    if (!$scope.newGroup && $scope.newGroup.name) return;
    
    PermissionsApi
    .createPermissionGroup(boxName, $scope.newGroup.name)
    .then(function () {
      $scope.newGroup = {};
    })
    .then(function () {
      $scope.$broadcast('refresh-permission-groups');
    });
  };
  
  WorkflowsApi
  .listGraphs(boxName)
  .then(function (graphs) {
    $scope.workflows = graphs;
  });
  
  CollectionApi
  .getCollections(boxName)
  .then(function (collections) {
    $scope.collections = collections;
  });
  
  $scope.edit = function (pg) {
    $scope.editing = angular.copy(pg);
    
    if (!$scope.editing.permissions) $scope.editing.permissions = {};
    
    if (!$scope.editing.permissions.collections) $scope.editing.permissions.collections = {};
    
    angular.forEach($scope.collections, function (c) {
      if (!$scope.editing.permissions.collections[c]) $scope.editing.permissions.collections[c] = {};
    });
    
    if (!$scope.editing.permissions.graphs) $scope.editing.permissions.graphs = {};
    
    angular.forEach($scope.workflows, function (g) {
      if (!$scope.editing.permissions.graphs[g._id]) $scope.editing.permissions.graphs[g._id] = {};
    });
    
    if (!$scope.editing.permissions.groups) $scope.editing.permissions.groups = {};
    
    angular.forEach($scope.groups, function (g) {
      if (!$scope.editing.permissions.groups[g._id] && g._id !== $scope.editing._id) $scope.editing.permissions.groups[g._id] = {};
    });
    
    if (!$scope.editing.permissions.system) $scope.editing.permissions.system = {};
  };
  
  $scope.saveGroup = function () {
    if (!$scope.editing) return;
    
    PermissionsApi.modifyPermissionGroup(boxName, $scope.editing._id, $scope.editing.permissions)
    .then(function () {
      $scope.editing = null;
    })
    .then(function () {
      $scope.$broadcast('refresh-permission-groups');
    });
  };
  
  $scope.deleteGroup = function () {
    if (!$scope.editing) return;
    
    PermissionsApi.deletePermissionGroup(boxName, $scope.editing._id)
    .then(function () {
      $scope.editing = null;
    })
    .then(refresh);
  };
  
  $scope.notSystemCollection = function (c) {
    return c && c[0] !== '_';
  };
});
