angular.module('ng.nedb', ['ng'])
.factory('Nedb', function (){
  return window.Nedb;
})
.factory("LocalCollection", function (Nedb) {
  var collections = {};
  
  return function (name) {
    if (!collections[name]) collections[name] = new Datastore({filename: "collection_" + name, autoload: true});
    
    return collections[name];
  };
});
