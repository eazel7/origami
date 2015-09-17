module.exports = {
  string: "<label>{{ic.data.name}}</label><input type=\"text\" class=\"form-control\"  ng-model=\"ic.data.initial\" />",
  password: "<label>{{ic.data.name}}</label><input type=\"password\" class=\"form-control\"  ng-model=\"ic.data.initial\" />",
  number: "<label>{{ic.data.name}}</label><input type=\"number\" class=\"form-control\"  ng-model=\"ic.data.initial\" />",
  boolean: "<label>{{ic.data.name}}<input type=\"checkbox\" class=\"form-control\"  ng-model=\"ic.data.initial\" /></label>",
  graphId: "<local-find collection=\"'_graphs'\" to=\"graphs\"></local-find><label>{{ic.data.name}}</label><select class=\"form-control\" ng-options=\"g._id as g.name for g in graphs\" ng-model=\"ic.data.initial\"></select>",
  textArea: "<label>{{ic.data.name}}</label><textarea class=\"form-control\" style=\"font-family: &quot;DejaVu Sans Mono&quot;, &quot;Liberation Mono&quot, monospace; resize: vertical\" rows=\"4\" ng-model=\"ic.data.initial\"></textarea>",
  script: "<label>{{ic.data.name}}</label><textarea class=\"form-control\" style=\"font-family: &quot;DejaVu Sans Mono&quot;, &quot;Liberation Mono&quot, monospace; resize: vertical\" rows=\"4\" ng-model=\"ic.data.initial\"></textarea>"
};
