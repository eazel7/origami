'use strict';

angular.module('boxes3.manager')
.directive('json', function () {
  return {
    restrict: 'E',
    scope: {
    },
    templateUrl: 'views/directives/jsonEditor.html',
    link: function (scope, elem, attrs) {
      scope.$watch(function ($scope) {
        return $scope.$parent.$eval(attrs.ngModel)
      }, function (newRootModel) {
        scope.model = newRootModel;
        scope.parents = [];
      });
      scope.parentsList = function () {
        var parents = [],
            parent = scope.parent;
        
        while(parent) {
          parents.push(parent);
          parent = parent.parent;
        }
        
        return parents.reverse();
      };
      scope.isEmpty =  function (model) {
        for (var k in model) {
          return false;
        }
        
        return true;
      };
      
      scope.FieldCtrl = function ($scope) {
        $scope.edit = function () {
          $scope.editing = true;
          $scope.newName = $scope.k;
          $scope.newType = $scope.typeName($scope.model[$scope.k]);
        };
        $scope.delete = function () {
          if ($scope.typeName($scope.model) === 'array') {
            $scope.model.splice($scope.k, 1);
          } else {
            delete $scope.model[$scope.k];
          }
        };
        $scope.moveUp = function () {
          var prev = $scope.model[$scope.k - 1];
          $scope.model[$scope.k - 1] = $scope.model[$scope.k];
          $scope.model[$scope.k] =  prev;
        };
        $scope.moveDown = function () {
          var next = $scope.model[$scope.k + 1];
          $scope.model[$scope.k + 1] = $scope.model[$scope.k];
          $scope.model[$scope.k] =  next;
        };
        $scope.doneEdit = function () {
          var newVal = $scope.model[$scope.k];
          
          if ($scope.newType != $scope.typeName(newVal)) {
            try{
              switch($scope.newType) {
                case 'number':
                  newVal = Number(newVal);
                  if (Number.isNaN(newVal)) {
                    throw 'NaN is not a valid JSON number'
                  }
                  break;
                case 'string':
                  newVal = String(newVal);
                  break;
                case 'boolean':
                  if ($scope.typeName(newVal) == 'string') {
                    newVal = Boolean(newVal.toLowerCase() !== 'false');
                  } else {
                    newVal = Boolean(newVal);
                  }
                  break;
              }
            } catch (e) {
              console.log(e);
              return;
            }
          }
        
          if ($scope.k !== $scope.newName) {
            $scope.model[$scope.newName] = newVal;
            delete $scope.model[$scope.k];
          } else {
            $scope.model[$scope.k] = newVal;
          }
          $scope.editing = false;
          delete $scope.newType;
        };
      };
      scope.stepInto = function (k) {
        scope.parent = {
          model: scope.model,
          parent: scope.parent,
          k: k
        };
        scope.model = scope.model[k];
        delete scope.editing;
        delete scope.editingValue;
      };
      scope.goParent = function (p) {
        var parentModel = p ? p.model : scope.parent.model,
            parentParent = p ? p.parent : scope.parent.parent;
            
        scope.parent = parentParent;
        scope.model = parentModel;
      };
      scope.typeName = function (o) {
        if (angular.isArray(o)) {
          return 'array';
        } else {
          return typeof o;
        }
      };
    }
  };
})
.controller("EditFieldValueCtrl", function ($scope) {
  $scope.editValue = function () {
    if (!$scope.editing) {
      $scope.editingValue = true;
      $scope.newValue = $scope.model[$scope.k];
    }
  };
  $scope.doneEditValue = function () {
    var newVal = $scope.newValue;
    
    try {
      switch($scope.typeName($scope.model[$scope.k])) {
        case 'string':
          newVal = String(newVal);
          break;
        case 'number':
          newVal = Number(newVal);
          if (Number.isNaN(newVal)) {
            throw 'NaN is not a valid JSON number'
          }
          break;
        case 'boolean':
          if ($scope.typeName(newVal) == 'string') {
            newVal = Boolean(newVal.toLowerCase() !== 'false');
          } else {
            newVal = Boolean(newVal);
          }
          break;
      }
      
      $scope.editingValue = false;
      
      $scope.model[$scope.k] = newVal;
    } catch (e) {
      console.log(e);
    }
  };
})
.controller("AppendFieldCtrl", function ($scope) {
  $scope.appendField = function () {
    var newVal;
    
    switch($scope.newField.type) {
      case 'object':
        newVal = {};
        break;
      case 'array':
        newVal = [];
        break;
      case 'string':
        newVal = '';
        break;
      case 'number':
        newVal = 0;
        break;
      case 'boolean':
        newVal = false;
        break;
    }
    
    if ($scope.typeName($scope.model) !== 'array') {
      $scope.model[$scope.newField.name] = newVal;
    } else {
      $scope.model.push(newVal);
    }
    $scope.newField = {
      type: 'string'
    };
  };
  
  $scope.newField = {
    type: 'string'
  };
});
