window.nodejs = false;

require.config({
	baseUrl: '../../../',
	paths: {
		text: 'libs/text',
		json: 'libs/json',
		data: 'scripts/jsviews/rating/tests/data',

		baseConfig: './tests/config.json'
	}
});

require(['json!baseConfig'], function (baseConfig) {
	require.config(baseConfig);

	require(['jsviews', 'data', 'bootstrap', 'factory', 'rating'], function ($, data) {
		$.templates({
			tmplTest: '#tmplTest'
		});

		$.site = {};
		window.path = '/';

		var testData = {
			options: data
		};

		$.link.tmplTest('#main', testData);
	});
});