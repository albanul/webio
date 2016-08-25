define(['factory'], function () {
	$.add('tableColumn', {
		_: {
			params: {
				sendArray: true,
				sendObject: true,
				depth: 2,
				count: 10
			}
		},
		tableName: '',
		name: '',
		filed: ''
	}, 'object', {
		updateColumn: function() {
			var table = $.collections.xpath('tableInfo', 'tableName', this.tableName);

			if (table) {
				$.observable(table).setProperty({ ColumnsUpdated: table.ColumnsUpdated - 1, ColumnsNone: table.ColumnsNone + 1 });
			}
		}
	});
});