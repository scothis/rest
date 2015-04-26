/*
* Copyright 2014-2015 the original author or authors
* @license MIT, see LICENSE.txt for details
*
* @author Scott Andrews
*/

export default {

	/**
	 * Parse a MIME type into it's constituent parts
	 *
	 * @param {string} mime MIME type to parse
	 * @return {{
	 *   {string} raw the original MIME type
	 *   {string} type the type and subtype
	 *   {string} [suffix] mime suffix, including the plus, if any
	 *   {Object} params key/value pair of attributes
	 * }}
	 */
	parse(mime) {
		const params = mime.split(';');
		const type = params[0].trim().split('+');

		return {
			raw: mime,
			type: type[0],
			suffix: type[1] ? '+' + type[1] : '',
			params: params.slice(1).reduce((params, pair) => {
				pair = pair.split('=');
				params[pair[0].trim()] = pair[1] ? pair[1].trim() : void 0;
				return params;
			}, {})
		};
	}

};
