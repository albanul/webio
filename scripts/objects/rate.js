define(['jquery', 'factory', 'language'], function($) {
	$.add('rate', {
		_: {}
	}, 'object', {
		handle: function(n) {
			var t = n.data;

			var c = $.collections[t.objectType][t.objectId];

			if (c) {
				// We forcely setting rating to 0 because
				// when we setting user-category rating we 
				// are losing data-link with an average 
				// rating value of a category.
				// Observable wouldn't rerender if the value 
				// hasn't changed
				c.rating = 0;
				c.votes = 0;
				// ======================================
				$.observable(c).setProperty({
					rating: t.rating,
					votes: t.votes
				});
			}
		}
	});
});