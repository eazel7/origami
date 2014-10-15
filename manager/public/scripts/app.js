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
  'ui.ace'
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
      templateUrl: 'views/partials/home.html'
  });
  $stateProvider.state('about', {
      url: '/about',
      templateUrl: 'views/partials/about.html'
  });

  $urlRouterProvider.otherwise('/');
});
