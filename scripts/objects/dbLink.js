define(['jquery', 'factory'], function ($) {
	$.add('dbLink', {
		user: null,
		lifeTime: null,
		objectType: null
	}, 'object', {
		init: function (r) {
			this.clientId = this.clientId || $.getId();

			$.init(this, r);
		}
	});
});