(function (buster, define) {

	var branch, assert, refute;

	assert = buster.assertions.assert;
	refute = buster.assertions.refute;

	buster.testCase('rest/interceptor/branch', {
		setUp: function (done) {
			if (branch) { return done(); }
			define('rest/interceptor/branch-test', ['rest/interceptor/branch'], function (b) {
				branch = b;
				done();
			});
		},

		'should return the `then` client when test is truthy': function (done) {
			function expectedClient() { assert(true); done(); }
			branch({
				if: function () { return true; },
				then: expectedClient
			})();
		},
		'should return the `else` client when test is falsey': function (done) {
			function expectedClient() { assert(true); done(); }
			branch({
				if: function () { return false; },
				else: expectedClient
			})();
		},
		'should return the client returned by the `if`': function (done) {
			function expectedClient() { assert(true); done(); }
			branch({
				if: function () { return expectedClient; }
			})();
		},
		'should return the default client when `then` is needed and not provided': function (done) {
			function expectedClient() { assert(true); done(); }
			branch(expectedClient, {
				if: function () { return true; }
			})();
		},
		'should return the default client when `else` is needed and not provided': function (done) {
			function expectedClient() { assert(true); done(); }
			branch(expectedClient, {
				if: function () { return false; }
			})();
		}
	});

}(
	this.buster || require('buster'),
	typeof define === 'function' ? define : function (id, deps, factory) {
		factory(require('../../src/rest/interceptor/branch'));
	}
	// Boilerplate for AMD and Node
));
