define(['factory'], function () {
	$.add('screen', {
		_: {
			params: { sendObject: true, sendArray: true }
		},
		LangInfos: [
			{ lang: "en", name: "", description: "" },
			{ lang: "ru", name: "", description: "" }
		]
	}, 'object', {
		handle: function (notification) {
			var screen = this,
				tmpType = screen.objectType[0].toLowerCase() + screen.objectType.slice(1),
				type = $.stc[tmpType] || tmpType,
				target = $.collections[type][screen.objectId];

			if (target) {
				switch (notification.action) {
					case 0:
						if (notification.user !== site.user.id) {
							target.screens._push(screen);
						}
						break;
					case 2:
						target.screens.__remove(screen.id);
						break;
				}
			}
		}
	});
});