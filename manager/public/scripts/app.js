'use strict';

angular.module('boxes3.manager', [
  'nvd3',
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
  'boxes3.permissions',
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
  $stateProvider.state('server', {
      url: '/server',
      templateUrl: 'views/partials/server.html'
  });
  $stateProvider.state('users', {
      url: '/users',
      templateUrl: 'views/partials/users.html',
      controller: "UsersCtrl"
  });
  $stateProvider.state('box-inactive', {
      url: '/box-inactive/:box',
      templateUrl: 'views/partials/box-inactive.html'
  });


  $urlRouterProvider.otherwise('/');
})
.controller("Server", function ($scope, UsersApi) {
  UsersApi.getAllUsers().then(function (users) {
    $scope.users = users;
  });
})
.controller("BoxStatusCtrl", function ($scope, BoxesApi) {
  BoxesApi.getBoxInfo($scope.b)
  .then(function (info) {
    $scope.info = info;
  })
})
.directive('ngFocus', function($timeout) {
    return {
        link: function ( scope, element, attrs ) {
            scope.$watch( attrs.ngFocus, function ( val ) {
                if ( angular.isDefined( val ) && val ) {
                    $timeout( function () { element[0].focus(); } );
                }
            }, true);

            element.bind('blur', function () {
                if ( angular.isDefined( attrs.ngFocusLost ) ) {
                    scope.$apply( attrs.ngFocusLost );

                }
            });
        }
    };
});
