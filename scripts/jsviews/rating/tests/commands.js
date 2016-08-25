module.exports = function (client, timeout) {
	timeout = timeout || 5000;

	// var spoilerCommands = require('./../../spoiler/tests/commands');
	//
	// spoilerCommands(client, timeout);

	client.addCommand('ratingAddRating', function () {
		return this
			.waitForVisible('.stars', timeout)
			.click('.stars star-item:last-child');
	}, true);

}