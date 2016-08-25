define(['factory'], function() {
	$.add('notificationUser', {}, 'object', {
		handle: function (notification) {
			var notifications = site.activeNotifications;
			if (this.CleanAll) {
				notifications.clear();

				$.observable(notifications._).setProperty({ rows: 0 });
			} else {
				if (notifications.length > 0) {
					notifications.remove(0);
				}

				$.observable(notifications._).setProperty({ rows: notifications._.rows - 1 });

				notifications.lazyload(10);
			}
		}
	});
});