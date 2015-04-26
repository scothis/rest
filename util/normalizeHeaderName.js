/*
 * Copyright 2012-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

/**
 * Normalize HTTP header names using the pseudo camel case.
 *
 * For example:
 *   content-type         -> Content-Type
 *   accepts              -> Accepts
 *   x-custom-header-name -> X-Custom-Header-Name
 *
 * @param {string} name the raw header name
 * @return {string} the normalized header name
 */
export default function normalizeHeaderName(name) {
	return name.toLowerCase()
		.split('-')
		.map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
		.join('-');
}
