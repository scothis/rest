/*
 * Copyright 2012-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Jeremy Grelle
 * @author Scott Andrews
 */

import parser  from 'url';
import http from 'http';
import https from 'https';
import UrlBuilder from '../UrlBuilder';
import mixin from '../util/mixin';
import normalizeHeaderName from '../util/normalizeHeaderName';
import responsePromise from '../util/responsePromise';
import client from '../client';

const httpsExp = /^https/i;

export default client((request) => {
	/*jshint maxcomplexity:20 */
	return responsePromise.promise((resolve, reject) => {

		request = typeof request === 'string' ? { path: request } : request || {};
		const response = { request: request };

		if (request.canceled) {
			response.error = 'precanceled';
			reject(response);
			return;
		}

		const url = new UrlBuilder(request.path || '', request.params).build();
		const client = url.match(httpsExp) ? https : http;

		const options = mixin({}, request.mixin, parser.parse(url));

		const entity = request.entity;
		request.method = request.method || (entity ? 'POST' : 'GET');
		options.method = request.method;
		const headers = options.headers = {};
		Object.keys(request.headers || {}).forEach((name) => {
			headers[normalizeHeaderName(name)] = request.headers[name];
		});
		if (!headers['Content-Length']) {
			headers['Content-Length'] = entity ? Buffer.byteLength(entity, 'utf8') : 0;
		}

		request.canceled = false;
		request.cancel = () => {
			request.canceled = true;
			clientRequest.abort();
		};

		const clientRequest = client.request(options, (clientResponse) => {
			// Array of Buffers to collect response chunks
			const buffers = [];

			response.raw = {
				request: clientRequest,
				response: clientResponse
			};
			response.status = {
				code: clientResponse.statusCode
				// node doesn't provide access to the status text
			};
			response.headers = {};
			Object.keys(clientResponse.headers).forEach((name) => {
				response.headers[normalizeHeaderName(name)] = clientResponse.headers[name];
			});

			clientResponse.on('data', (data) => {
				// Collect the next Buffer chunk
				buffers.push(data);
			});

			clientResponse.on('end', () => {
				// Create the final response entity
				response.entity = buffers.length > 0 ? Buffer.concat(buffers).toString() : '';
				buffers.length = 0;

				resolve(response);
			});
		});

		clientRequest.on('error', (e) => {
			response.error = e;
			reject(response);
		});

		if (entity) {
			clientRequest.write(entity);
		}
		clientRequest.end();

	});
});
