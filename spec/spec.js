describe('StatefulResource', function() {

  var issuesFactory = [
    {number: 1, state: 'closed', title: 'Found a bug', author: 'bughunter'},
    {number: 2, state: 'open', title: 'Found a second bug', author: 'bughunter'},
    {number: 3, state: 'closed', title: 'Found a third bug', author: 'bughunter'},
    {number: 4, state: 'open', title: 'Alright, this is getting serious!', author: 'bughunter'},
    {number: 5, state: 'open', title: 'WTF? Are you go horsing this thing?', author: 'bughunter'},
    {number: 6, state: 'open', title: 'Found a bug', author: 'someguy'},
    {number: 7, state: 'closed', title: 'Found a bug', author: 'someotherguy'}
  ]

  var StatefulResource, $httpBackend

  beforeEach(module('statefulresource'))

  beforeEach(inject(function(_StatefulResource_, _$httpBackend_) {
    StatefulResource = _StatefulResource_
    $httpBackend = _$httpBackend_
  }))

  describe('#query', function() {
    it('accepts a callback function', function() {
      var issues = new StatefulResource('/issues')

      $httpBackend.expectGET('/issues').respond(['a', 'b'])
      issues.query(function(data) {
        return data.concat(['c', 'd'])
      })
      $httpBackend.flush()

      expect(issues.models).toEqual(['a', 'b', 'c', 'd'])
    })

    it('is chainable', function() {
      var issues       = new StatefulResource('/issues'),
          sameInstance = issues.query()

      expect(issues).toBe(sameInstance)
    })

    it('extracts pagination info from response', function() {
      var issues = new StatefulResource('/issues')

      expect(issues.pages).toEqual({})

      $httpBackend.expectGET('/issues').respond(null, {'Link': '<http://api.com/issues?page=2>; rel="next", <http://api.com/issues?page=10>; rel="last"'})
      issues.query()
      $httpBackend.flush()

      expect(issues.pages.next).toEqual({label: 'next', number: 2, url: 'http://api.com/issues?page=2'})
      expect(issues.pages.last).toEqual({label: 'last', number: 10, url: 'http://api.com/issues?page=10'})
    })
  })

  describe('#filter', function() {
    it('keeps track of request params', function() {
      var issues = new StatefulResource('/issues')

      $httpBackend.expectGET('/issues?a=b').respond(null)
      issues.filter({a: 'b'})
      $httpBackend.flush()

      $httpBackend.expectGET(/\/issues\?([ac]=[bd]&?){2}/).respond(null)
      issues.filter({c: 'd'})
      $httpBackend.flush()

      expect(issues.models).toBeNull()
    })

    it('allows param overriding', function() {
      var issues = new StatefulResource('/issues')

      $httpBackend.expectGET('/issues?foo=bar').respond(null)
      issues.filter({foo: 'bar'})
      $httpBackend.flush()

      $httpBackend.expectGET('/issues?foo=somethingelse').respond(null)
      issues.filter({foo: 'somethingelse'})
      $httpBackend.flush()

      expect(issues.models).toBeNull()
    })

    it('allows param removal', function() {
      var issues = new StatefulResource('/issues')

      $httpBackend.expectGET('/issues?foo=bar').respond(null)
      issues.filter({foo: 'bar'})
      $httpBackend.flush()

      // when setting to null...
      $httpBackend.expectGET('/issues').respond(null)
      issues.filter({foo: null})
      $httpBackend.flush()

      $httpBackend.expectGET('/issues?foo=bar').respond(null)
      issues.filter({foo: 'bar'})
      $httpBackend.flush()

      // ...or undefined
      $httpBackend.expectGET('/issues').respond(null)
      issues.filter({foo: undefined})
      $httpBackend.flush()

      expect(issues.models).toBeNull()
    })

    it('ignores pagination', function() {
      var issues = new StatefulResource('/issues')

      $httpBackend.expectGET('/issues?foo=bar').respond(null)
      issues.filter({foo: 'bar', page: 10})
      $httpBackend.flush()

      expect(issues.models).toBeNull()
    })

    it('is chainable', function() {
      var issues       = new StatefulResource('/issues'),
          sameInstance = issues.filter()

      expect(issues).toBe(sameInstance)
    })
  })

  describe('#paginate', function() {
    it('fetches the next page', function() {
      var issues = new StatefulResource('/issues')

      var firstPageResults = _.initial(issuesFactory, 2)
      var secondPageResults = _.rest(issuesFactory, 2)

      $httpBackend.expectGET('/issues').respond(firstPageResults, {'Link': '<http://api.com/issues?page=2>; rel="next", <http://api.com/issues?page=10>; rel="last"'})
      issues.query()
      $httpBackend.flush()

      expect(issues.models).toEqual(firstPageResults)

      $httpBackend.expectGET('/issues?page=2').respond(secondPageResults, {'Link': '<http://api.com/issues?page=3>; rel="next", <http://api.com/issues?page=10>; rel="last"'})
      issues.paginate()
      $httpBackend.flush()

      expect(issues.models).toEqual(secondPageResults)

      $httpBackend.expectGET('/issues?page=3').respond(null)
      issues.paginate()
      $httpBackend.flush()

      expect(issues.models).toBeNull()
    })

    it('optionally appends models', function() {
      var issues = new StatefulResource('/issues')

      $httpBackend.expectGET('/issues').respond(['1'], {'Link': '<http://api.com/issues?page=2>; rel="next", <http://api.com/issues?page=10>; rel="last"'})
      issues.query()
      $httpBackend.flush()

      expect(issues.models).toEqual(['1'])

      $httpBackend.expectGET('/issues?page=2').respond(['2'], {'Link': '<http://api.com/issues?page=3>; rel="next", <http://api.com/issues?page=10>; rel="last"'})
      issues.paginate(true)
      $httpBackend.flush()

      expect(issues.models).toEqual(['1', '2'])
      // when in append mode, the page param should be forgotten
      expect(issues.params['page']).not.toBeDefined()
    })

    it('performs requests in a blocking way', function() {
      var issues = new StatefulResource('/issues')

      $httpBackend.expectGET('/issues').respond(null, {'Link': '<http://api.com/issues?page=2>; rel="next", <http://api.com/issues?page=10>; rel="last"'})
      issues.query()
      $httpBackend.flush()

      expect(issues.models).toBeNull()

      $httpBackend.expectGET('/issues?page=2').respond(null)
      issues.paginate()
      issues.paginate()
      issues.paginate()
      issues.paginate()
      $httpBackend.flush()
      $httpBackend.verifyNoOutstandingExpectation()
    })

    it('does nothing when there is no pagination info', function() {
      var issues = new StatefulResource('/issues')
      issues.paginate()
      $httpBackend.verifyNoOutstandingExpectation()
      expect(issues.models).toEqual([])
    })
  })
})
