/*
 * Copyright 2012-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Jeremy Grelle
 * @author Scott Andrews
 */

import interceptor from '../interceptor';
import when from 'when';

/**
 * Cancels a request if it takes longer then the timeout value.
 *
 * @param {Client} [client] client to wrap
 * @param {number} [config.timeout=0] duration in milliseconds before canceling the request. Non-positive values disable the timeout
 * @param {boolean} [config.transient=false] if true, timed out requests will not be marked as canceled so that it may be retried
 *
 * @returns {Client}
 */
export default interceptor({
	init(config) {
		config.timeout = config.timeout || 0;
		config.transient = !!config.transient;
		return config;
	},
	request(request, config) {
		const timeout = 'timeout' in request ? request.timeout : config.timeout;
		const transient = 'transient' in request ? request.transient : config.transient;
		if (timeout <= 0) {
			return request;
		}
		const abortTrigger = when.defer();
		this.timeout = setTimeout(() => {
			abortTrigger.reject({ request: request, error: 'timeout' });
			if (request.cancel) {
				request.cancel();
				if (transient) {
					// unmark request as canceled for future requests
					request.canceled = false;
				}
			}
			else if (!transient) {
				request.canceled = true;
			}
		}, timeout);
		return new interceptor.ComplexRequest({ request: request, abort: abortTrigger.promise });
	},
	response(response) {
		if (this.timeout) {
			clearTimeout(this.timeout);
			delete this.timeout;
		}
		return response;
	}
});
