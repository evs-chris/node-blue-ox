"use strict";

/* global it */
/* global describe */

var should = require('should');
var mod = require('./');

if (should) ; // ...jshint, I swear I'm using this

describe('blue-ox logging', function() {
  var foo = mod('foo'), foobar = mod('foo:bar'), baz = mod('baz');
  var out = [];
  mod.addOutput('test', { output: function(level, scope, message) { out.push({level: level, scope: scope, message: message}); } });
  mod.useOutputs('test');

  it('should obey log levels', function() {
    mod.level('FATAL');
    foo.error('test');
    out.length.should.equal(0);
    foo.level('error');
    foo.error('test'); // now with custom level
    out.length.should.equal(1);
    baz.error('test'); // inherits root
    out.length.should.equal(1);
    out = [];
  });

  describe('with a custom output', function() {
    it('should use the custom output', function() {
      foo.error('test');
      out.length.should.equal(1);
      out = [];
    });
  });

  describe('with timing options', function() {
    it('should inherit timing options but not times', function(done) {
      mod.level('warn');
      foo.level(null);
      foobar.level(null);
      foo.timing = true;
      foo.warn('time');
      setTimeout(function() {
        try {
          foobar.warn('time');
          out[0].scope.timeOffset.should.not.equal(undefined);
          out[1].scope.timeOffset.should.not.equal(undefined);
          out[0].scope.timeOffset.should.not.equal(out[1].scope.timeOffset);
          done();
        } catch (e) { 
          done(e);
        } finally {
          out = [];
        }
      }, 5);
    });

    it('should handle timing correctly', function(done) {
      mod.level('warn');
      foo.level(null);
      foo.warn('time');
      setTimeout(function() {
        try {
          foo.warn('time');
          out[1].scope.timeOffset.should.have.type('number');
          out[1].scope.timeOffset.should.be.approximately(5, 5);
          done();
        } catch (e) {
          done(e);
        } finally {
          out = [];
        }
      }, 5);
    });

    it('should humanize times correctly', function() {
      mod.humanizeMs(521).should.equal('521ms');
      mod.humanizeMs(1599).should.equal('1599ms');
      mod.humanizeMs(2599).should.equal('2s 599ms');
      mod.humanizeMs(10100).should.equal('10s');
      mod.humanizeMs(9100).should.equal('9s 100ms');
      mod.humanizeMs(120100).should.equal('2min');
    });
  });
});
