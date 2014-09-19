angular.module('statefulresource', [])

.factory('LinkHeaderParser', function() {
  return {
    buildPage: function(urlMatchArray, labelMatchArray) {
      return {
        number: parseInt(urlMatchArray[1].match(/page=(\d*)/)[1]),
        url: urlMatchArray[1],
        label: labelMatchArray[1]
      }
    },

    parse: function(linkStr) {
      linkStr = linkStr || ''

      var pages = {},
          self  = this

      // <http://url?page=1>; rel="first", <http://url?page=1>; rel="prev", <http://url?page=9>; rel="last", <http://url?page=3>; rel="next"
      angular.forEach(linkStr.split(','), function(link) {
        var page,
            urlMatch   = link.match(/<(.*)>/),     // <http://url?page=1>
            labelMatch = link.match(/rel="(.*)"/)  // rel="first"

        if (urlMatch && labelMatch) {
          page = self.buildPage(urlMatch, labelMatch)
          pages[page.label] = page
        }
      })

      return pages
    }
  }
})

.factory('StatefulResource', function($http, LinkHeaderParser) {
  var _statefulParams = function(paramsToMergeAndStore) {
    var isRefreshing, isFiltering, isPaginating,
        paramsToUse = {}

    paramsToMergeAndStore = paramsToMergeAndStore || {}

    isRefreshing = angular.equals({}, paramsToMergeAndStore)
    isPaginating = !!paramsToMergeAndStore['page']
    isFiltering  = Object.keys(paramsToMergeAndStore).length > (isPaginating ? 1 : 0)

    // fetch and merge
    angular.extend(paramsToUse, this.params, paramsToMergeAndStore)

    // store
    angular.extend(this.params, paramsToMergeAndStore)

    if (isFiltering && isPaginating) {
      delete this.params['page']
      delete paramsToUse['page']
    }

    return paramsToUse
  }

  var _fetch = function(params, callback) {
    var self = this

    callback = callback || angular.isFunction(params) && params

    $http.get(this.endpoint, {params: _statefulParams.call(this, params)})
    .success(function(data, status, headersGetter) {
      self.models = callback ? callback.call(self, data) : data
      _awaitingQuery = false

      if (headersGetter().link) {
        self.pages = LinkHeaderParser.parse( headersGetter().link )
      }
    })

    return this
  }

  var _awaitingQuery = false

  var StatefulResource = function(endpoint) {
    this.models = []
    this.endpoint = endpoint
    this.params = {}
    this.pages = {}
  }

  StatefulResource.prototype.query = function(callback) {
    return _fetch.call(this, {}, callback)
  }

  StatefulResource.prototype.filter = function(params, callback) {
    return _fetch.call(this, params, callback)
  }

  StatefulResource.prototype.paginate = function(append) {
    if (this.pages.next && !_awaitingQuery) {
      _awaitingQuery = true

      _fetch.call(this, {page: this.pages.next.number}, append && function(data) {
        delete this.params['page']
        return this.models.concat(data)
      })
    }
  }

  return StatefulResource
})
