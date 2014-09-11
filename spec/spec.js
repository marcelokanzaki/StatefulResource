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

  it('queries an endpoint upon instantiation', function() {
    $httpBackend.expectGET('/issues').respond(_.where(issuesFactory, {state: 'open'}))

    var issues = new StatefulResource('/issues')
    $httpBackend.flush()
    expect(issues.models).toEqual(_.where(issuesFactory, {state: 'open'}))
  })

  describe('#query', function() {
    it('issues a GET request', function() {
      $httpBackend.expectGET('/issues').respond(null)
      var issues = new StatefulResource('/issues')
      $httpBackend.flush()
      expect(issues.models).toBeNull()

      $httpBackend.expectGET('/issues').respond(null)
      issues.query()
      $httpBackend.flush()
    })

    it('accepts a hash of options to be used as params in the query string', function() {
      $httpBackend.expectGET('/issues').respond(null)
      var issues = new StatefulResource('/issues')
      $httpBackend.flush()
      expect(issues.models).toBeNull()

      $httpBackend.expectGET('/issues?foo=bar').respond(null)
      issues.query({foo: 'bar'})
      $httpBackend.flush()
    })

    xit('replaces an existing param in the query string', function() {
      $httpBackend.expectGET('/issues?foo=bar').respond(null)
      var issues = new StatefulResource('/issues?foo=bar')
      $httpBackend.flush()
      expect(issues.models).toBeNull()

      $httpBackend.expectGET('/issues?foo=somethingelse').respond(null)
      issues.query({foo: 'somethingelse'})
      $httpBackend.flush()
    })

    xit('appends options to the query string', function() {
      $httpBackend.expectGET('/issues').respond(null)
      var issues = new StatefulResource('/issues')
      $httpBackend.flush()
      expect(issues.models).toBeNull()

      $httpBackend.expectGET('/issues?foo=bar').respond(null)
      issues.query({foo: 'bar'})
      $httpBackend.flush()

      $httpBackend.expectGET('/issues?foo=bar&another=appended').respond(null)
      issues.query({another: 'appended'})
      $httpBackend.flush()
    })

    xit('removes an option from the query string when its value is null or undefined', function() {
      $httpBackend.expectGET('/issues?foo=bar').respond(null)
      var issues = new StatefulResource('/issues?foo=bar')
      $httpBackend.flush()
      expect(issues.models).toBeNull()

      $httpBackend.expectGET('/issues').respond(null)
      issues.query({foo: null})
      $httpBackend.flush()
    })
  })
})
