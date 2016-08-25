define(['jquery', 'factory', 'language'], function($) {
	$.add('favorite', {
		_: {}
	}, 'object', {
		handle: function(n) {
			var t = n.data;

			if (site.user && t.user === site.user.id) {
				var c = $.collections[t.objectType][t.objectId];

				if (c != null) {
					switch (n.action) {
						case 0:
							$.observable(c).setProperty({
								favorite: true,
								favorites: 1
							});
							break;
						case 1:
							break;
						case 2:
							$.observable(c).setProperty({
								favorite: false,
								favorites: 0
							});
							break;
					}
				}
			}
		}
	});
});