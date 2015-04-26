/*
 * Copyright 2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

import interceptor from '../interceptor';
import uriTemplate from '../util/uriTemplate';
import mixin from '../util/mixin';

/**
 * Applies request params to the path as a URI Template
 *
 * Params are removed from the request object, as they have been consumed.
 *
 * @param {Client} [client] client to wrap
 * @param {Object} [config.params] default param values
 * @param {string} [config.template] default template
 *
 * @returns {Client}
 */
export default interceptor({
	init(config) {
		config.params = config.params || {};
		config.template = config.template || '';
		return config;
	},
	request(request, config) {
		const template = request.path || config.template;
		const params = mixin({}, request.params, config.params);

		request.path = uriTemplate.expand(template, params);
		delete request.params;

		return request;
	}
});
