/*
 * Copyright 2012-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

import interceptor from '../interceptor';
import pathPrefix from './pathPrefix';
import rfc5988LinkParser from '../parsers/rfc5988';
import find from '../util/find';

/**
 * [Experimental]
 *
 * Supports 'Hypertext As The Engine Of Application State' style
 * services by indexing the 'links' property from the entity to make
 * accessing links via the 'rel' attribute easier.
 *
 * Links are index in two ways:
 * 1. as link's 'rel' which when accessed issues a request for the
 *    linked resource. A promise for the related resourse is expected
 *    to be returned.
 * 2. as link's 'rel' with 'Link' appended, as a reference to the link
 *    object
 *
 * The 'Link' response header is also parsed for related resources
 * following rfc5988. The values parsed from the headers are indexed
 * into the response.links object.
 *
 * Also defines a 'clientFor' factory function that creates a new
 * client configured to communicate with a related resource.
 *
 * The client for the resoruce reference and the 'clientFor' function
 * can be provided by the 'client' config property.
 *
 * Index links are exposed by default on the entity.  A child object may be
 * configed by the 'target' config property.
 *
 * @param {Client} [client] client to wrap
 * @param {string} [config.target=''] property to create on the entity and
 *   parse links into. If empty, the response entity is used directly.
 * @param {Client} [config.client=request.originator] the parent client to
 *   use when creating clients for a linked resources. Defaults to the
 *   request's originator if available, otherwise the current interceptor's
 *   client
 *
 * @returns {Client}
 */
export default interceptor({
	init(config) {
		config.target = config.target || '';
		return config;
	},
	response(response, config, meta) {
		const client = config.client || (response.request && response.request.originator) || meta.client;

		function apply(target, links) {
			links.forEach((link) => {
				Object.defineProperty(target, link.rel + 'Link', {
					enumerable: false,
					configurable: true,
					value: link
				});
				Object.defineProperty(target, link.rel, {
					enumerable: false,
					configurable: true,
					get() {
						const response = client({ path: link.href });
						Object.defineProperty(target, link.rel, {
							enumerable: false,
							configurable: true,
							value: response
						});
						return response;
					}
				});
			});

			// if only Proxy was well supported...
			Object.defineProperty(target, 'clientFor', {
				enumerable: false,
				value(rel, parentClient) {
					return pathPrefix(
						parentClient || client,
						{ prefix: target[rel + 'Link'].href }
					);
				}
			});
		}

		function parseLinkHeaders(headers) {
			let links = [];
			[].concat(headers).forEach((header) => {
				try {
					links = links.concat(rfc5988LinkParser.parse(header));
				}
				catch (e) {
					// ignore
					// TODO consider a debug mode that logs
				}
			});
			return links;
		}

		if (response.headers && response.headers.Link) {
			response.links = response.links || {};
			apply(response.links, parseLinkHeaders(response.headers.Link));
		}

		find.findProperties(response.entity, 'links', (obj, host) => {
			let target;

			if (Array.isArray(host.links)) {
				if (config.target === '') {
					target = host;
				}
				else {
					target = {};
					Object.defineProperty(host, config.target, {
						enumerable: false,
						value: target
					});
				}

				apply(target, host.links);
			}
		});

		return response;
	}
});
