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

    it('extracts pagination info from the Link Header', function() {
      var issues = new StatefulResource('/issues')

      expect(issues.currentPage).toBeFalsy()
      expect(issues.nextPage).toBeFalsy()
      expect(issues.prevPage).toBeFalsy()
      expect(issues.firstPage).toBeFalsy()
      expect(issues.lastPage).toBeFalsy()

      $httpBackend.expectGET('/issues').respond(null, {'Link': '<http://api.com/issues?page=2>; rel="next", <http://api.com/issues?page=10>; rel="last"'})
      issues.query()
      $httpBackend.flush()

      expect(issues.currentPage).toEqual(1)
      expect(issues.nextPage).toEqual(2)
      expect(issues.prevPage).toBeFalsy()
      expect(issues.firstPage).toBeFalsy()
      expect(issues.lastPage).toEqual(10)
    })
  })

  describe('#paginate', function() {
    it('issues a GET request', function() {
      var issues = new StatefulResource('/issues')

      $httpBackend.expectGET(/\/issues.*/).respond(null)
      issues.paginate()
      $httpBackend.flush()

      expect(issues.models).toBeNull()
    })

    it('fetches the next page', function() {
      $httpBackend.expectGET('/issues').respond(null, {'Link': '<http://api.com/issues?page=3>; rel="next", <http://api.com/issues?page=1>; rel="prev", <http://api.com/issues?page=1>; rel="first", <http://api.com/issues?page=10>; rel="last"'})
      var issues = new StatefulResource('/issues').query()
      $httpBackend.flush()

      expect(issues.currentPage).toEqual(2)
      expect(issues.nextPage).toEqual(3)
      expect(issues.prevPage).toEqual(1)
      expect(issues.firstPage).toEqual(1)
      expect(issues.lastPage).toEqual(10)
    })
  })
})
