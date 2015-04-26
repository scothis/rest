/*
 * Copyright 2012-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

import UrlBuilder from '../UrlBuilder';
import responsePromise from '../util/responsePromise';
import client from '../client';

// consider abstracting this into a util module
function clearProperty(scope, propertyName) {
	try {
		delete scope[propertyName];
	}
	catch (e) {
		// IE doesn't like to delete properties on the window object
		if (propertyName in scope) {
			scope[propertyName] = void 0;
		}
	}
}

function cleanupScriptNode(response) {
	try {
		if (response.raw && response.raw.parentNode) {
			response.raw.parentNode.removeChild(response.raw);
		}
	} catch (e) {
		// ignore
	}
}

function registerCallback(prefix, resolve, response, name) {
	if (!name) {
		do {
			name = prefix + Math.floor(new Date().getTime() * Math.random());
		}
		while (name in global);
	}

	global[name] = function jsonpCallback(data) {
		response.entity = data;
		clearProperty(global, name);
		cleanupScriptNode(response);
		if (!response.request.canceled) {
			resolve(response);
		}
	};

	return name;
}

/**
 * Executes the request as JSONP.
 *
 * @param {string} request.path the URL to load
 * @param {Object} [request.params] parameters to bind to the path
 * @param {string} [request.callback.param='callback'] the parameter name for
 *   which the callback function name is the value
 * @param {string} [request.callback.prefix='jsonp'] prefix for the callback
 *   function, as the callback is attached to the window object, a unique,
 *   unobtrusive prefix is desired
 * @param {string} [request.callback.name=<generated>] pins the name of the
 *   callback function, useful for cases where the server doesn't allow
 *   custom callback names. Generally not recommended.
 *
 * @returns {Promise<Response>}
 */
export default client((request) => {
	return responsePromise.promise((resolve, reject) => {

		request = typeof request === 'string' ? { path: request } : request || {};
		const response = { request: request };

		if (request.canceled) {
			response.error = 'precanceled';
			reject(response);
			return;
		}

		request.callback = request.callback || {};
		const callbackName = registerCallback(request.callback.prefix || 'jsonp', resolve, response, request.callback.name);
		const callbackParams = {};
		callbackParams[request.callback.param || 'callback'] = callbackName;

		request.canceled = false;
		request.cancel = () => {
			request.canceled = true;
			cleanupScriptNode(response);
			reject(response);
		};

		const script = document.createElement('script');
		script.type = 'text/javascript';
		script.async = true;
		script.src = new UrlBuilder(request.path, request.params).build(callbackParams);

		function handlePossibleError() {
			if (typeof global[callbackName] === 'function') {
				response.error = 'loaderror';
				clearProperty(global, callbackName);
				cleanupScriptNode(response);
				reject(response);
			}
		}
		script.onerror = () => {
			handlePossibleError();
		};
		script.onload = script.onreadystatechange = (e) => {
			// script tag load callbacks are completely non-standard
			// handle case where onreadystatechange is fired for an error instead of onerror
			if ((e && (e.type === 'load' || e.type === 'error')) || script.readyState === 'loaded') {
				handlePossibleError();
			}
		};

		response.raw = script;
		const firstScript = document.getElementsByTagName('script')[0];
		firstScript.parentNode.insertBefore(script, firstScript);

	});
});
