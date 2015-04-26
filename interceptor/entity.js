/*
 * Copyright 2012-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

import interceptor from '../interceptor';

if (typeof console !== 'undefined') {
	console.log('rest.js: rest/interceptor/entity is deprecated, please use response.entity() instead');
}

/**
 * @deprecated use response.entity() instead
 *
 * Returns the response entity as the response, discarding other response
 * properties.
 *
 * @param {Client} [client] client to wrap
 *
 * @returns {Client}
 */
export default interceptor({
	response(response) {
		if ('entity' in response) {
			return response.entity;
		}
		return response;
	}
});
