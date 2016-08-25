define(['jquery', 'factory'], function($) {
	$.add('blockInfo', {}, 'object', {
		views: {
			keys: {
				restriction: {
					view: '{^{if restriction === 0}}Captcha{{else status === 1}}Ban{{/if}}',
					edit: ''
				},
				time: {
					view: '{^{:~longTimeToStr(time)}}',
					edit: ''
				}
			}
		}
	});
})