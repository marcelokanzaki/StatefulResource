angular.module('statefulresource', [])

.factory('StatefulResource', function($http) {
  var _statefulParams = function(paramsToMergeAndStore) {
    return angular.extend(this.params, paramsToMergeAndStore)
  }

  var StatefulResource = function(endpoint, options) {
    this.models = []
    this.endpoint = endpoint
    this.params = {}
    this.options = angular.extend({}, options)
  }

  StatefulResource.prototype.query = function(params) {
    var self = this

    $http.get(this.endpoint, {params: _statefulParams.call(this, params)})
    .success(function(data) {
      self.models = data
    })

    return this
  }

  return StatefulResource
})
