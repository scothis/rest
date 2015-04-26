/*
 * Copyright 2013-2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

import interceptor from '../../interceptor';

/*jshint -W079 */
const XMLHttpRequest = (() => {
	// derived from https://github.com/cujojs/poly/blob/0.5.1/xhr.js
	if (global.XMLHttpRequest) {
		return global.XMLHttpRequest;
	}

	const progIds = [
		'Msxml2.XMLHTTP',
		'Microsoft.XMLHTTP',
		'Msxml2.XMLHTTP.4.0'
	];
	let xhr;

	function tryCtor(progId) {
		try {
			/*jshint nonew:false */
			new global.ActiveXObject(progId);
			xhr = () => { return new global.ActiveXObject(progId); };
		}
		catch (ex) {}
	}

	while (!xhr && progIds.length) {
		tryCtor(progIds.shift());
	}

	return xhr;
}());

/**
 * Defaults request.engine to XMLHttpRequest, or an appropriate ActiveX fall
 * back
 *
 * @param {Client} [client] client to wrap
 *
 * @returns {Client}
 */
export default interceptor({
	request(request) {
		request.engine = request.engine || XMLHttpRequest;
		return request;
	}
});
