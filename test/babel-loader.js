/*
 * Copyright 2015 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

(function (global, document, globalEval) {

/**
 * curl.js loader for ES6 transpiling via babel
 *
 * Derived from `curl/loader/legacy`
 *
 * Do not use in production, it will be slow
 */
define(['babel', 'curl/plugin/_fetchText', 'curl/_privileged'], function (babel, fetchText, priv) {

	var head, insertBeforeEl, checkToAddJsExt;

	head = document && (document['head'] || document.getElementsByTagName('head')[0]);
	// to keep IE from crying, we need to put scripts before any
	// <base> elements, but after any <meta>. this should do it:
	insertBeforeEl = head && head.getElementsByTagName('base')[0] || null;

	checkToAddJsExt = priv['core'].checkToAddJsExt;

	function wrapSource (source, resourceId, fullUrl) {
		// if (fullUrl.match(/^\/test\//) || fullUrl.match(/\.spec\./)) {
		// 	// not ES6
		// 	var sourceUrl = fullUrl ? '//# sourceURL=' + window.location.origin + fullUrl.replace(/\s/g, '%20') + '' : '';
		// 	return source.replace('define(', "define('" + resourceId + "',") + '\n' + sourceUrl;
		// }
		var out = babel.transform(source, {
			filename: fullUrl,
			sourceMaps: 'inline',
			moduleId: resourceId,
			modules: 'amd'
		});
		return out.code;
	}

	var injectSource = function (el, source) {
		// got this from Stoyan Stefanov (http://www.phpied.com/dynamic-script-and-style-elements-in-ie/)
		injectSource = ('text' in el) ?
			function (el, source) { el.text = source; } :
			function (el, source) { el.appendChild(document.createTextNode(source)); };
		injectSource(el, source);
	};

	function injectScript (source) {
		var el = document.createElement('script');
		injectSource(el, source);
		el.charset = 'utf-8';
		head.insertBefore(el, insertBeforeEl);
	}

	wrapSource['load'] = function (resourceId, require, callback, config) {
		var errback, url, sourceUrl;

		errback = callback['error'] || function (ex) { throw ex; };
		url = checkToAddJsExt(require['toUrl'](resourceId), config);
		sourceUrl = config['injectSourceUrl'] !== false && url;

		fetchText(url, function (source) {
			source = wrapSource(source, resourceId, sourceUrl);

			if (config['injectScript']) {
				injectScript(source);
			}
			else {
				//eval(source);
				globalEval(source);
			}

			// call callback now that the module is defined
			callback(require(resourceId));
		}, errback);
	};

	return wrapSource;

});

}(this, this.document, function () { /* FB needs direct eval here */ eval(arguments[0]); }));
