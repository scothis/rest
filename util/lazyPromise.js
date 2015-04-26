/*
 * Copyright 2013-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

import when from 'when';

/**
 * Create a promise whose work is started only when a handler is registered.
 *
 * The work function will be invoked at most once. Thrown values will result
 * in promise rejection.
 *
 * @param {Function} work function whose ouput is used to resolve the
 *   returned promise.
 * @returns {Promise} a lazy promise
 */
export default function lazyPromise(work) {
	const defer = when.defer();

	const resolver = defer.resolver;
	const promise = defer.promise;
	const then = promise.then;

	let started = false;
	promise.then = function () {
		if (!started) {
			started = true;
			when.attempt(work).then(resolver.resolve, resolver.reject);
		}
		return then.apply(promise, arguments);
	};

	return promise;
}
