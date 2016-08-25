define(['jquery', 'factory'], function ($) {
	$.add('comment', {
		_: {
			params: { type: 'newCommentTree', sendArray: true, sendObject: false, depth: 5, count: 100 },
			fields: { children: 'children', parent: 'comment', child: 'objectId' },
			loaded: false
		},
		children: $.array({ type: 'comment' }),
		text: '',
		usr: { type: 'user' },
		expanded: true,
		show: true
	}, 'tree', {
		init: function (r) {
			this.clientId = this.clientId || $.getId();

			$.init(this, r);

			var self = this;

			this[this._.fields.children].forEach(function (item, index) {
				item._.parent = self;
				item._.index = index;
			});
		},
		unique: function (d) {
			// if you create new comment you should set flag ignoreUnique in true
			var items = $.collections.comment,
				result = null;

			if (d.id) {
				result = items[d.id] || null;
			} else {
				Object.keys(items).forEach(function (key) {
					var item = items[key];
					// if it's root comments node, which don't have id
					if (item && item.objectId === d.objectId && item.objectType && d.objectType && item.objectType.toLowerCase() === d.objectType.toLowerCase() && item.id <= 0) {
						result = item;
						return;
					}
				});
			}

			return result;
		},
		handle: function (notification) {
			var comment = this;

			var items = $.collections[comment.objectType];
			if (!items) return;

			var target = items[comment.objectId];
			if (target) {
				target.commented && target.commented(this);
			}

			switch (notification.action) {
				case 0: // New comment
					var addParent = this.getParentComment();
					if (addParent && target && target.comments._.loaded) {
						addParent.push(this, true);
						$.observable(addParent).setProperty({ expanded: true });
					}
					break;
				case 1: // Update comment
					break;
				case 2: // Remove comment
					var parent = this.getParentComment();
					if (parent) {
						var index = parent.children.search(comment.id);
						if (index !== -1) {
							parent.remove(index);
						}
					}
					break;
			}
		},
		getParentComment: function () {
			var comment = this;
			return $.collections.comment[comment.parent || Object.keys($.collections.comment)._get(function (element) {
				var r = false;
				if ($.collections.comment[element]) {
					var item = $.collections.comment[element]._.params;
					r = (item && item.objectId === comment.objectId && item.objectType.toLowerCase() === comment.objectType.toLowerCase());
				}
				return r;
			})];
		},
		views: {
			keys: {
				usr: {
					view: '{^{for usr}}<p>[#{^{:id}}]{^{:fname}} {^{:lname}}</p>{{/for}}',
					edit: ''
				},
				text: {
					view: '<div style="max-width: 500px;">{{:text}}</div>',
					edit: ''
				},
				children: {
					show: false
				},
				parent: {
					view: '{^{:parent}}',
					show: false
				},
				objectType: {
					view: '{^{:objectType}}',
					show: false
				}
			}
		}
	});

	$.add('icomment', {}, {
		// need to call after base init
		initComment: function() {
			if (!this.comments || !this.comments._) {
				// create new comments object and set id = 0 because it is root node
				$.observable(this).setProperty({
					comments: $.create({
						_: { params: { objectId: this.id, objectType: this.type } },
						objectId: this.id,
						objectType: this.type,
						id: 0
					}, 'comment')
				});

				// new icomment item created set for comments loaded in true
				if (this.id <= 0) {
					this.comments._.loaded = true;
				}
			} else {
				$.observable(this.comments).setProperty({ objectId: this.id });
				$.observable(this.comments._.params).setProperty({ objectId: this.id });
			}
		}
	});
});