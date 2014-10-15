angular.module('box.input.utils', ['ng'])
.directive('dateInput', function(dateFilter) {
  return {
    require: 'ngModel',
    template: '<input type="date" / >',
    replace: true,
    link: function(scope, elm, attrs, ngModelCtrl) {
      ngModelCtrl.$formatters.unshift(function (modelValue) {
        return dateFilter(modelValue, 'yyyy-MM-dd');
      });

      ngModelCtrl.$parsers.unshift(function(viewValue) {
        return new Date(viewValue);
      });
    },
  };
})
.directive('inputUppercase', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elem, attrs, ngModel) {
       var uppercase = function(inputValue) {
         if (!inputValue) return;
         var uppercased = inputValue.toUpperCase();
         if(uppercased !== inputValue) {
            ngModel.$setViewValue(uppercased);
            ngModel.$render();
          }         
          return uppercased;
       }
       ngModel.$parsers.push(uppercase);
       uppercase(scope[attrs.ngModel]);
    }
  }
})
.directive('scopeWatch', function() {
  return {
    restrict: 'E',
    scope: {
      what: '@',
      then: '@',
      always: '@'
    },
    controller: function ($scope) {
      var firstTime = true;
      
      if (!$scope.always) {
        var removeWatcher = $scope.$parent.$watch($scope.what, function (newVal, oldVal) {
           if (firstTime || !angular.equals(newVal, oldVal)) {
             firstTime = false;
             $scope.$parent.$newVal = newVal;
             
             $scope.$parent.$eval($scope.then);
            
             delete $scope.$parent.$newVal;
           }
         }, true);      
       
        $scope.$on('$destroy', removeWatcher);
      } else {
        var removeWatcher = $scope.$parent.$watch(function () {
            $scope.$parent.$eval($scope.then);
         });
       
        $scope.$on('$destroy', removeWatcher);
      }
    }
  }
})
