define(['factory'], function () {
	$.add('tableInfo', {
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
		filed: '',
		tableColumns: $.array({ type: 'tableColumn', params: { type: 'tablecolumnlist' } })
	}, 'object', {
		init: function (r) {
			this.clientId = this.clientId || $.getId();

			$.init(this, r);

			if (!this.observed) {
				this.observed = true;

				$.observe(this, 'ColumnsNone', function (event, eventArgs) {
					if (event.target.tableColumns.length === eventArgs.value) {
						$.observable(event.target).setProperty({action: 0});
					}
				});
			}
		}
	});
});