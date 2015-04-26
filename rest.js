/*
 * Copyright 2012-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

import rest from './browser';

if (console) {
	(console.warn || console.log).call(console, 'rest.js: The main module has moved, please switch your configuration to use \'rest/browser\' as the main module for browser applications.');
}

export default rest;
