/*
 * Copyright 2012-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

import interceptor from '../interceptor';
import when from 'when';

/**
 * Rejects the response promise based on the status code.
 *
 * Codes greater than or equal to the provided value are rejected.  Default
 * value 400.
 *
 * @param {Client} [client] client to wrap
 * @param {number} [config.code=400] code to indicate a rejection
 *
 * @returns {Client}
 */
export default interceptor({
	init(config) {
		config.code = config.code || 400;
		return config;
	},
	response(response, config) {
		if (response.status && response.status.code >= config.code) {
			return when.reject(response);
		}
		return response;
	}
});
