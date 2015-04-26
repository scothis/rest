/*
 * Copyright 2013-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

import UrlBuilder from '../UrlBuilder';
import responsePromise from '../util/responsePromise';
import client from '../client';

export default client((request) => {
	return responsePromise.promise((resolve, reject) => {

		request = typeof request === 'string' ? { path: request } : request || {};
		const response = { request: request };

		if (request.canceled) {
			response.error = 'precanceled';
			reject(response);
			return;
		}

		client = response.raw = new XDomainRequest();

		const entity = request.entity;
		const method = request.method = request.method || (entity ? 'POST' : 'GET');
		const url = new UrlBuilder(request.path || '', request.params).build();

		try {
			client.open(method, url);

			request.canceled = false;
			request.cancel = () => {
				request.canceled = true;
				client.abort();
				reject(response);
			};

			client.onload = () => {
				if (request.canceled) { return; }
				// this is all we have access to on the XDR object :(
				response.headers = { 'Content-Type': client.contentType };
				response.entity = client.responseText;
				resolve(response);
			};

			client.onerror = () => {
				response.error = 'loaderror';
				reject(response);
			};

			// onprogress must be defined
			client.onprogress = () => {};

			client.send(entity);
		}
		catch (e) {
			response.error = 'loaderror';
			reject(response);
		}

	});
});
