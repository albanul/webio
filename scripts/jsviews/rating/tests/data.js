define([], function () {
	return [
		{
			description: 'rating',
			id: 'rating',

			code: function (client, done, item) {
				client
						.ratingAddRating()
						.call(done);
			}
		}
	];
});