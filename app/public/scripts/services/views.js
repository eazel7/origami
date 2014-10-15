angular
.module("box.service.views", ['ng', 'box.service.localData', 'box.service.remoteData'])
.service("ViewsService", function ($q, LocalCollection, RemoteCollection) {
  var viewsCollection = new LocalCollection('_views'),
      defaultTemplate = "<div>\n    <page-title title=\"Default title\"></page-title>\n    <div class=\"container-fluid section\">\n        <h3>Default content</h3>\n    </div>\n</div>";
  
  return {
    getView: function (viewName) {
      var defer = $q.defer();
      
      if (!viewName) {
        defer.reject();
        
        return defer.promise;
      }
      
      viewsCollection.findOne({name: viewName})
      .then(function (view) {
        if (view) {
          if (!view.template) {
            return viewsCollection.update({name: viewName}, {$set:{template: defaultTemplate}})
            .then(defer.resolve);
          }
          
          return defer.resolve(view);
        }
        
        // Maybe it's not synced yet
        
        new RemoteCollection('_views')
        .findOne({
          name: viewName
        })
        .then (function (view) {
          if (!view) {
            return viewsCollection.insert({
              name: viewName,
              template: defaultTemplate
            })
            .then(defer.resolve, defer.reject);
          }
        }, function () {
            return viewsCollection.insert({
              name: viewName,
              template: defaultTemplate
            })
            .then(defer.resolve, defer.reject);
        });
      });
      
      return defer.promise;
    },
    saveView: function (viewName, newView) {
      var defer = $q.defer();
      
      if (!viewName) {
        defer.reject();
        
        return defer.promise;
      }
      
      viewsCollection.findOne({name: viewName})
      .then(function (oldView) {
        if (oldView) {
          return viewsCollection.update({
            name: viewName
          }, {
            $set: newView
          })
          .then(defer.resolve, defer.reject);
        } else {
          return viewsCollection.insert({
            name: viewName,
            template: newView.template
          })
          .then(defer.resolve, defer.reject);
        }
      }, defer.reject);
      
      return defer.promise;
    }
  };
});
