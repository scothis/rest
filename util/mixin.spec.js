/*
 * Copyright 2012-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';

import mixin from './mixin';

console.log('hello');
describe('rest/util/mixin', function () {

	it('should return an emtpy object for no args', function () {
		var mixed, prop;
		mixed = mixin();
		expect(mixed).to.exist();
		for (prop in mixed) {
			/*jshint forin:false */
			expect(mixed).to.not.have.ownProperty(prop);
		}
	});

	it('should return original object', function () {
		var orig, mixed;
		orig = { foo: 'bar' };
		mixed = mixin(orig);
		expect(mixed).to.equal(orig);
	});

	it('should return original object, supplemented', function () {
		var orig, supplemented, mixed;
		orig = { foo: 'bar' };
		supplemented = { foo: 'foo' };
		mixed = mixin(orig, supplemented);
		expect(mixed).to.equal(orig);
		expect(mixed.foo).to.equal('foo');
	});

});
