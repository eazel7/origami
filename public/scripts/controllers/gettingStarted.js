'use strict';

angular.module('boxes3.manager')
.config(function ($stateProvider) {
  $stateProvider.state('gettingStarted', {
    url: '/getting-started',
    templateUrl: 'views/partials/gettingStarted.html'
  });
});
