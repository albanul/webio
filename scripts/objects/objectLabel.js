define(['factory'], function () {
	$.add('objectLabel', {}, 'object', {
		handle: function (notification) {
			var objectLabel = this,
				tmpType = objectLabel.objectType[0].toLowerCase() + objectLabel.objectType.slice(1),
				type = $.stc[tmpType] || tmpType,
				items = $.collections[type];
			
			if (items) {
				var target = items[objectLabel.objectId];
				if (target) {
					if (notification.action === 0) {
						target.labelIds._push(objectLabel.labelId);
					} else if (notification.action === 2) {
						target.labelIds.__remove(objectLabel.labelId);
					}
				}
			}
		}
	});
});