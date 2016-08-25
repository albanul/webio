define(['factory', 'url', 'page'], function ($) {
	$.add('site', {
		_: {
			params: {
				type: 'init'
			}
		},
		useSignalr: true,
		useSignalrForRequests: false,
		lang: 0,
		pages: $.array({
			type: 'auto',
			params: {
				ignoreClear: true
			}
		}),
		maps: {},
		active: null,
		session: null,
		dialogs: $.array({
			params: {
				ignoreClear: true
			}
		}),
		titles: {
			defaultTitle: '',
			customTitle: ''
		},
		access: {
			personal: 0,
			free: 1,
			secure: 2,
			Manager: 3,
			Admin: 4			
		}
	}, 'object', {
		baseinit: function (r) {
			$.init(this, r);

			if (!this.baseInitialize) {
				this.baseInitialize = true;
				this.dfd = $.Deferred();

				if (!nodejs) {
					this._.params.path = location.pathname.slice(1);

					this.setObserveTitle();
				}
			}
		},
		init: function (r) {
			this.baseinit(r);
		},
		onSelect: function (ev, arg) {
			var value = arg.value;

			$.observable(arg.oldValue).setProperty('active', false);
			$.observable(site).setProperty('active', value);

			if (value.dfd)
				value.dfd.done(function () {
					if (value.access === site.access.secure && site.user === null) {
						var state = {
							title: '',
							url: site.defaultFree
						};

						History.pushState({ 'for': 'tabs' }, state.title, state.url);
					} else {
						if (value.checkTwins)
							value.checkTwins();

						if (value.create && !value.created) {
							value.create();
						}

						value.activate();
					}
				});

			return true;
		},
		setPage: function (options, tabs) {
			if (options.dontset)
				return null;

			var pageType = options.sectiontype !== 1 ? options.name : 'page';

			switch (tabs.urls) {
				case 'full':
					if (options.realpath[0] === '/') {
						options.realpath = options.realpath.slice(1);
					}

					break;

				case 'hash':
					options.realpath = url.getStateHash()[tabs.id] || tabs.defaultPath;

					break;

				case 'search':
					options.realpath = url.getStateSearch()[tabs.id] || tabs.defaultPath;
			}

			$.getObject({
				_: {
					params: {
						path: options.path.replace(/^\//, ''),
						urls: tabs.urls
					}
				},
				typePath: options.name.toLowerCase(),
				realpath: options.realpath.replace('#!', '').toLowerCase(),
				name: options.name,
				path: options.path.replace(/^\//, ''),
				sectiontype: options.sectiontype
			}, pageType, function (r) {
				if (r.sectiontype !== 0 && r.dfd) {
					r.dfd.resolve("page complete");
				}

				if (r.dfd)
					r.dfd.done(function () {
						var i = tabs.tabs.search('name', r.name);
						if (i !== -1 && tabs.tabs[i].checkPath) {
							if (!tabs.tabs[i].checkPath('/' + r.realpath)) i = -1;
						}

						if (i === -1) {
							r.active = false;
							r.show   = false;

							tabs.tabs._push(r);
							i = tabs.tabs.length - 1;
						}

						var uri = '/' + url.decompose('/' + r.realpath).path.reduce(function (a, b) {
							return a + '/' + b;
						});

						if (tabs.urls === 'full' && location.pathname.toLowerCase() !== encodeURI(uri)) {
							var name = r.langs && r.langs.length > 0 ? r.langs[0].title : r.name;

							url.pushState({
								tag: 'tabs'
							}, name, '/' + r.realpath);
						}

						tabs.setTab(i, 'nothing');
					});
			});

			return true;
		},
		login: function (r) {
			if (r.user) {
				$.setProperty(this, {
					user: $.create(r.user, 'user')
				});

				this.user._.ignoreClear = true;
				this.user._.setNullInsteadEmptyObject = true;
			}
		},
		logoff: function () {
			$.create({
				type: 'logoff'
			}, 'object').save();

			return false;
		},
		// dialogs
		loginDialog: function () {
			$('#login-dialog').dialog('open');
		},
		captchaDialog: function () {
			require(['captchaDialog'], function () {
				$.view('#captchaDialog').tag.pop();
			});
			return false;
		},
		banDialog: function() {
			require(['banDialog'], function() {
				$.view('#banDialog').tag.pop();
			});
			return false;
		},
		showLoginCount: function (loginCount) {
			var message = 'You have been visiting the site for'.toTranslated() + ' ' + loginCount;
			if (site && site.lang === 0) {
				message += ' days';
			} else {
				var day = loginCount % 10;
				var decade = loginCount % 100;
				if (day === 1 && decade !== 11) {
					message += ' день';
				} else if (day >= 2 && day <= 4 && (decade <= 10 || decade >= 20)) {
					message += ' дня';
				} else {
					message += ' дней';
				}
				message += ' подряд';
			}
			site.notify('info', message);
		},
		wrongLinkDialog: function() {
			$('.loader').fadeOut();
			Confirm('We\'re sorry, this link is outdated', 'Outdated link');
			return false;
		},
		timeoutDialog: function () {
			$('.loader').fadeOut();
			Confirm('We\'re sorry, looks like one of the services is not available, we are already working on this incident, try to return later....', 'Request timeout!');
		},
		requireDialog: function () {
			$('.loader').fadeOut();
			Confirm('We\'re sorry, looks like one of the services is not available, we are already working on this incident, try to return later....', 'Request timeout!', function() {
				location.reload();
			});
		},
		refreshCaptchas: function() {
			$.each($('.captchaImageContainer'), function (index, value) {
				var tag = $(value).view().tag;
				if (tag && tag.reset) {
					tag.reset();
				}
			});
		},
		updates: function (callback) {
			var self = this;
			this.update.save(function (d, m) {
				var newTicks = d.ticks;
				if (newTicks !== 0) {
					self.ticks = newTicks;
					self.update.ticks = newTicks;
				}

				var index = d.notifications.search('kind', 98);
				if (index > -1) {
					var guid = d.notifications[index].data.guid;
					self.session = guid;
					self.update.guid = guid;
					window.Cookies.set('session', guid);
					self.loginDialog();
				} else {
					self.update.guid = m.session;
					window.Cookies.set('session', m.session);
					self.handle(d.notifications);
				}
				if (callback) callback(d);
				setTimeout(function () {
					self.updates(callback);
				}, 50);
			});
		},
		seo: function (r) {
			if (!nodejs && r && r.langs && r.langs.length > 0) {
				var lang = r.langs.length > this.lang ? this.lang : 0;
				$(document).attr('title', r.langs[lang].title);
				$('meta[name="keywords"]').attr('content', r.langs[lang].keywords);
				$('meta[name="description"]').attr('content', r.langs[lang].description);
			}
		},
		fillOgTags: function (obj) {
			Object.keys(obj).forEach(function (val) {
				$('meta[property="og:' + val + '"]').attr('content', obj[val]);
			});
		},
		initFinish: function (r) {
			var self = this;

			if (self.useSignalr) {
				require(['signalr', 'utils'], function () {
					$.connection.hub.logging = true;
					$.connection.hub.url = "/signalr";
					var updateQueryString = function () {
						$.connection.hub.qs = {
							sessionGuid: site.session || window.Cookies.get('session')
						};
					};

					updateQueryString();

					$.connection.hub.error(function (error) {
						console.log('SignalR error: ' + error);
					});

					var notificationHub = $.connection.notificationHub;
					notificationHub.client.handle = function (data) {
						self.handle([data]);
					};

					self.hub = notificationHub;
					$.connection.hub.start({ waitForPageLoad: false }).done(function () {
						console.log("SignalR connected");

						updateQueryString();

						if (self.useSignalrForRequests) {
							$.requestObject = function(params) {
								var request = {
									data: JSON.stringify(params),
									sessionGuid: params.session,
									type: params.type
								};

								return self.hub.server.handle(request);
							};
						}

						if (self.onConnect && typeof self.onConnect == 'function' && self.user) self.onConnect();
					});

					var currentConnectinon = $.connection.notificationHub.connection;
					//Connection Status:
					// 0 - connecting
					// 1 - connected
					// 2 - reconnecting
					// 4 - disconnected

					if (self.connected) return;

					self.connected = true;

					$.connection.hub.connectionSlow(function () {
						self.notify("error", "Connection problem detected", "Connection problem");
					});

					$.connection.hub.reconnecting(function () {
						if (currentConnectinon.state === 1) {
							return;
						}

						self.notify("info", "Trying to reconnect", "Reconnecting");
					});

					$.connection.hub.reconnected(function () {
						if (currentConnectinon.state !== 1) {
							return;
						}

						self.notify("success", "Reconnected successfully", "Connection recovered");
						self.onReconnected();
					});

					$.connection.hub.disconnected(function () {
						if (currentConnectinon.state !== 4) {
							return;
						}

						self.notify("error", "Reconnecting failed. Trying to create new connection", "Connection lost");
						setTimeout(function () {
							if (currentConnectinon.state === 4) {
								// set new session before reconnect signalr
								updateQueryString();
								$.connection.hub.start().done(function() {
									self.notify("success", "New connection created", "Connection created");
								});
							}
							self.connectionStopped = false;
						}, self.connectionStopped ? 0 : 5000);
					});
				});
			} else {
				if (r.guid && (!self.updatesIgnorePlatforms || !(RegExp(self.updatesIgnorePlatforms).test(navigator.platform)))) {
					self.update = $.create({
						type: 'updateparams',
						ticks: 0,
						guid: self.session || window.Cookies.get('session')
					}, 'object');

					self.update._.resend = true;
					self.updates();
				}
			}
		},
		fromToLimit: function (siblingId, date) {
			if (date !== "") {
				var option = siblingId === "from" ? "maxDate" : "minDate";
				var el = $.view("#" + siblingId).ctx.tag.datepicker.input[0];
				var choosenDate = $(el).val();
				$(el).datepicker("option", option, date);
				if (choosenDate) {
					$(el).datepicker("setDate", choosenDate);
					$(el).val(choosenDate);
				}
			}
		},
		initFail: function () {

		},
		notify: function (type, text , customClass) {
			if (site.user)
				createNotify(text.toTranslated(), type , customClass);
		},
		onConnect: function () {

		},
		onReconnected: function () {

		},
		handleNoty: function (n) {
			var name = n.objectType[0].toLowerCase() + n.objectType.slice(1);
			var items = $.collections[$.stc[name] || name];
			var item = items[n.data.id];

			if (!item) {
				item = items[n.data.clientId];
				if (item) {
					item.init(n.data);
				} else {
					if ($.stc[name]) {
						item = $.create(n.data, $.stc[name]);
					} else {
						item = $.create(n.data, name);
					}
				}
			} else {
				item.init(n.data);
			}

			item.handle(n);

			// TODO: Think about it
			if (n.action === 2 && item.clearInNotification)
				delete item.clear();
		},
		setObserveTitle: function () {
			var self = this,
				titleTimer;

			$.observe(self, 'titles^*', function (ev, eventArgs) {
				if (titleTimer) {
					clearInterval(titleTimer);
				}
				document.title = self.titles.defaultTitle;

				if (self.titles.customTitle) {
					var flicker = function (){
						if (document.title === self.titles.defaultTitle) {
							document.title = self.titles.customTitle;
						} else {
							document.title = self.titles.defaultTitle;
						}
					};

					titleTimer = setInterval(flicker, 2000);
				}
			});
		},
		setObserveUnviewedMessagesCount: function () {
			var self = this;
			this.observeUnviewedMessagesCount = $.observe(self, 'user^unviewedMessagesCount', function (ev, eventArgs) {
				if (self.user && self.user.unviewedMessagesCount > 0) {
					var newTitle = self.user.unviewedMessagesCount + ' messages';
					$.observable(self.titles).setProperty({ customTitle: newTitle });
				} else {
					$.observable(self.titles).setProperty({ customTitle: '' });
				}
			});
		}
	});
});