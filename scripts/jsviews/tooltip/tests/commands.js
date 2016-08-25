module.exports = function (client, timeout) {
	var assert = require('assert'),
		utils = require('../../../testUtils');

	timeout = timeout || 5000;

	var spoilerCommands = require('./../../spoiler/tests/commands');

	spoilerCommands(client, timeout);

}