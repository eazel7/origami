'use strict';

angular.module('boxes3.manager', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ngAnimate',
  'mgcrea.ngStrap',
  'ui.bootstrap',
  'ui.utils',
  'angular-bootstrap-select',
  'box.manager.configInfo',
  'angularFileUpload',
  'ui.ace',
  'boxes3.usersapi'
])
.config(function ($stateProvider) {
  $stateProvider.state('requireLogin', {
    templateUrl: 'views/partials/requireLogin.html'
  });
})
.factory("CheckAuth", function ($state, $rootScope, $http) {
  return function (toState, toParams) {
    if (toState.name == 'requireLogin') return;
    
    if (!$rootScope.identiy) {
      $http.get('/api/identity')
      .success(function (identity) {
        $rootScope.identity = identity;
      })
      .error(function () {
        $rootScope.identity = null;

        $state.go("requireLogin", {
          backTo: {
            name: toState,
            params: angular.copy(toParams)
          }
        });
      });
    }
  }
})
.run(function ($rootScope, $state, $stateParams, $http, CheckAuth) {
  $rootScope.state = $state;
  $rootScope.stateParams = $stateParams;
  $rootScope.$on("$stateChangeStart", function (event, toState, toParams) {
    CheckAuth(toState, toParams);
  });
})
.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
  $stateProvider.state('home', {
      url: '/',
      templateUrl: 'views/partials/home.html',
      controller: function ($scope, $window) {
        $scope.clearTempData = function () {
          for (var k in $window.localStorage) {
            delete $window.localStorage[k];
          }
        }
      }
  });
  $stateProvider.state('about', {
      url: '/about',
      templateUrl: 'views/partials/about.html'
  });
  $stateProvider.state('server', {
      url: '/server',
      templateUrl: 'views/partials/server.html'
  });


  $urlRouterProvider.otherwise('/');
})
.controller("Server", function ($scope, UsersApi) {
  UsersApi.getAllUsers().then(function (users) {
    $scope.users = users;
  });
})
.controller("DataTransfer", function ($scope, $q, CollectionApi, ViewsApi) {
  var initialConfig = {
    collections: [],
    selectedCollections: [],
    views: [],
    selectedViews: [],
    workflows: [],
    selectedWorkflows: [],
    canTransfer: false
  };
  
  angular.extend($scope, initialConfig);

  var isCollectionSelected = $scope.isCollectionSelected = function(c) {
    return $scope.selectedCollections.indexOf(c) > -1;
  };
  
  $scope.toggleCollectionSelected = function (c) {
    if (isCollectionSelected(c)) {
      $scope.selectedCollections.splice($scope.selectedCollections.indexOf(c), 1);
    } else {
      $scope.selectedCollections.push(c);
    }
  }

  var isViewSelected = $scope.isViewSelected = function(c) {
    return $scope.selectedViews.indexOf(c) > -1;
  };
  
  $scope.toggleViewSelected = function (c) {
    if (isViewSelected(c)) {
      $scope.selectedViews.splice($scope.selectedViews.indexOf(c), 1);
    } else {
      $scope.selectedViews.push(c);
    }
  };
  
  $scope.selectAllCollections = function () {
    $scope.selectedCollections = angular.copy($scope.collections);
  };
  
  $scope.selectAllViews = function () {
    $scope.selectedViews = angular.copy($scope.views);
  };
  
  $scope.$watch("source && target && (selectedCollections.length || selectedViews.length)", function (ready) {
    $scope.canTransfer = true;
  });

  $scope.$watch("source", function (s) {
    if (!s) {
      angular.extend($scope, initialConfig);
    } else {
      angular.extend($scope, initialConfig);
      angular.extend($scope, {
        loading: true
      });
      
      $q.all([
        CollectionApi
        .getCollections(s)
        .then(function (collections) {
          for (var i = collections.length - 1; i >= 0; i--) {
            if (collections[i][0] == '_') {
              // this is a system collection
              collections.splice(i, 1);
            }
          }
          $scope.collections = collections;
        }),
        
        ViewsApi
        .listViews(s)
        .then(function (views) {
          $scope.views = views;
        })
      ])
      .then(function () {
        $scope.loading = false;
      });
    }
  });
});
