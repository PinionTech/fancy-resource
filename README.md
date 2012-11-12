
# FancyResource

FancyResource is an experiment to add support for server-side validations and
proper nested resources (of their own 'class') to ngResource.

It is implemented as straight copy of ngResource + the ngResource specs.
I changed the name to 'fancyResource' in order to isolate the changes to a part
of my application while the rest continues to use ngResource.

Additional specs have been written to cover the extra features.

FancyResource is backwards-compatible with ngResource when the extra arguments
to the $fancyResource service (for enabling server-side validation and nested
resources) are omitted.

## Usage

Declare a dependency on the fancyResource module, like you would with
ngResource and inject the $fancyResource service into your own code.

    Employee = $fancyResource('/Employees/:id', {id:'@id.key'}, {}, true);
    Manager = $fancyResource('/Managers/:id', {id:'@id.key'}, {}, true, {
      employees: [ Employee ]
    });

The boolean argument at the end of the first `$fancyResource` is what enables
server side validations support. It defaults to `false` to remain
backwards-compatible with `$resource`.

The second `$fancyResource` call creates another resource but this time with
support for nested resources. The object literal specifies an `employees`
property on `Manager` instances that contains an array of `Employee` objects.
Withouth the array the relationship would be a 'has-one' relationship.

## The !validation endpoint

    Employee = $fancyResource('/Employees/:id', {id:'@id.key'}, {}, true);

creates all of the usual routes that you would expect with `ngResource` and you
also get the following

 - POST /Employees/:id!validate
 - POST /Employees/!validate

Ideally the server should return a `200 OK` instead of a `201 Object Created`.
(It's a matter of taste; FancyResource will not care as long as $http does not
consider the response an error).

This request should *never* return a 400 error. A 400 should be reserved for
requests that actually have side effects such as a save or an update of
a resource.

### Creating and updating resources

When a regular PUT or POST is executed to update or create your resources,
FancyResource will look for the `errors` property. If this property is present,
it will be copied into the client-side resource.

### The 'errors' property

This is a JavaScript object where each key is a property of the resource and
each value is an array of error messages about that property.

Support for 'object-level' errors will be added soon.

## Feedback

Feedback and patches are welcome. Also feel free to critique my JS skills - it's
not my main language and I suspect there may be some dumb code in here.

## Future directions

This project resulted from an itch I needed to scratch. I'd rather not maintain
a fork of ngResource, but have this functionality merged into angular.js itself.
Obviously that depends on the angular.js team and if they think this is
something that the larger community would be interested in.

I'd also like to make angular.js's existing support for validations work with
server-side validation.

## Running the tests

Angular.js is included as a git submodule. Clone it like this:

    git submodule update --init

Build the angular.js artefacts:

    cd deps/angular.js && rake package

Install testacular:

    npm install testacular

Run the tests:

    scripts/test.sh

