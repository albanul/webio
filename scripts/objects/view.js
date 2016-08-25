define(['jquery', 'factory'], function($) {
	$.add('view', {}, 'object', {
		handle: function(n) {
			var data = n.data,
				items = $.collections[data.objectType];

			if (!items) return;

			var item = items[data.objectId];

			if (!item || !item.view) return;

			item.view(data);
		}
	});
});