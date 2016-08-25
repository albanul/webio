define(['factory'], function ($) {
	$.add("userSession", {}, "object", {
		handle: function (notification) {
			window.Cookies.set('session', this.guid);
			site.session = this.guid;
			if (notification.action === 0 && site.user !== null) {
				$('body').idleTimer('destroy');
				
				site.user._.ignoreClear = false;
				site.clear();

				$.observable(site).setProperty({
					authorized: false
				});

				if (site.refreshCaptchas) {
					site.refreshCaptchas();
				}

			}
		}
	});
});