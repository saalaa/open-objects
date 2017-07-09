var chai = require('chai');
var sinon = require('sinon');

var expect = chai.expect;

var oo = require('./open-objects');

describe('package `open-objects`', function() {

  it('should export class `app`', function() {
    expect(oo).to.be.a('function');
    expect(oo.prototype).to.be.an('object');
  });

  it('should export function `app.main`', function() {
    expect(oo.main).to.be.a('function');
  });

});

describe('class `app`', function() {

  it('should `bootstrap` correctly', function() {
    var spy = sinon.spy();
    var app = new oo({}, []);

    app.on('module:initialize', spy);
    app.on('module:initialized', spy);
    app.on('app:bootstrapped', spy);

    app.bootstrap();

    expect(app.required).to.have.lengthOf(0);
    expect(spy.calledOnce).to.equal(true);
  });

  it('should fail on `require()`', function() {
    var app = new oo({}, [])
      .bootstrap();

    var require = function () {
      app.require('unknown-module');
    };

    expect(require).to.throw(/unknown-module/);
  });

});
