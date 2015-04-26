/*
 * Copyright 2012-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

import interceptor from '../interceptor';
import base64 from '../util/base64';

/**
 * Authenticates the request using HTTP Basic Authentication (rfc2617)
 *
 * @param {Client} [client] client to wrap
 * @param {string} config.username username
 * @param {string} [config.password=''] password for the user
 *
 * @returns {Client}
 */
export default interceptor({
	request(request, config) {
		const headers = request.headers || (request.headers = {});
		const username = request.username || config.username;
		const password = request.password || config.password || '';

		if (username) {
			headers.Authorization = 'Basic ' + base64.encode(username + ':' + password);
		}

		return request;
	}
});
