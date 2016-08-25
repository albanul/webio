/**
 * Created by Alex on 25.08.2016.
 */

var chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	timeout = 5000;

describe('rating', function () {

	// var host = 'http://localhost';
	var htmlPath = process.cwd() + '/scripts/jsviews/rating/tests/test.html';

	browser.url(htmlPath);

	it('page title must be equal to "rating"', function() {
		var title = browser.getTitle();
		assert.equal(title, 'rating');
	});

	it('rating tag must be visible', function () {
		browser.waitForVisible('.stars', timeout);
	});

	// it('set rating', function () {
	//
	// });
});