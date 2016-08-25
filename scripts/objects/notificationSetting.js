define(['factory'], function ($) {
	$.add('notificationSetting', {
		_: {
			params: {
				sendArray: true,
				sendObject: true,
				depth: 1,
				count: 100
			},
			edit: false
		}
	}, 'object', {
		init: function (r) {
			this.clientId = this.clientId || $.getId();

			$.init(this, r);

			if (!this.observed) {
				this.observed = true;

				$.observe(this, 'mail', 'sms', 'online', 'duplicateOnlineByEmail', 'duplicateOnlineBySms', 'duplicateMailBySms', function(ev, arg) {
					ev.target.save();
				});
			}
		}
	});
});