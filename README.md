SatefulResource (work in progress)
=============

A small AngularJS Service to query an endpoint in a stateful way.


Usage
-----

Lets say you want to build something like GitHub Issues using AngularJS...

```javascript
var issues = new SatefulResource('/issues') // GET /issues
issues.models // bindable issues array

issues.query({state: 'closed'}) // GET /issues?state=closed
issues.models // issues with state 'closed'

issues.query({author: 'bughunter'}) // GET /issues?state=closed&author=bughunter
issues.models // issues with state 'closed' AND with 'bughunter' as author

issues.query({state: null}) // GET /issues?author=bughunter (notice that the "state" param was removed)
issues.models // issues with state 'closed'
```
