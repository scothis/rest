/*
 * Copyright 2012-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

import UrlBuilder from '../UrlBuilder';
import normalizeHeaderName from '../util/normalizeHeaderName';
import responsePromise from '../util/responsePromise';
import client from '../client';

// according to the spec, the line break is '\r\n', but doesn't hold true in practice
const headerSplitRE = /[\r|\n]+/;

function parseHeaders(raw) {
	// Note: Set-Cookie will be removed by the browser
	const headers = {};

	if (!raw) { return headers; }

	raw.trim().split(headerSplitRE).forEach((header) => {
		const boundary = header.indexOf(':');
		const name = normalizeHeaderName(header.substring(0, boundary).trim());
		const value = header.substring(boundary + 1).trim();
		if (headers[name]) {
			if (Array.isArray(headers[name])) {
				// add to an existing array
				headers[name].push(value);
			}
			else {
				// convert single value to array
				headers[name] = [headers[name], value];
			}
		}
		else {
			// new, single value
			headers[name] = value;
		}
	});

	return headers;
}

function safeMixin(target, source) {
	Object.keys(source || {}).forEach((prop) => {
		// make sure the property already exists as
		// IE 6 will blow up if we add a new prop
		if (source.hasOwnProperty(prop) && prop in target) {
			try {
				target[prop] = source[prop];
			}
			catch (e) {
				// ignore, expected for some properties at some points in the request lifecycle
			}
		}
	});

	return target;
}

export default client((request) => {
	return responsePromise.promise((resolve, reject) => {
		/*jshint maxcomplexity:20 */

		request = typeof request === 'string' ? { path: request } : request || {};
		const response = { request: request };

		if (request.canceled) {
			response.error = 'precanceled';
			reject(response);
			return;
		}

		const XMLHttpRequest = request.engine || global.XMLHttpRequest;
		if (!XMLHttpRequest) {
			reject({ request: request, error: 'xhr-not-available' });
			return;
		}

		const entity = request.entity;
		request.method = request.method || (entity ? 'POST' : 'GET');
		const method = request.method;
		const url = new UrlBuilder(request.path || '', request.params).build();

		try {
			client = response.raw = new XMLHttpRequest();

			// mixin extra request properties before and after opening the request as some properties require being set at different phases of the request
			safeMixin(client, request.mixin);
			client.open(method, url, true);
			safeMixin(client, request.mixin);

			const headers = request.headers;
			for (let headerName in headers) {
				/*jshint forin:false */
				if (headerName === 'Content-Type' && headers[headerName] === 'multipart/form-data') {
					// XMLHttpRequest generates its own Content-Type header with the
					// appropriate multipart boundary when sending multipart/form-data.
					continue;
				}

				client.setRequestHeader(headerName, headers[headerName]);
			}

			request.canceled = false;
			request.cancel = () => {
				request.canceled = true;
				client.abort();
				reject(response);
			};

			client.onreadystatechange = () => {
				if (request.canceled) { return; }
				if (client.readyState === (XMLHttpRequest.DONE || 4)) {
					response.status = {
						code: client.status,
						text: client.statusText
					};
					response.headers = parseHeaders(client.getAllResponseHeaders());
					response.entity = client.responseText;

					if (response.status.code > 0) {
						// check status code as readystatechange fires before error event
						resolve(response);
					}
					else {
						// give the error callback a chance to fire before resolving
						// requests for file:// URLs do not have a status code
						setTimeout(() => {
							resolve(response);
						}, 0);
					}
				}
			};

			try {
				client.onerror = () => {
					response.error = 'loaderror';
					reject(response);
				};
			}
			catch (e) {
				// IE 6 will not support error handling
			}

			client.send(entity);
		}
		catch (e) {
			response.error = 'loaderror';
			reject(response);
		}

	});
});
