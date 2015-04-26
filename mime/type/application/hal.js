/*
 * Copyright 2013-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

import pathPrefix from '../../../interceptor/pathPrefix';
import template from '../../../interceptor/template';
import find from '../../../util/find';
import lazyPromise from '../../../util/lazyPromise';
import responsePromise from '../../../util/responsePromise';
import when from 'when';

function defineProperty(obj, name, value) {
	Object.defineProperty(obj, name, {
		value: value,
		configurable: true,
		enumerable: false,
		writeable: true
	});
}

/**
 * Hypertext Application Language serializer
 *
 * Implemented to https://tools.ietf.org/html/draft-kelly-json-hal-06
 *
 * As the spec is still a draft, this implementation will be updated as the
 * spec evolves
 *
 * Objects are read as HAL indexing links and embedded objects on to the
 * resource. Objects are written as plain JSON.
 *
 * Embedded relationships are indexed onto the resource by the relationship
 * as a promise for the related resource.
 *
 * Links are indexed onto the resource as a lazy promise that will GET the
 * resource when a handler is first registered on the promise.
 *
 * A `requestFor` method is added to the entity to make a request for the
 * relationship.
 *
 * A `clientFor` method is added to the entity to get a full Client for a
 * relationship.
 *
 * The `_links` and `_embedded` properties on the resource are made
 * non-enumerable.
 */
export default {

	read(str, opts) {
		const client = opts.client;
		const console = opts.console || console;

		function deprecationWarning(relationship, deprecation) {
			if (deprecation && console && console.warn || console.log) {
				(console.warn || console.log).call(console, 'Relationship \'' + relationship + '\' is deprecated, see ' + deprecation);
			}
		}

		return opts.registry.lookup(opts.mime.suffix).then((converter) => {
			return when(converter.read(str, opts)).then((root) => {

				find.findProperties(root, '_embedded', (embedded, resource, name) => {
					Object.keys(embedded).forEach((relationship) => {
						if (relationship in resource) { return; }
						const related = responsePromise({
							entity: embedded[relationship]
						});
						defineProperty(resource, relationship, related);
					});
					defineProperty(resource, name, embedded);
				});
				find.findProperties(root, '_links', (links, resource, name) => {
					Object.keys(links).forEach((relationship) => {
						const link = links[relationship];
						if (relationship in resource) { return; }
						defineProperty(resource, relationship, responsePromise.make(lazyPromise(() => {
							if (link.deprecation) { deprecationWarning(relationship, link.deprecation); }
							if (link.templated === true) {
								return template(client)({ path: link.href });
							}
							return client({ path: link.href });
						})));
					});
					defineProperty(resource, name, links);
					defineProperty(resource, 'clientFor', (relationship, clientOverride) => {
						const link = links[relationship];
						if (!link) {
							throw new Error('Unknown relationship: ' + relationship);
						}
						if (link.deprecation) { deprecationWarning(relationship, link.deprecation); }
						if (link.templated === true) {
							return template(
								clientOverride || client,
								{ template: link.href }
							);
						}
						return pathPrefix(
							clientOverride || client,
							{ prefix: link.href }
						);
					});
					defineProperty(resource, 'requestFor', function (relationship, request, clientOverride) {
						const client = this.clientFor(relationship, clientOverride);
						return client(request);
					});
				});

				return root;
			});
		});

	},

	write(obj, opts) {
		return opts.registry.lookup(opts.mime.suffix).then((converter) => {
			return converter.write(obj, opts);
		});
	}

};
