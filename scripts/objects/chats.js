define(['jquery', 'factory'], function ($) {
	$.add('chat', {
		_: {
			params: {
				sendArray: true,
				depth: 2
			}
		},
		messages: $.array({
			type: 'chatMessage',
			params: {
				type: 'ChatMessageListParams',
				order: true
			}
		}),
		contactsIds: [],
		contacts: $.array({ type: 'user' }),
		contactsTyping: []
	}, 'object', {
		views: {
			keys: {
				contacts: {
					view: '{^{for contacts}}<p>[#{^{:id}}]{^{:fname}} {^{:lname}}</p>{{/for}}',
					edit: ''
				},
				messages: {
					view: '{^{for messages}}{{/for}}',
					edit: ''
				}
			}
		},
		init: function (r) {
			$.init(this, r);

			this.messages._.params.chatId = this.id;
		},
		handle: function (n) {
			switch (n.action) {
				case 0:
					break;

				case 1:
					break;

				case 2:
					if (site.chats === 'dictionary') {
						site.chats.findAndRemoveOrClear(this.id);

											if ($.collections.chat[chat.id]) {
						delete $.collections.chat[chat.id];
						}
					} else {
						site.chats.__remove(this.id);
						$.setProperty(site.chats._, 'rows', site.chats._.rows - 1);
					}

					break;
			}
		}
	});

	$.add('chatMessage', {
		text: '',
		userIds: []
	}, 'object', {
		init: function (r) {
			this.clientId = this.clientId || $.getId();

			$.init(this, r);

			if (this.userIds.length > 0)
				$.observable(this).setProperty({
					viewed: true
				});
		},
		handle: function (n) {
			var self = this;

			switch (n.action) {
				case 0:
					var chat = $.collections.chat[this.chatId];

					if (chat && this.user !== site.user.id) {
						if (chat.kind === 0 || this.recieverId > 0) {
							var user = $.collections.user[this.user];

							if (user)
								$.setProperty(user, 'unviewedSentMessagesCount', (user.unviewedSentMessagesCount || 0) + 1);
						}

						$.setProperty(site.user, 'unviewedMessagesCount', (site.user.unviewedMessagesCount || 0) + 1);
					}

					// Target chat may be not loaded at that moment
					if (!chat) {
						$.create({
							_: {
								params: {
									type: 'chatParams',
									id: this.chatId,
									withMessages: 10
								}
							}
						}, 'object').load(function (r) {
							var newChat = $.create(r, 'chat');

							if (site.chats.type === 'dictionary') {
								if (newChat.messages.length > 0) {
									site.chats.unshift(newChat);
								}
							} else {
								site.chats.insert(0, newChat);
							}

							self.applyToChat(newChat, false);
						});
					} else {
						this.applyToChat(chat);
					}

					break;

				case 1:
					break;

				case 2:
					break;
			}
		},
		view: function (data) {
			var ids = this.userIds;
			if (!ids.get(data.user, function (a, b) {
					return a === b;
			})) {
				ids.push(data.user);

				if (data.user === site.user.id)
					$.observable(site.user).setProperty({
						unviewedMessagesCount: site.user.unviewedMessagesCount - 1
					});

				if (ids.length > 0)
					$.observable(this).setProperty({
						viewed: true
					});

				var chat = $.collections.chat[this.chatId];
				if (chat.kind === 0 && this.user !== site.user.id) {
					var user = $.collections.user[this.user];

					if (user.unviewedMessagesCount > 0) {
						$.setProperty(user, 'unviewedSentMessagesCount', user.unviewedSentMessagesCount - 1);
					}
				}
			}
		},
		applyToChat: function (chat, insertMessage) {
			if (insertMessage || insertMessage === undefined) {
				chat.messages.insert(0, this);
			}

			$.observable(chat).setProperty({
				last: new Date(this.time)
			});

			if (site.chats.type === 'dictionary') {
				var page = site.chats.getElementPage(chat.id);
				if (page) {
					site.chats.findAndReorderOrClear(chat.id, 0, true, null, page);
				} else {
					site.chats.unshift(chat);
				}

				//if first page of chats-dictionary isn't loaded
				//then every time user receive message in this chat
				//dictionary.unshift will cause current page to reload
				site.chats.getPage(1);
			} else {
				$.observable(site.chats).move(site.chats.search(chat.id), 0, 1);
			}

			var i = chat.contactsTyping.indexOf(this.user);

			if (i >= 0)
				chat.contactsTyping.remove(i);
		}
	});

	$.add('chatUser', {}, 'object', {
		init: function(r) {
			this.clientId = this.clientId || $.getId();

			$.init(this, r);
		},
		handle: function (n) {
			var chat = $.collections.chat[this.chatId];

			switch (n.action) {
				case 0:
					if (!chat) {
						chat = $.create(this.chat, 'chat');

						if (site.chats.type === 'dictionary') {
							if (chat.messages.length > 0) {
								site.chats.unshift(chat);
							}
						} else {
							site.chats.insert(0, chat);
						}
					}

					if (chat.contacts.search(this.user) === -1) {
						chat.contacts._push($.collections.user[this.user]);
					}
					if (chat.contactsIds.indexOf(this.user) === -1) {
						chat.contactsIds._push(this.user);
					}

					break;

				case 1:
					break;

				case 2:
					if (site.user.id === this.user) {
						if (site.chats.type === 'dictionary') {
							site.chats.findAndRemoveOrClear(chat.id, true);
						} else {
							site.chats.remove(site.chats.search(chat.id));

							chat.clear();

							$.setProperty(site.chats._, 'rows', site.chats._.rows - 1);
						}
						if ($.collections.chat[chat.id]) {
							delete $.collections.chat[chat.id];
						}
					} else {
						chat.contacts.remove(chat.contacts.search(this.user));
						chat.contactsIds.remove(chat.contactsIds.indexOf(this.user));
					}

					break;
			}
		},
		views: {
			keys: {
				chat: {
					show: false
				}
			}
		}
	});

	$.add('typing', {
		chatId: 0,
		user: 0
	}, 'object', {
		handle: function (n) {
			var data = n.data;

			if (data.user === site.user.id)
				return;

			var chat = $.collections.chat[data.chatId];

			// Target chat may be not loaded at that moment
			if (!chat)
				return;

			var contactsTyping = chat.contactsTyping;

			contactsTyping._push(data.user);

			setTimeout(function () {
				var i = contactsTyping.indexOf(data.user);

				if (i >= 0)
					contactsTyping.remove(i);
			}, 5000);

			if (site.chats.type === 'dictionary') {
				var page = site.chats.getElementPage(chat.id);
				if (page) {
					site.chats.findAndReorderOrClear(chat.id, 0, true, null, page);
				} else {
					site.chats.unshift(chat);
				}
			} else {
				$.observable(site.chats).move(site.chats.search(chat.id), 0, 1);
			}
		}
	});
});