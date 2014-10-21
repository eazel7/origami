'use strict';

angular.module('boxes3.manager')
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
  }
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
});
