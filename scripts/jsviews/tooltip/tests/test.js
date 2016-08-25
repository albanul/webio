var webdriverio     = require('webdriverio'),
	requirejs       = require('requirejs'),
	assert          = require('assert'),
	applyCommands   = require('./commands'),
	ELEMENT_TIMEOUT = 5000;

requirejs.config({
	baseUrl: '/',
	paths: {
		data: process.cwd() + '/common/scripts/jsviews/tooltip/tests/data'
	}
});

var data = requirejs('data');

describe('select', function () {
	// Disable test timeout
	this.timeout(0);

	var client   = {},
		htmlPath = host + '/common/scripts/jsviews/tooltip/tests/test.html';

	before(function (done) {
		client = webdriverio.remote({
			desiredCapabilities: {
				browserName: 'chrome'
			}
		});

		// Extend client with custom commands
		applyCommands(client);

		client
			.init()
			// Set implicit timeouts
			.timeoutsImplicitWait(ELEMENT_TIMEOUT)
			.url(htmlPath)
			.call(done);
	});

	var makeTest = function (item) {
		it(item.description, function (done) {
			item.code(client, done, item);
		});
	}

	for (var i = 0; i < data.length; i++) {
		makeTest(data[i]);
	}

	after(function (done) {
		client.end(done);
	});
});