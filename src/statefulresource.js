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
    .success(function(data, status, headersGetter) {
      var pages

      self.models = data

      if (headersGetter().link) {
        pages = LinkHeaderParser.parse( headersGetter().link )

        console.log(pages)

        self.currentPage = (pages['next'] || pages['last'])['number'] - 1
        self.nextPage = pages['next'] && pages['next']['number']
        self.prevPage = pages['prev'] && pages['prev']['number']
        self.firstPage = pages['first'] && pages['first']['number']
        self.lastPage = pages['last'] && pages['last']['number']
      }
    })

    return this
  }

  StatefulResource.prototype.paginate = function() {
    this.query()
  }

  return StatefulResource
})
