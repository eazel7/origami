'use strict';

angular.module('box')
    .controller('NavbarCtrl', function ($scope, $location, $state) {
    $scope.menu = [{
      'title': 'Home',
      'link': '#/'
    }];
    
    $scope.isActive = function(route) {
      return route === $location.path();
    };
      
    $scope.hideLinks = function() {
      return $state.current.hideLinks;
    };
  });
