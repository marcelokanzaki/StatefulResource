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
    it('issues a GET request', function() {
      var issues = new StatefulResource('/issues')

      $httpBackend.expectGET('/issues').respond(null)
      issues.query()
      $httpBackend.flush()

      expect(issues.models).toBeNull()
    })

    it('accepts a hash of options to be used as params in the query string', function() {
      var issues = new StatefulResource('/issues')

      $httpBackend.expectGET('/issues?foo=bar').respond(null)
      issues.query({foo: 'bar'})
      $httpBackend.flush()

      expect(issues.models).toBeNull()
    })

    it('appends options to the query string', function() {
      var issues = new StatefulResource('/issues')

      $httpBackend.expectGET('/issues?a=b').respond(null)
      issues.query({a: 'b'})
      $httpBackend.flush()

      $httpBackend.expectGET(/\/issues\?([ac]=[bd]&?){2}/).respond(null)
      issues.query({c: 'd'})
      $httpBackend.flush()

      expect(issues.models).toBeNull()
    })

    it('replaces an existing param in the query string', function() {
      var issues = new StatefulResource('/issues')

      $httpBackend.expectGET('/issues?foo=bar').respond(null)
      issues.query({foo: 'bar'})
      $httpBackend.flush()

      $httpBackend.expectGET('/issues?foo=somethingelse').respond(null)
      issues.query({foo: 'somethingelse'})
      $httpBackend.flush()

      expect(issues.models).toBeNull()
    })

    it('removes an option from the query string when its value is null or undefined', function() {
      var issues = new StatefulResource('/issues')

      $httpBackend.expectGET('/issues?foo=bar').respond(null)
      issues.query({foo: 'bar'})
      $httpBackend.flush()

      $httpBackend.expectGET('/issues').respond(null)
      issues.query({foo: null})
      $httpBackend.flush()

      expect(issues.models).toBeNull()
    })

    it('is chainable', function() {
      var issues       = new StatefulResource('/issues'),
          sameInstance = issues.query()

      expect(issues).toBe(sameInstance)
    })

    it('extracts pagination info from the Link Header', function() {
      var issues = new StatefulResource('/issues')

      expect(issues.pages).toEqual({})

      $httpBackend.expectGET('/issues').respond(null, {'Link': '<http://api.com/issues?page=2>; rel="next", <http://api.com/issues?page=10>; rel="last"'})
      issues.query()
      $httpBackend.flush()

      expect(issues.pages.next).toEqual({label: 'next', number: 2, url: 'http://api.com/issues?page=2'})
      expect(issues.pages.last).toEqual({label: 'last', number: 10, url: 'http://api.com/issues?page=10'})
    })
  })

  describe('#paginate', function() {
    it('issues a GET request for the next page when it has pagination info', function() {
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
      issues.paginate({append: true})
      $httpBackend.flush()

      expect(issues.models).toEqual(['1', '2'])
    })

    it('does nothing when there is no pagination info', function() {
      var issues = new StatefulResource('/issues')
      issues.paginate()
      $httpBackend.verifyNoOutstandingExpectation()
      expect(issues.models).toEqual([])
    })
  })
})
