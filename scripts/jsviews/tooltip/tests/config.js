require.config({ baseUrl: '../../../../../', paths: { baseConfig: 'common/scripts/config' } });

require(['baseConfig'], function () {
	require.config({
		baseUrl: '../../../../../',
		map: {
			'*': {
				codemirror: 'common/scripts/libs/codemirror/lib/codemirror',
				'css': 'node_modules/require-css/css'
			}
		},
		paths: {
			data: 'common/scripts/jsviews/tooltip/tests/data'
		}
	});

	require(['jsviews', 'data', 'bootstrap', 'factory', 'tooltip'], function ($, data) {
		$.templates({
			tmplTest: '#tmplTest'
		});

		window.site = {};

		var testData = {
			options: data
		}

		$.link.tmplTest('#main', testData);
	});
});