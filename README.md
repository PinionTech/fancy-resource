
# Fancy Resource

Fancy Resource is an improved resource abstraction for angular.js.

- Supports asynchronous, throttled server-side validation of resources
- Supports nested resources with behaviour; they won't simply be a JavaScript
  object as a literal interpretation of the returned JSON

## Code

The code started out as a literal copy of ngResource thanks to the power of open
source!

## Running the tests

Angular.js is included as a submodule. So run 'git submodule update --init' to
grab it. The cd to deps/angular.js and run 'rake package' to build it.

npm install testacular

script/test.sh
