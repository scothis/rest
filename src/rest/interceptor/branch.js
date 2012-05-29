(function (define) {

	define(['../../rest'], function (defaultClient) {
		"use strict";

		/**
		 * Selectively choose a client to execute based on the result of a test
		 * function.
		 *
		 * The test function may either return a Client, or a boolean value.
		 * If a Client is returned, that client will always be executed.  If a
		 * boolean is returned then either the 'then' client will be used when
		 * truthy, or the 'else' client when falsey.  The 'then' and 'else'
		 * values are optional; if not specified, the default client is used.
		 *
		 * @param {Client} [client] client to wrap
		 * @param {Function} config.if test for client branching
		 * @param {Client} [config.then] client to execute if test returns truthy value
		 * @param {Client} [config.else] client to execute if test returns falsey value
		 *
		 * @returns {Client}
		 */
		return function (client, config) {
			if (typeof client === 'object') {
				config = client;
			}
			if (typeof client !== 'function') {
				client = defaultClient;
			}
			config = config || {};
			config.callback = config.callback || {};

			return function (request) {
				var result;

				result = config.if.call(undefined, request, config);

				return typeof result === 'function' ?
					result(request) :
					result ?
						(config.then || client).call(undefined, request) :
						(config.else || client).call(undefined, request);
			};
		};

	});

}(
	typeof define === 'function' ? define : function (deps, factory) {
		return typeof module !== 'undefined' ?
			(module.exports = factory.apply(this, deps.map(require))) :
			(this.rest_interceptor_branch = factory(this.rest));
	}
	// Boilerplate for AMD, Node, and browser global
));
