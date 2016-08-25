window.nodejs = false;

require.config({
	baseUrl: '../../../../../',
	paths: {
		text: 'common/scripts/libs/text',
		json: 'common/scripts/libs/json',

		baseConfig: 'common/scripts/config.json'
	}
});

require(['json!baseConfig'], function (baseConfig) {
	require.config(baseConfig);

	require.config({
		baseUrl: '../../../../../',
		map: {
			'*': {
				codemirror: 'common/scripts/libs/codemirror/lib/codemirror',
				'css': 'node_modules/require-css/css'
			}
		},
		paths: {
			data: 'common/scripts/jsviews/rating/tests/data'
		}
	});

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