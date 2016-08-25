/**
 * Created by Alex on 25.08.2016.
 */

var assert = require('chai').assert;

describe('test', function () {
	it('fail', function () {
		assert.equal(1, 0);
	});

	it('success', function () {
		assert.equal(1, 1);
	});
});