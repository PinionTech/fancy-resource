# TODO

## Known Issues

Resources with deeply nested URLS do not necessarily contain the route
parameters themselves, so cannot fill in all parameterised parts of the URL when
PUTing/POSTing/DELETEing.

A new concept should be introduced such that when creating a new resource
object, it is given its 'route params'. Similarly, in order to GET a resource
the route params must be passed as arguments anyway - all we need to arrange is
for the resource to remember them.
