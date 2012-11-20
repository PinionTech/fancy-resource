'use strict';

if (typeof Function.prototype.bind === 'undefined') {
  // Naive bind polyfill to work around missing 'bind' in PhantomJS.
  Function.prototype.bind = function(context) {
    var that = this;
    return function() {
      return that.apply(context, arguments);
    };
  };
}

describe("fancyResource", function() {
  var $fancyResource, CreditCard, callback, $httpBackend;

  beforeEach(module('fancyResource'));
  beforeEach(inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    $fancyResource = $injector.get('$fancyResource');
    CreditCard = $fancyResource('/CreditCard/:id:verb', {id:'@id.key'}, {
      charge:{
        method:'POST',
        params:{verb:'!charge'}
      },
      patch: {
        method: 'PATCH'
      },
      conditionalPut: {
        method: 'PUT',
        headers: {
          'If-None-Match': '*'
        }
      }

    });
    callback = jasmine.createSpy();
  }));


  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
  });


  it("should build resource", function() {
    expect(typeof CreditCard).toBe('function');
    expect(typeof CreditCard.get).toBe('function');
    expect(typeof CreditCard.save).toBe('function');
    expect(typeof CreditCard.remove).toBe('function');
    expect(typeof CreditCard['delete']).toBe('function');
    expect(typeof CreditCard.query).toBe('function');
  });


  it('should default to empty parameters', function() {
    $httpBackend.expect('GET', 'URL').respond({});
    $fancyResource('URL').query();
  });


  it('should ignore slashes of undefinend parameters', function() {
    var R = $fancyResource('/Path/:a/:b/:c');

    $httpBackend.when('GET', '/Path').respond('{}');
    $httpBackend.when('GET', '/Path/0').respond('{}');
    $httpBackend.when('GET', '/Path/false').respond('{}');
    $httpBackend.when('GET', '/Path').respond('{}');
    $httpBackend.when('GET', '/Path/').respond('{}');
    $httpBackend.when('GET', '/Path/1').respond('{}');
    $httpBackend.when('GET', '/Path/2/3').respond('{}');
    $httpBackend.when('GET', '/Path/4/5').respond('{}');
    $httpBackend.when('GET', '/Path/6/7/8').respond('{}');

    R.get({});
    R.get({a:0});
    R.get({a:false});
    R.get({a:null});
    R.get({a:undefined});
    R.get({a:''});
    R.get({a:1});
    R.get({a:2, b:3});
    R.get({a:4, c:5});
    R.get({a:6, b:7, c:8});
  });


  it('should support escaping colons in url template', function() {
    var R = $fancyResource('http://localhost\\:8080/Path/:a/\\:stillPath/:b');

    $httpBackend.expect('GET', 'http://localhost:8080/Path/foo/:stillPath/bar').respond();
    R.get({a: 'foo', b: 'bar'});
  });


  it('should correctly encode url params', function() {
    var R = $fancyResource('/Path/:a');

    $httpBackend.expect('GET', '/Path/foo%231').respond('{}');
    $httpBackend.expect('GET', '/Path/doh!@foo?bar=baz%231').respond('{}');

    R.get({a: 'foo#1'});
    R.get({a: 'doh!@foo', bar: 'baz#1'});
  });


  it('should not encode @ in url params', function() {
    //encodeURIComponent is too agressive and doesn't follow http://www.ietf.org/rfc/rfc3986.txt
    //with regards to the character set (pchar) allowed in path segments
    //so we need this test to make sure that we don't over-encode the params and break stuff like
    //buzz api which uses @self

    var R = $fancyResource('/Path/:a');
    $httpBackend.expect('GET', '/Path/doh@fo%20o?!do%26h=g%3Da+h&:bar=$baz@1').respond('{}');
    R.get({a: 'doh@fo o', ':bar': '$baz@1', '!do&h': 'g=a h'});
  });


  it('should encode & in url params', function() {
    var R = $fancyResource('/Path/:a');
    $httpBackend.expect('GET', '/Path/doh&foo?bar=baz%261').respond('{}');
    R.get({a: 'doh&foo', bar: 'baz&1'});
  });


  it('should build resource with default param', function() {
    $httpBackend.expect('GET', '/Order/123/Line/456.visa?minimum=0.05').respond({id: 'abc'});
    var LineItem = $fancyResource('/Order/:orderId/Line/:id:verb',
                                  {orderId: '123', id: '@id.key', verb:'.visa', minimum: 0.05});
    var item = LineItem.get({id: 456});
    $httpBackend.flush();
    expect(item).toEqualData({id:'abc'});
  });


  it("should build resource with action default param overriding default param", function() {
    $httpBackend.expect('GET', '/Customer/123').respond({id: 'abc'});
    var TypeItem = $fancyResource('/:type/:typeId', {type: 'Order'},
                                  {get: {method: 'GET', params: {type: 'Customer'}}});
    var item = TypeItem.get({typeId: 123});

    $httpBackend.flush();
    expect(item).toEqualData({id: 'abc'});
  });


  it('should build resource with action default param reading the value from instance', function() {
    $httpBackend.expect('POST', '/Customer/123').respond();
    var R = $fancyResource('/Customer/:id', {}, {post: {method: 'POST', params: {id: '@id'}}});

    var inst = new R({id:123});
    expect(inst.id).toBe(123);

    inst.$post();
  });


  it('should handle multiple params with same name', function() {
    var R = $fancyResource('/:id/:id');

    $httpBackend.when('GET').respond('{}');
    $httpBackend.expect('GET', '/1/1');

    R.get({id:1});
  });


  it("should create resource", function() {
    $httpBackend.expect('POST', '/CreditCard', '{"name":"misko"}').respond({id: 123, name: 'misko'});

    var cc = CreditCard.save({name: 'misko'}, callback);
    expect(cc).toEqualData({name: 'misko'});
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(cc).toEqualData({id: 123, name: 'misko'});
    expect(callback).toHaveBeenCalledOnce();
    expect(callback.mostRecentCall.args[0]).toEqual(cc);
    expect(callback.mostRecentCall.args[1]()).toEqual({});
  });


  it("should read resource", function() {
    $httpBackend.expect('GET', '/CreditCard/123').respond({id: 123, number: '9876'});
    var cc = CreditCard.get({id: 123}, callback);

    expect(cc instanceof CreditCard).toBeTruthy();
    expect(cc).toEqualData({});
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(cc).toEqualData({id: 123, number: '9876'});
    expect(callback.mostRecentCall.args[0]).toEqual(cc);
    expect(callback.mostRecentCall.args[1]()).toEqual({});
  });


  it('should send correct headers', function() {
    $httpBackend.expectPUT('/CreditCard/123', undefined, function(headers) {
       return headers['If-None-Match'] == "*";
    }).respond({id:123});

    CreditCard.conditionalPut({id: {key:123}});
  });


  it("should read partial resource", function() {
    $httpBackend.expect('GET', '/CreditCard').respond([{id:{key:123}}]);
    var ccs = CreditCard.query();

    $httpBackend.flush();
    expect(ccs.length).toEqual(1);

    var cc = ccs[0];
    expect(cc instanceof CreditCard).toBe(true);
    expect(cc.number).toBeUndefined();

    $httpBackend.expect('GET', '/CreditCard/123').respond({id: {key: 123}, number: '9876'});
    cc.$get(callback);
    $httpBackend.flush();
    expect(callback.mostRecentCall.args[0]).toEqual(cc);
    expect(callback.mostRecentCall.args[1]()).toEqual({});
    expect(cc.number).toEqual('9876');
  });


  it("should update resource", function() {
    $httpBackend.expect('POST', '/CreditCard/123', '{"id":{"key":123},"name":"misko"}').
                 respond({id: {key: 123}, name: 'rama'});

    var cc = CreditCard.save({id: {key: 123}, name: 'misko'}, callback);
    expect(cc).toEqualData({id:{key:123}, name:'misko'});
    expect(callback).not.toHaveBeenCalled();
    $httpBackend.flush();
  });


  it("should query resource", function() {
    $httpBackend.expect('GET', '/CreditCard?key=value').respond([{id: 1}, {id: 2}]);

    var ccs = CreditCard.query({key: 'value'}, callback);
    expect(ccs).toEqual([]);
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(ccs).toEqualData([{id:1}, {id:2}]);
    expect(callback.mostRecentCall.args[0]).toEqual(ccs);
    expect(callback.mostRecentCall.args[1]()).toEqual({});
  });


  it("should have all arguments optional", function() {
    $httpBackend.expect('GET', '/CreditCard').respond([{id:1}]);

    var log = '';
    var ccs = CreditCard.query(function() { log += 'cb;'; });

    $httpBackend.flush();
    expect(ccs).toEqualData([{id:1}]);
    expect(log).toEqual('cb;');
  });


  it('should delete resource and call callback', function() {
    $httpBackend.expect('DELETE', '/CreditCard/123').respond({});
    CreditCard.remove({id:123}, callback);
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(callback.mostRecentCall.args[0]).toEqualData({});
    expect(callback.mostRecentCall.args[1]()).toEqual({});

    callback.reset();
    $httpBackend.expect('DELETE', '/CreditCard/333').respond(204, null);
    CreditCard.remove({id:333}, callback);
    expect(callback).not.toHaveBeenCalled();

    $httpBackend.flush();
    expect(callback.mostRecentCall.args[0]).toEqualData({});
    expect(callback.mostRecentCall.args[1]()).toEqual({});
  });


  it('should post charge verb', function() {
    $httpBackend.expect('POST', '/CreditCard/123!charge?amount=10', '{"auth":"abc"}').respond({success: 'ok'});
    CreditCard.charge({id:123, amount:10}, {auth:'abc'}, callback);
  });


  it('should post charge verb on instance', function() {
    $httpBackend.expect('POST', '/CreditCard/123!charge?amount=10',
        '{"id":{"key":123},"name":"misko"}').respond({success: 'ok'});

    var card = new CreditCard({id:{key:123}, name:'misko'});
    card.$charge({amount:10}, callback);
  });


  it("should patch a resource", function() {
    $httpBackend.expectPATCH('/CreditCard/123', '{"name":"igor"}').
                     respond({id: 123, name: 'rama'});

    var card = CreditCard.patch({id: 123}, {name: 'igor'}, callback);

    expect(card).toEqualData({name: 'igor'});
    expect(callback).not.toHaveBeenCalled();
    $httpBackend.flush();
    expect(callback).toHaveBeenCalled();
    expect(card).toEqualData({id: 123, name: 'rama'});
  });


  it('should create on save', function() {
    $httpBackend.expect('POST', '/CreditCard', '{"name":"misko"}').respond({id: 123}, {header1: 'a'});

    var cc = new CreditCard();
    expect(cc.$get).toBeDefined();
    expect(cc.$query).toBeDefined();
    expect(cc.$remove).toBeDefined();
    expect(cc.$save).toBeDefined();

    cc.name = 'misko';
    cc.$save(callback);
    expect(cc).toEqualData({name:'misko'});

    $httpBackend.flush();
    expect(cc).toEqualData({id:123});
    expect(callback.mostRecentCall.args[0]).toEqual(cc);
    expect(callback.mostRecentCall.args[1]()).toEqual({header1: 'a'});
  });


  it('should not mutate the resource object if response contains no body', function() {
    var data = {id:{key:123}, number:'9876'};
    $httpBackend.expect('GET', '/CreditCard/123').respond(data);

    var cc = CreditCard.get({id:123});
    $httpBackend.flush();
    expect(cc instanceof CreditCard).toBe(true);

    $httpBackend.expect('POST', '/CreditCard/123', angular.toJson(data)).respond('');
    var idBefore = cc.id;

    cc.$save();
    $httpBackend.flush();
    expect(idBefore).toEqual(cc.id);
  });


  it('should bind default parameters', function() {
    $httpBackend.expect('GET', '/CreditCard/123.visa?minimum=0.05').respond({id: 123});
    var Visa = CreditCard.bind({verb:'.visa', minimum:0.05});
    var visa = Visa.get({id:123});
    $httpBackend.flush();
    expect(visa).toEqualData({id:123});
  });


  it('should exercise full stack', function() {
    var Person = $fancyResource('/Person/:id');

    $httpBackend.expect('GET', '/Person/123').respond('\n{\n"name":\n"misko"\n}\n');
    var person = Person.get({id:123});
    $httpBackend.flush();
    expect(person.name).toEqual('misko');
  });

  describe('server-side validations', function() {
    beforeEach(function() {
      CreditCard = $fancyResource('/CreditCard/:id', {id:'@id'}, {}, true);
    });

    it('should provide a validation action on the resource', function() {
      expect(typeof CreditCard.validate).toBe('function');
    });

    it('should provide a validateProprerty method on the resource instance', function() {
      expect(typeof new CreditCard().validateProperty).toBe('function');
    });

    describe('valdiation route', function() {
      describe('without an :id parameter', function(){
        it('should execute server side validation', function() {
          $httpBackend.expect('POST', '/CreditCard/!validate').respond({});
          var cc = new CreditCard();
          cc.$validate();
        });
      });
      describe('with an :id parameter', function(){
        it('should execute server side validation', function() {
          $httpBackend.expect('POST', '/CreditCard/1/!validate').respond({});
          var cc = new CreditCard({id: 1});
          cc.$validate();
        });
      });
    });

    describe('copying the errors from the response', function() {

      it('should happen for 200', function() {
        $httpBackend.expect('POST', '/CreditCard/!validate').respond(200, '{"errors":{"foo":["error in field foo"]}}');
        var cc = new CreditCard();
        cc.$validate();
        $httpBackend.flush();
        expect(cc.errors.foo).toEqual([ 'error in field foo' ]);
      });

      it('should happen for 201', function() {
        $httpBackend.expect('POST', '/CreditCard/!validate').respond(201, '{"errors":{"foo":["error in field foo"]}}');
        var cc = new CreditCard();
        cc.$validate();
        $httpBackend.flush();
        expect(cc.errors.foo).toEqual([ 'error in field foo' ]);
      });

      it('should *only* copy the errors property', function() {
        $httpBackend.expect('POST', '/CreditCard/!validate').respond(201, '{"foo":"bar","errors":{"foo":["error in field foo"]}}');
        var cc = new CreditCard();
        cc.$validate();
        $httpBackend.flush();
        expect(cc.foo).toBeUndefined();
      });

    });

    describe('property-at-a-time validations', function(){

      it('should only copy the error from the requested property', function(){
        $httpBackend.expect('POST', '/CreditCard/!validate').respond(200, '{"errors":{"foo":["error in field foo"],"bar":["error in field bar"]}}');
        var cc = new CreditCard();
        cc.validateProperty('foo');
        $httpBackend.flush();
        expect(cc.errors.foo.length).toEqual(1);
        expect(cc.errors.foo).toEqual(["error in field foo"]);
      });

      it('should remove errors from other properties', function() {
        $httpBackend.expect('POST', '/CreditCard/!validate').respond(200, '{"errors":{"foo":["error in field foo"]}}');
        var cc = new CreditCard();
        cc.errors = {bar: ['error in field bar']};
        cc.validateProperty('foo');
        $httpBackend.flush();
        expect(cc.errors.bar).toBeUndefined();
      });

      it('should throttle http requests to the server', function() {
        // This spec will fail if there is > 1 call to the server
        $httpBackend.expect('POST', '/CreditCard/!validate').respond(200, '{"errors":{"foo":["error in field foo"],"bar":["error in field bar"]}}');
        var cc = new CreditCard();
        cc.validateProperty('foo');
        cc.validateProperty('bar');
        $httpBackend.flush();
        expect(cc.errors.foo).toEqual(['error in field foo']);
        expect(cc.errors.bar).toEqual(['error in field bar']);
      });
    });

  });

  describe('nested resources', function() {
    describe('has one', function() {
      var SteeringWheel = null, Car = null;

      beforeEach(function() {
        SteeringWheel = $fancyResource('/SteeringWheel/:id', {id:'@id.key'}, {}, true);
        Car = $fancyResource('/Cars/:id', {id:'@id.key'}, {}, true, {
          steeringWheel : SteeringWheel 
        });
      });

      it('should convert nested resources to the appropriate type', function() {
        $httpBackend.expect('GET', '/Cars/1').respond(200, '{ "id": 1, "steeringWheel": { "id": 10 } }');
        var car = Car.get({id: 1});
        $httpBackend.flush();
        expect(car.steeringWheel instanceof SteeringWheel).toEqual(true);
      });
    });

    describe('has many', function() {
      var Employee = null, Manager = null;

      beforeEach(function() {
        Employee = $fancyResource('/Employees/:id', {id:'@id.key'}, {}, true);
        Manager = $fancyResource('/Managers/:id', {id:'@id.key'}, {}, true, {
          employees: [ Employee ]
        });
      });

      it('should convert nested resources to the appropriate type', function() {
        $httpBackend.expect('GET', '/Managers/1').respond(200, '{ "id": 1, "employees":[ { "id": 10 }, {"id": 11} ]}');
        var manager = Manager.get({id: 1});
        $httpBackend.flush();
        expect(manager.employees.length).toEqual(2);
        expect(manager.employees[0] instanceof Employee).toEqual(true);
      });
    });
  });

  describe('failure mode', function() {
    var ERROR_CODE = 500,
        ERROR_RESPONSE = 'Server Error',
        errorCB;

    beforeEach(function() {
      errorCB = jasmine.createSpy('error').andCallFake(function(response) {
        expect(response.data).toBe(ERROR_RESPONSE);
        expect(response.status).toBe(ERROR_CODE);
      });
    });


    it('should call the error callback if provided on non 2xx response', function() {
      $httpBackend.expect('GET', '/CreditCard/123').respond(ERROR_CODE, ERROR_RESPONSE);

      CreditCard.get({id:123}, callback, errorCB);
      $httpBackend.flush();
      expect(errorCB).toHaveBeenCalledOnce();
      expect(callback).not.toHaveBeenCalled();
    });


    it('should call the error callback if provided on non 2xx response', function() {
      $httpBackend.expect('GET', '/CreditCard').respond(ERROR_CODE, ERROR_RESPONSE);

      CreditCard.get(callback, errorCB);
      $httpBackend.flush();
      expect(errorCB).toHaveBeenCalledOnce();
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
