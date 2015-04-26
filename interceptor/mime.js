/*
 * Copyright 2012-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

import interceptor from '../interceptor';
import mime from '../mime';
import registry from '../mime/registry';
import when from 'when';

const noopConverter = {
	read(obj) { return obj; },
	write(obj) { return obj; }
};

/**
 * MIME type support for request and response entities.  Entities are
 * (de)serialized using the converter for the MIME type.
 *
 * Request entities are converted using the desired converter and the
 * 'Accept' request header prefers this MIME.
 *
 * Response entities are converted based on the Content-Type response header.
 *
 * @param {Client} [client] client to wrap
 * @param {string} [config.mime='text/plain'] MIME type to encode the request
 *   entity
 * @param {string} [config.accept] Accept header for the request
 * @param {Client} [config.client=<request.originator>] client passed to the
 *   converter, defaults to the client originating the request
 * @param {Registry} [config.registry] MIME registry, defaults to the root
 *   registry
 * @param {boolean} [config.permissive] Allow an unkown request MIME type
 *
 * @returns {Client}
 */
export default interceptor({
	init(config) {
		config.registry = config.registry || registry;
		return config;
	},
	request(request, config) {
		const headers = request.headers || (request.headers = {});
		const type = mime.parse(headers['Content-Type'] = headers['Content-Type'] || config.mime || 'text/plain');
		headers.Accept = headers.Accept || config.accept || type.raw + ', application/json;q=0.8, text/plain;q=0.5, */*;q=0.2';

		if (!('entity' in request)) {
			return request;
		}

		return config.registry.lookup(type).otherwise(() => {
			// failed to resolve converter
			if (config.permissive) {
				return noopConverter;
			}
			throw 'mime-unknown';
		}).then((converter) => {
			const client = config.client || request.originator;

			return when.attempt(converter.write, request._entity || request.entity, { client: client, request: request, mime: type, registry: config.registry })
				.otherwise(() => {
					throw 'mime-serialization';
				})
				.then((entity) => {
					request._entity = request._entity || request.entity;
					request.entity = entity;
					return request;
				});
		});
	},
	response(response, config) {
		if (!(response.headers && response.headers['Content-Type'] && response.entity)) {
			return response;
		}

		const type = mime.parse(response.headers['Content-Type']);

		return config.registry.lookup(type).otherwise(() => noopConverter).then((converter) => {
			const client = config.client || response.request && response.request.originator;

			return when.attempt(converter.read, response.entity, { client: client, response: response, mime: type, registry: config.registry })
				.otherwise((e) => {
					response.error = 'mime-deserialization';
					response.cause = e;
					throw response;
				})
				.then((entity) => {
					response.entity = entity;
					return response;
				});
		});
	}
});
