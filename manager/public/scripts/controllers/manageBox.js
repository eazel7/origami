'use strict';

angular.module('boxes3.manager')
.controller("BoxUsageCtrl", function ($scope, $http) {
  $scope.options = {
    chart: {
      type: 'lineChart',
      height: 300,
      width: 700,
      margin : {
        top: 20,
        right: 20,
        bottom: 40,
        left: 55
      },
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
          return String(Number(d.toFixed(0)));
        }
      }
    }
  };
  
  $scope.data = [{
    values: [],
    key: "Operations"
  }];
  
  var oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  oneWeekAgo.setHours(0,0,0,0);
    
  var boxName = "sudden-service";
  $http.post("/api/box/" + encodeURIComponent(boxName) + "/stats/usage", {
    from: oneWeekAgo,
    to: new Date().valueOf()
  })
  .success(function (data) {
    var values = $scope.data[0].values;
    
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
.controller("BoxAdministratorsCtrl", function ($scope, $stateParams, UsersApi) {
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
.controller("BoxUsersCtrl", function ($scope, $stateParams, UsersApi) {
  UsersApi.getAllUsers()
  .then(function (users) {
    $scope.users = users;
  });
})
.controller("BoxUserDetailsCtrl", function ($scope, UsersApi) {
  $scope.$watch('alias', function (alias) {
    UsersApi.getUser(alias)
    .then(function (profile) {
      $scope.profile = profile;
    });
  });
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
  controller: function ($scope, BoxesApi, boxInfo, configInfo, $stateParams, UsersApi, $http) {
      var boxName = $stateParams.boxName;
      
      function refreshUsers() {
        UsersApi.getBoxUsers(boxName)
        .then(function (users) {
          $scope.boxUsers = users;
        });
      }
      
      refreshUsers();
      
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
      
      BoxesApi
      .listBoxUsers(boxName)
      .then(function (users) {
        $scope.boxUsers = users;
      });
      
      $scope.box = boxInfo;
      $scope.boxName = boxName;
      $scope.boxUrl = function (box) {
        return configInfo.prefix + boxName + '/#/';
      };
      
      $http.get('/api/box/' + boxName + '/access')
      .success(function (access) {
        $scope.mongoUrl = function (showPassword) {
          return 'mongodb://readUser' + (!showPassword ? ':' + access.password : '') +'@' + access.server + (access.port && access.port === 27017 ? ':' + access.port.toString() : '') + '/' + boxName;
        };
      });
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
});
