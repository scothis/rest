/*
 * Copyright 2012-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

import client from './client/default';
import when from 'when';
import pipeline from 'when/pipeline';

function normalizeRestFactoryConfig(spec, wire) {
	const config = {};

	config.parent = wire(spec.parent || client);
	config.interceptors = when.all((Array.isArray(spec) ? spec : spec.interceptors || []).map((interceptorDef) => {
		const interceptorConfig = interceptorDef.config;
		delete interceptorDef.config;
		return when.all([
			wire(typeof interceptorDef === 'string' ? { module: interceptorDef } : interceptorDef),
			wire(interceptorConfig)
		]).spread((interceptor, config) => {
			return { interceptor, config };
		});
	}));

	return config;
}

/**
 * Creates a rest client for the "rest" factory.
 * @param resolver
 * @param spec
 * @param wire
 */
function restFactory(resolver, spec, wire) {
	const config = normalizeRestFactoryConfig(spec.rest || spec.options, wire);
	return config.parent.then((parent) => {
		return config.interceptors.then((interceptorDefs) => {
			pipeline(interceptorDefs.map((interceptorDef) => {
				return (parent) => {
					return interceptorDef.interceptor(parent, interceptorDef.config);
				};
			}), parent).then(resolver.resolve, resolver.reject);
		});
	});
}

/**
 * The plugin instance.  Can be the same for all wiring runs
 */
const plugin = {
	resolvers: {
		client() {
			throw new Error('rest.js: client! wire reference resolved is deprecated, use \'rest\' facotry instead');
		}
	},
	factories: {
		rest: restFactory
	}
};

export default {
	wire$plugin(/* ready, destroyed, options */) {
		return plugin;
	}
};
