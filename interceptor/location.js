/*
 * Copyright 2012-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

import interceptor from '../interceptor';

function isRedirect(response, config) {
	const matchesRedirectCode = config.code === 0 || (response.status && response.status.code >= config.code);
	return response.headers && response.headers.Location && matchesRedirectCode;
}

/**
 * Follows the Location header in a response, if present. The response
 * returned is for the subsequent request.
 *
 * Most browsers will automatically follow HTTP 3xx redirects, however,
 * they will not automatically follow 2xx locations.
 *
 * @param {Client} [client] client to wrap
 * @param {Client} [config.client=request.originator] client to use for subsequent request
 *
 * @returns {Client}
 */
export default interceptor({
	init(config) {
		config.code = config.code || 0;
		return config;
	},
	success(response, config, client) {
		if (isRedirect(response, config)) {
			const request = response.request || {};
			client = (config.client || request.originator || client.skip());

			return client({
				method: 'GET',
				path: response.headers.Location
			});
		}

		return response;
	}
});
