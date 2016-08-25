define(['jquery', 'jsviews', 'signalr'], function ($) {
	$.views.helpers({
		$: function() {
			return $;
		},
		test: function (r) {
			debugger;
			return typeof r !== 'undefined';
		},
		site: function () {
			return site;
		},
		user: function () {
			return site.user;
		},
		lang: function () {
			return site.lang;
		},
		menu: function () {
			return [ site.menu ];
		},
		parent: function (n) {
			var p = this;
			for (var i = 0; i < n; i++) {
				p = p.parent;
			}
			return p.data;
		},
		cropStr: function (s, size) {
			return s && s.length > size ? s.substr(0, size) + '...' : s;
		},
		imageSize: function (s, size) {
			if (s && s.length > 0) {
				return s.toLowerCase().indexOf('imageupload') !== -1 ? s.replace(/.(\w+$)/,size + '.$1') : s;
			} else {
				return '';
			}
		},
		checkDomain: function (str) {
			return location.hostname.indexOf(str) !== -1;
		},
		currentUrl: function () {
			return location.href;
		},
		checkColor: function (value) {
			if(value.charAt(0) == '\\' ) return false;
			return true;
		},
		encodeUrl: function (s) {
			return encodeURIComponent(s).replace(/[!'()]/g, escape).replace(/\*/g, '%2A');
		},
		getTag: function (id) {
			return $.view('#' + id).ctx.tag;
		},
		random: function (n) {
			return Math.floor((Math.random() * n) + 1);
		},
		floor: function (value) {
			return Math.floor(value);
		},
		round: function (value) {
			return Math.round(value);
		},
		ceil: function (value) {
			return Math.ceil(value);
		},
		abs: function (value) {
			return Math.abs(value);
		},
		stringify: function (object) {
			return JSON.stringify(object);
		},
		replace: function (s, regexp, change) {
			return typeof s === 'string' ? s.replace(new RegExp(regexp, 'g'), change) : s ? s : '';
		},
		percent: function (total, value) {
			var percent = (value === 0 ? 0 : Math.round(value / total * 100));
			return percent <= 100 ? percent : 100;
		},
		updateValidFlag: function (obj, valid) {
			$.observable(obj).setProperty({ valid: valid });
			return valid;
		},
		window: function () {
			return nodejs ? global : window;
		},
		nodejs: function() {
			return nodejs;
		},
		getBackground: function (src) {
			return 'url("' + ($.views.helpers.replace(src, '\\\\', '/')) + '")';
		},
		LongToUTCTime: function (t) {
			var time = new Date(t - (new Date).getTimezoneOffset() * 60 * 1000);

			return time.toUTCString().slice(0, time.toUTCString().length - 4);
		},
		LongToDate: function (t, numeric) {
			return (new Date(t)).toLocaleDateString('en',{  year: 'numeric', month: '2-digit', day: '2-digit'});
		},
		LongToTime: function (t) {
			return new Date(t).toLocaleString();
		},
		toTimespan: function (time) {
			function addZ(n, forMs) {
				var r = (n < 10 ? '0' : '') + n;
				if (forMs) {
					r = (n < 100 ? '0' : '') + r;
				}
				return r;
			}
			time = time < 0 ? 0 : parseInt(time);

			var ms = time % 1000;
			time = (time - ms) / 1000;
			var secs = time % 60;
			time = (time - secs) / 60;
			var mins = time % 60;
			var hrs = (time - mins) / 60;

			var result = '';

			if (hrs > 0) {
				result += addZ(hrs) + ':';
			}
			if (mins > 0) {
				result += addZ(mins) + ':';
			}
			result += addZ(secs);
			if (hrs === 0) {
				result += '.' + addZ(ms, true);
			}
			return result;
		},
		max: function (a, b) {
			return Math.max(a, b);
		},
		formatCount: function (number) {
			return number.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1 ');
		},
		removeTags : function(str){
			return str.replace(/(<([^>]+)>)/ig, '');
		},
		map: function (array, property) {
			return array.map(function (item) {
				return item[property];
			});
		},
		returnEmptyStringIfNotImgOrText:function(data){
			return $.views.converters.returnEmptyStringIfNotImgOrText(data);
		}

	});

	$.views.converters({
		inttostr: function (value) {
			return '' + value | 0;
		},
		strtoint: function (value) {
			return parseInt(value);
		},
		strtodecimal: function(value) {
			return parseFloat(value).toFixed(2);
		},
		translate: function (s) {
			return s.toTranslated();
		},
		thumb: function (s) {
			return $.views.helpers.imageSize(s, '_Thumb');
		},
		icon: function (s) {
			return $.views.helpers.imageSize(s, '_icon');
		},
		initials: function (s) {
			if (s && s.length) {
				var arr = s.split(' ');
				return arr[0][0] + ' ' + (arr[1] ? arr[1][0] : '');
			} else {
				console.log('empty string for initials');
				return '';
			}
		},
		countConverter: function (s) {
			if (s > 1000) {
				return (s / 1000).toFixed(1) + 'k';
			} else {
				return s;
			}
		},
		replaceBr: function (s) {
			return s.replace(/\r\n|\r|\n/g, '<br/>');
		},
		replaceEncNl: function (s) {
			return '<span style="white-space:pre-line">' + s.replace(/&lt;br\/?&gt;/g, '\n') + '</span>';
		},
		restoreBr: function(s) {
			return s.replace(/&lt;br\/?&gt;/g, '<br/>');
		},
		htmlEncodeRestoreBr: function(s) {
			return $.views.converters.html(s)
				.replace(/&lt;br\/?&gt;/g, '<br/>');
		},
		replaceOnlyNl: function(s) {
			return s.replace(/<br\/?>/g, '\n');
		},
		replaceNl: function (s) {
			return $.views.converters.html($.views.converters.replaceOnlyNl(s));
		},
		cropStr: function (s) {
			return $.views.converters.html($.views.helpers.cropStr(s, 20));
		},
		cropStr110: function (s) {
			return $.views.converters.html($.views.helpers.cropStr(s, 110));
		},
		hourMinutesToStr: function (h, m) {
			return (h < 10 ? '0' : '') + h.toFixed() + ':' + (m < 10 ? '0' : '') + m.toFixed();
		},
		timeToStr: function (t) {
			function sign(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; }
			var h = Math.floor(Math.abs(t) / 60),
				m = t % 60,
				rv = '';
			if (sign(t) < 0) rv = '- ';
			return rv + $.views.converters.hourMinutesToStr(Math.abs(h), Math.abs(m));
		},
		secToStr: function (sec) {
			return $.views.converters.timeToStr(sec % 60 > 0 ? (sec / 60 | 0) + 1 : (sec / 60 | 0));
		},
		htmlToText: function (string) {
			return string.replace(/<\/?[^>]+(>|$)/g, '').replace(/&nbsp;/g, ' ').substring(0, 100);
		},
		toTime: function (time) {
			function addZ(n) {
				return (n < 10 ? '0' : '') + n;
			}
			time = time < 0 ? 0 : parseInt(time);

			var ms = time % 1000;
			time = (time - ms) / 1000;
			var secs = time % 60;
			time = (time - secs) / 60;
			var mins = time % 60;
			var hrs = (time - mins) / 60;

			return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs);
		},
		encodeFileUrl: function (url) {
			if (url) {
				var i = url.lastIndexOf('\\') + 1;

				return url.substring(0, i) + encodeURIComponent(url.substring(i, url.length));
			} else {
				console.log('empty url');

				return url;
			}
		},
		fileSize: function (bytes) {
			if ((bytes >> 30) & 0x3FF)
				bytes = (bytes >>> 30) + '.' + (bytes & (3 * 0x3FF)) + 'GB';
			else if ((bytes >> 20) & 0x3FF)
				bytes = (bytes >>> 20) + '.' + (bytes & (2 * 0x3FF)) + 'MB';
			else if ((bytes >> 10) & 0x3FF)
				bytes = (bytes >>> 10) + '.' + (bytes & (0x3FF)) + 'KB';
			else if ((bytes >> 1) & 0x3FF)
				bytes = (bytes >>> 1) + 'Bytes';
			else
				bytes = bytes + 'Byte';
			return bytes;
		},
		returnEmptyStringIfNotImgOrText: function (input) {
			return input.replace(/(<([^>]+)>)/ig, '').length || input.indexOf('<img') !== -1 ? input : '';
		}

});

	if (!nodejs) {
		window._entity = {
			_save: function(f, success, error) {
				var ctx = $.view(f),
					data = ctx.data,
					validation = ctx.ctx.tag;

				// special for logining trought login screen
				if (data.save == undefined) data = data.auth;

				if (!data._.send) {
					validation.validate();
					if (validation.isValid) {
						var captcha = ctx.childTags()._get('tagName', 'captcha');
						if (captcha && !data.captcha) {
							$.observable(data).setProperty({
								captcha: captcha.contents().find('input').val()
							});
						}
						data.save(function (r) {
							if (captcha) {
								captcha.reset();
							}
							success ? success(r, f, data) : showMsg(f, 'success', 'saved successfully' , true);
						}, function (r) {
							if (captcha) {
								captcha.reset();
							}
							error ? error(r) : showMsg(f, 'danger', r.message, true);
						});
					} else {
						showMsg(f, 'danger', 'your data is not valid', true);
					}
				}
				return false;
			}
		};

		window.dialog = function(message, title, buttons) {
			$('#confirm-message #inner-message').text(message);
			$('#confirm-message').prop('title', title).dialog($.extend({}, defaultDialog, { buttons: buttons, autoOpen: true }));
		};

		window.Confirm = function(message, title, callBack) {
			$('#confirm-message #inner-message').text(message.toTranslated());
			$('#confirm-message').prop('title', title).dialog($.extend({}, defaultDialog, {
				dialogClass: 'confirmation',
				autoOpen: true,
				title: title,
				modal: true,
				buttons: [
					{
						text: 'ok',
						'class': 'btn btn-danger dlg-ok',
						click: function() {
							$(this).dialog('close');

							if (callBack) {
								callBack();
							}
						}
					}
				]
			}));
		};

		window.deleteConfirmation = function(message, title, btnsText, callback, callback2, closeCallback) {
			btnsText = btnsText || ['Yes', 'Cancel'];
			$('#confirm-message #inner-message').text(message.toTranslated());
			$('#confirm-message').dialog($.extend({}, defaultDialog, {
				dialogClass: 'confirmation',
				autoOpen: true,
				title: title.toTranslated(),
				modal: true,
				buttons: [
					{
						text: btnsText[0].toTranslated(),
						'class': 'btn btn-danger dlg-ok',
						click: function() {
							if (callback) {
								callback();
							}
							$(this).dialog('close');
						}
					}, {
						text: btnsText[1].toTranslated(),
						'class': 'btn btn-primary dlg-cancel',
						click: function() {
							if (callback2) {
								callback2();
							}
							$(this).dialog('close');
						}
					}
				],
				close: function(event, ui) {
					if (closeCallback) {
						closeCallback(event, ui);
					}
				}
			}));
		};

		window.closeConfirmation = function(type) {
			var dlg = $('#confirm-message');
			if (dlg.hasClass('ui-dialog-content') && dlg.dialog('isOpen')) {
				dlg.dialog('close');
			}
		};

		var stackBottomleft = { addpos2: 0, animation: true, dir1: 'up', dir2: 'right', firstpos1: 25, firstpos2: 25, nextpos1: 25, nextpos2: 25, push: 'top' };

		window.createNotify = function(text, type , customClass) {
			require(['pnotify','pnotify.buttons'], function(pnotify) {
				var types = {
					info: { icon: 'fa fa-envelope', title: 'New notification' },
					error: { icon: 'fa fa-warning', title: 'Error' },
					success: { icon: 'fa fa-check-circle', title: 'Success' }
				},
					notificationType = types[type]
					|| site.notificationTypes._get('name', type)
					|| types.info;

				var n = new pnotify({
						animation: { effect_in: 'show', effect_out: 'slide' },
						styling: 'fontawesome',
						animate_speed: 'fast',
						type: type,
						sticker: false,
						title: notificationType.title.toTranslated(),
						text: $.views.converters.replaceEncNl(text),
						history: false,
						remove: true,
						insert_brs: false,
						delay: 3000,
						icon: notificationType.icon,
						maxonscreen: 10,
						addclass: ('stack-bottomleft ' + (customClass ? customClass : '')),
						stack: stackBottomleft,
						buttons:{
							closer:true,
							closer_hover: false,
							sticker:false
						}
				});

				return n;
			});
		};

		window.showMsg = function (form, cls, msg, asAlert) {
			if (msg) {
				var errlist = $('.error-list', form).show();
				errlist.show();
				$('span', errlist).remove();

				errlist.append('<span class="' + (asAlert ? 'alert alert-' : 'label label-') + cls + '">' + msg.toTranslated() + '</span>');

				var label = $('span', errlist);

				setTimeout(function() {
					label.fadeOut(1000, function() {
						label.remove();
					});
				}, 2000);
			}
		};

		(function($, window, undefined) {
			/// <param name="$" type="jQuery" />
			'use strict';

			if (typeof ($.signalR) !== 'function') {
				//debug
				console.log('SignalR: SignalR is not loaded. Please ensure jquery.signalR-x.js is referenced before ~/signalr/js.');

				return;
			}

			var signalR = $.signalR;

			function makeProxyCallback(hub, callback) {
				return function() {
					// Call the client hub method
					callback.apply(hub, $.makeArray(arguments));
				};
			}

			function registerHubProxies(instance, shouldSubscribe) {
				var key, hub, memberKey, memberValue, subscriptionMethod;

				for (key in instance) {
					if (instance.hasOwnProperty(key)) {
						hub = instance[key];

						if (!(hub.hubName)) {
							// Not a client hub
							continue;
						}

						if (shouldSubscribe) {
							// We want to subscribe to the hub events
							subscriptionMethod = hub.on;
						} else {
							// We want to unsubscribe from the hub events
							subscriptionMethod = hub.off;
						}

						// Loop through all members on the hub and find client hub functions to subscribe/unsubscribe
						for (memberKey in hub.client) {
							if (hub.client.hasOwnProperty(memberKey)) {
								memberValue = hub.client[memberKey];

								if (!$.isFunction(memberValue)) {
									// Not a client hub function
									continue;
								}

								subscriptionMethod.call(hub, memberKey, makeProxyCallback(hub, memberValue));
							}
						}
					}
				}
			}

			$.hubConnection.prototype.createHubProxies = function() {
				var proxies = {};
				this.starting(function() {
					// Register the hub proxies as subscribed
					// (instance, shouldSubscribe)
					registerHubProxies(proxies, true);

					this._registerSubscribedHubs();
				}).disconnected(function() {
					// Unsubscribe all hub proxies when we "disconnect".  This is to ensure that we do not re-add functional call backs.
					// (instance, shouldSubscribe)
					registerHubProxies(proxies, false);
				});

				proxies['notificationHub'] = this.createHubProxy('notificationHub');
				proxies['notificationHub'].client = {};
				proxies['notificationHub'].server = {
					handle: function(data) {
						/// <summary>Calls the Handle method on the server-side NotificationHub hub.&#10;Returns a jQuery.Deferred() promise.</summary>
						/// <param name=\"data\" type=\"Object\">Server side type is System.String</param>
						/// <returns type="String">Server side type is Message</returns>
						return proxies['notificationHub'].invoke.apply(proxies['notificationHub'], $.merge(['Handle'], $.makeArray(arguments)));
					},

					register: function(sessionGuid) {
						/// <summary>Calls the Register method on the server-side NotificationHub hub.&#10;Returns a jQuery.Deferred() promise.</summary>
						/// <param name=\"sessionGuid\" type=\"String\">Server side type is System.String</param>
						return proxies['notificationHub'].invoke.apply(proxies['notificationHub'], $.merge(['Register'], $.makeArray(arguments)));
					}
				};

				return proxies;
			};

			signalR.hub = $.hubConnection('/signalr', { useDefaultPath: false });

			$.extend(signalR, signalR.hub.createHubProxies());

		}(window.jQuery, window));

		$.fn.xpath = function (xpathExpression) {
			// Evaluate xpath and retrieve matching nodes
			var xpathResult = this[0].evaluate(xpathExpression, this[0], null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

			var result = [];
			while (elem = xpathResult.iterateNext()) {
				result.push(elem);
			}

			return jQuery([]).pushStack(result);
		}
	}
});