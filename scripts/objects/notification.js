define(['jquery', 'factory'], function ($) {
	$.add('notification', {
		usr: { type: 'user' },
		users: $.array({ type: 'object', params: { type: 'NotificationUserList', withRows: true, notificationId: 36197 }, autofill: true })
	}, 'object', {
		views: {
			keys: {
				deleted: {
					show: false
				},
				show: {
					show: false
				},
				data: {
					show: false
				},
				action: {
					show: false
				},
				ids: {
					show: false
				},
				userObject: {
					show: false
				},
				LangInfos: {
					caption: 'Description',
					view: '{^{for LangInfos[~root^lang]}} {^{:onlineText}} {{/for}}'
				},
				users: {
					show: false
				},
				links: {
					view: '{^{spoiler id="notif-users-spoiler"}}<a class="show-more" data-link="{on handlers.loadUsersToNotification}">...</a>{{else}}<ul class="notificationUsers">{^{for users}}<li>{{:name}}</li>{{/for}}</ul>{{/spoiler}}'
				},
				usr: {
					show: false
				}
			}
		},
		handlers: {
			loadUsersToNotification: function (event, data) {
				data = data.linkCtx.data;

				if (!data.users._.loaded) {
					$.observable(data.users._.params).setProperty({ notificationId: data.id });
					data.users.load(20, function () { });
				}

			}
		},
		init: function(r) {
			$.init(this, r);

			if(this.usr && this.usr.color){
				this.usr.color = (this.usr.color.indexOf('#') !== -1) ? this.usr.color : '#' + this.usr.color;
			}

		}
	});
});
