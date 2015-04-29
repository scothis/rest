/*
 * Copyright 2012-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

const empty = {};

console.log('mixin');

/**
 * Mix the properties from the source object into the destination object.
 * When the same property occurs in more then one object, the right most
 * value wins.
 *
 * @param {Object} dest the object to copy properties to
 * @param {Object} sources the objects to copy properties from.  May be 1 to N arguments, but not an Array.
 * @return {Object} the destination object
 */
export default function mixin(dest, ...sources) {
	if (!dest) { dest = {}; }
	sources.forEach((source) => {
		for (let name in source) {
			if (!(name in dest) || (dest[name] !== source[name] && (!(name in empty) || empty[name] !== source[name]))) {
				dest[name] = source[name];
			}
		}
	});

	return dest; // Object
}
