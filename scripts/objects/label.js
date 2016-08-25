define(['factory'], function () {
	$.add('label', {
		_: {
			params: {
				sendArray: true,
				depth: 1,
				count: 100
			}
		},
		langs: [
			{ name: '', lang: 'en' },
			{ name: '', lang: 'ru' }
		],
		availableType: '',
		colour: ''
	}, 'object', {
		handle: function (notification) {
			var label = this,
				tmpType = label.objectType[0].toLowerCase() + label.objectType.slice(1),
				type = $.stc[tmpType] || tmpType,
				target = $.collections[type][label.objectId];

			if (target) {
				if (notification.action === 0) {
					if (notification.user !== site.user.id) {
						target[label.availableType ? label.availableType + 'Labels' : 'labels']._push(label);
					}
				} else if (notification.action === 2) {
					var items = $.collections[label.availableType];

					if (items) {
						Object.keys(items).forEach(function (id) {
							items[id].labelIds.__remove(label.id);
						});
					}

					target[label.availableType ? label.availableType + 'Labels' : 'labels'].__remove(label.id);
				}
			}
		},
		init: function (r) {
			$.init(this, r);

			this.colour = (this.colour.indexOf('#') !== -1) ? this.colour : '#' + this.colour;
		},
		views: {
			keys: {
				langs: {
					caption: 'Description',
					view: '{^{for langs[~root^lang]}} {^{:description}} {{/for}}'
				}
			}
		}
	});

	$.add('objectLabel', {}, 'object', {
		handle: function (notification) {
			var objectLabel = this,
				tmpType = objectLabel.objectType[0].toLowerCase() + objectLabel.objectType.slice(1),
				type = $.stc[tmpType] || tmpType,
				items = $.collections[type],
				labelId = objectLabel.labelId;

			if (items) {
				var target = items[objectLabel.objectId];
				if (!target && notification.action === 0 && type === 'task') {
					target = $.create(objectLabel.target, 'task');
				}
				if (target) {
					if (notification.action === 0) {
						target.labelIds._push(objectLabel.labelId);
						if (target.type === 'task') {
							site.tasks.updateArray(target);
						}
					} else if (notification.action === 2) {
						labelId = -objectLabel.labelId;
						target.labelIds.__remove(objectLabel.labelId);
						if (target.type === 'task') {
							site.tasks.updateArray(target);
						}
					}

					target.labeled && target.labeled(this, notification);
				}
			}

			if (type === 'task') {
				var task = objectLabel.target,
					filters = site.filters;
				var prevLabelIds = task.labelIds.slice();
				if (labelId > 0) {
					task.labelIds._push(objectLabel.labelId);
				} else {
					task.labelIds.__remove(objectLabel.labelId)
				}
				var isOldCorrect = site.filters.checkTaskForActivityTab(task.project, task.status, prevLabelIds),
					isCurrentCorrect = site.filters.checkTaskForActivityTab(task.project, task.status, task.labelIds),
					isAddTime = isCurrentCorrect;
				if (isOldCorrect !== isCurrentCorrect) {
					site.activity.updateArray(task.id, isAddTime);
				}
			}
		}
	});

	$.add('ilabel', {}, {
		addLabel: function (item) {
			$.create({ objectId: this.id, labelId: item.id || item, objectType: this.type }, 'objectLabel').save();
			return false;
		},
		removeLabel: function (item) {
			$.create({ objectId: this.id, labelId: item.id || item, objectType: this.type, deleted: true }, 'objectLabel').save();
			return false;
		}
	});
});