(function (n, m) {
	var isModule = (typeof module !== 'undefined' && module.exports);
	if ((typeof define === 'function' && define.amd) || isModule) {
		// AMD or Node.js Module
		var d = define(['jquery', 'cookie', 'es5-shim', 'es5-sham'], m);
		if (isModule) module.exports = d;
	} else {
		// Assign to common namespaces or simply the global object (window)
		var j = this.jQuery;
		if (!j) {
			console.log('jquery is not loaded');
			return;
		}
		if (!j.views) {
			console.log('jsviews is not loaded');
			return;
		}

		j[n] = m(j);
	}
}('factory', function ($, cookies) {
	/*
	 * We expect that $ contains .type and .extended, other functions of jquery is not required.
	 * So in node we need implements only this two functions. Else in loading objects we use
	 * $.ajax but in node we don't need this
	 */

	Object.deepExtend = function (destination, source) {
		var keys = Object.keys(source),
			l = keys.length,
			i;
		for (i = 0; i < l; ++i) {
			var property = keys[i],
				value = source[property];

			if (value && value.constructor && value.constructor === Object) {
				destination[property] = destination[property] || {};
				if (property !== 'parent') {
					Object.deepExtend(destination[property], value);
				}
			} else {
				destination[property] = value;
			}
		}
		return destination;
	};

	Object.fastExtend = function (destination, source) {
		var keys = Object.keys(source),
			l = keys.length,
			i;
		for (i = 0; i < l; ++i) {
			destination[keys[i]] = source[keys[i]];
		}
		return destination;
	};

	var nodejs = typeof window === 'undefined';

	if (nodejs) {
		// ReSharper disable once ExpressionIsAlwaysConst
		global.nodejs = nodejs;

		/* implementation without jsviews */
		Object.fastExtend(Array.prototype, {
			refresh: function () {
				return this;
			},
			insertRange: function (i, item) {
				Array.prototype.splice.apply(this, [i, 0].concat(item));
				return this;
			},
			removeRange: function (i, count) {
				this.splice(i, count);
				return this;
			}
		});
	} else {
		// ReSharper disable once ExpressionIsAlwaysConst
		window.nodejs = nodejs;
		window.Cookies = cookies;

		window.require && require(['jsviews'], function () {
			// ReSharper disable once VariableUsedInInnerScopeBeforeDeclared
			// todo think about this
			f.setProperty = $.setProperty = function (obj, key, value) {
				$.observable(obj).setProperty(key, value);
			};
		});

		/* implementation with jsviews */
		Object.fastExtend(Array.prototype, {
			refresh: function (r) {
				$.observable(this).refresh(r || this);
				return this;
			},
			insertRange: function (i, item) {
				$.observable(this).insert(i, item);
				return this;
			},
			removeRange: function (i, count) {
				$.observable(this).remove(i, count);
				return this;
			}
		});
	}

	var f = {
		// key - object type name
		// value - default values for object
		objects: {},
		// key - object type name
		// value - proto methods
		protos: {},
		// this property set in prototype of object and use in object request and handling notifications
		// key - object type name
		// value - alternative object type name
		// client to server
		cts: {},
		// server to client
		stc: {},
		collections: {
			/**
			 * get object or object[] from the $.collections[type]
			 * @param {string} type - type of object in collection
			 * @param {string} property - object property for matching
			 * @param {string} value - value to match
			 * @param {boolean} all - flag
			 * @returns {(?object|?object[])} - if 'all' flag is false then returns the first entry or null,
			 * else returns all the entries in the array or an empty array
			 */
			xpath: function(type, property, value, all) {
				var r = all ? [] : null,
					items = f.collections,
					collection = items[type];

				if (typeof collection === 'undefined' || collection === null)
					return null;

				Object.keys(items[type]).every(function(item) {
					var t = items[type][item];
					if (f.xpath(t, property) === value) {
						if (all) {
							r.push(t);
						} else {
							r = t;
							return false;
						}
					}
					return true;
				});

				return r;
			}
		},
		id: 0,
		getId: function() {
			return --this.id;
		},
		setProperty: function(obj, key, value) {
			if ($.type(key) === 'string') {
				obj[key] = value;
			} else if ($.type(key) === 'object') {
				Object.keys(key).forEach(function (item) {
					obj[item] = key[item];
				});
			} else {
				throw new Error('Invalid key type. It should be string or object');
			}
		},
		xpath: function(node, path) {
			var r = node;
			var arr = path.split('.');
			arr.forEach(function(item) {
				if (item.indexOf('[') !== -1) {
					var t = item.split('[');
					r = r[t[0]][t[1].split(']')[0]];
				} else {
					r = r[item];
				}
			});
			return r;
		},
		getObject: function(obj, type, callback) {
			var reload = obj._reload;

			if ($.type(obj) === 'string') {
				type = obj;
				obj = {};
			}

			var r;
			var t = f.protos[type];

			if (t && t.unique) {
				t.type = type;
				r = t.unique(obj);
				if (r == null) {
					r = this.create(obj, type);
				}
			} else {
				r = this.create(obj, type);
			}

			if (r) {
				// if is dummy object for page we need to call callback too
				if ((r.id > 0 && !reload) || !r.load) {
					callback && callback(r);
				} else {
					if (!nodejs) {

						// #todo (important for init and pages) maybe this should done in custom load function 
						if (!window.location.origin) {
							window.location.origin = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
						}

						r._.params.fullpath = r.realpath ? window.location.origin + '/' + r.realpath + url.serializeStateSearch() : window.location.href;

						r._.params.clientId = r.clientId;
						r.load(function() {
							callback && callback(r);
						});
					}
				}
			}
			return r;
		},
		add: function() {
			var a = Array.prototype.slice.call(arguments, 0);

			if (a.length <= 0) {
				console.log('can\'t create type without name');
				return;
			}

			var t = a[0];
			if ($.type(t) !== 'string') {
				console.log('type name should be string');
				return;
			}

			this.objects[t] = {};
			var obj = a[1],
				proto = {};
			if (a.length > 1) {
				var self = this;
				a.slice(2).forEach(function(arg) {
					if ($.type(arg) === 'string') {
						Object.deepExtend(self.objects[t], self.objects[arg]);
						Object.deepExtend(proto, self.protos[arg]);
					} else {
						Object.deepExtend(proto, arg);

						if (arg.cts) {
							$.extend(self.cts, arg.cts);
						}

						if (arg.stc) {
							$.extend(self.stc, arg.stc);
						}
					}
				});

				Object.deepExtend(self.objects[t], obj);
			}
			this.protos[t] = proto;

			this.collections[t] = this.collections[t] || {};
		},
		// set dest array
		// set source array
		// push - if true push all items, otherwise reinit items with matching ids and push everything else
		// obj - object owner of source
		set: function(self, r, push, obj) {
			var f = this,
				i;
			if (r) {
				if (self._ && self._.type) {
					if (!(r instanceof Array) && r.count !== undefined) {
						if (r._) {
							self._ = $.extend(true, self._, r._);
						}

						f.setProperty(self._, 'rows', r.count);
						if (r.offset && !self._.autofill) {
							f.setProperty(self._, 'offset', r.offset);
						}

						if (self._.observe && !nodejs && !self._.observed) {
							self._.observed = true;

							$.observe(self, function(ev, arg) {
								var array = ev.target;

								if (array._.ignoreObserving || arg.change === 'move' || arg.change === 'refresh')
									return;

								if (array._ && typeof array._.rows !== 'undefined') {
									f.setProperty(array._, 'rows', array._.rows + (arg.change === 'insert' ? arg.items.length : -arg.items.length));
								}
							});
						}

						r = r.list;

						if (self.length === 0 && self._.autofill) {
							for (i = 0; i < self._.rows; ++i) {
								self[i] = undefined;
							}

							self._.offset -= self._.rows;
						}
					} else if (r._ && !self._.autofill) {
						if (r._.rows && self._.rows === undefined) {
							self._.rows = r._.rows;
						}
						if (r._.offset) {
							self._.offset = r._.offset;
						}
					}

					if (r && r.length > 0) {
						var initedItems = [];
						
						if (!push && self.length > 0 && !self._.negativeCount) {
							initedItems = new Array(r.length);
							for (i = 0; i < r.length; i++) {
								if (r[i].id || r[i].clientId) {
									var item = null;

									if (r[i].id > 0) {
										item = self.get(r[i].id);
									}

									if (!item) {
										item = self._get('clientId', r[i].clientId);
									}

									if (item) {
										item.init(r[i]);
										initedItems[i] = true;
									}
								} else {
									if (self.length > i) {
										f.init(self[i], r[i]);
										initedItems[i] = true;
									}
								}
							}
						}

						var t = [];
						r.forEach(function (item, index) {
							if (!initedItems[index]) {
								if (item) {
									var tmpType = (self._.type === 'auto' ? item._type.toLowerCase() : self._.type),
										targetType = $.stc[tmpType] || tmpType;

									if (item._) {
										if (!item._.ignoreClone) {
											if (obj && obj._) {
												item._.newId = obj._.newId;
												item.ignoreUnique = obj.ignoreUnique;
											}
											t.push(f.create(item, targetType));
										}
									} else {
										t.push(f.create(item, targetType));
									}
								} else
									t.push(undefined);
							}
						});

						if (self._.negativeCount) {
							self._.negativeCount = false;
							self._.offset -= t.length;
							self.insert(0, t);
						} else {
							if (self._.autofill) {
								for (i = 0; i < t.length; ++i)
									self[i + self._.offset + self._.rows] = t[i];

								self.refresh();
							} else {
								if (!self._.clearBeforeReload) {
									self.refresh(t);
								} else {
									self._.ignoreObserving = true;
									self._push(t);
									self._.ignoreObserving = false;
								}
							}
						}
					} else {
						if (!self._.clearBeforeReload) {
							self.refresh([]);
						}
					}
				} else {
					if (self.length === r.length) {
						var l = r.length;
						if (self.length > 0) {
							if (self[0] instanceof Object) {
								for (i = 0; i < l; i++) {
									f.init(self[i], r[i]);
								}
							} else {
								self.refresh(r);
							}
						}
					} else {
						self._push(r);
					}
				}
			}
		},
		init: function(self, obj) {
			var f = this;

			Object.keys(self).forEach(function(item) {
				if (self[item] instanceof Array) {
					if (obj.hasOwnProperty(item)) {
						if (self._ && self._.newId && self[item]._ && self[item]._.ignoreClone) {

						} else {
							if (!self[item]._ || !self[item]._.ignoreInit) {							
								f.set(self[item], obj[item], undefined, obj);
							}
						}
					}
				} else {
					if (!(self[item] instanceof Function) && obj != null && obj.hasOwnProperty(item)) {
						if (obj[item] != null) {
							if (self[item] instanceof Object && item !== '_') {
								if (self._ && self._.newId && self[item]._ && self[item]._.ignoreClone) {
									f.setProperty(self, item, f.create({}, self[item].type));
								} else {
									if (self[item]._) {
										if (!self[item]._.ignoreReInit) {
											self[item].init ? self[item].init(obj[item]) : f.init(self[item], obj[item]);
										}
									} else {
										f.setProperty(self, item, f.create(obj.hasOwnProperty(item) ? obj[item] : {}, self[item].type));
									}
								}
							} else {
								if (item === '_') {
									f.setProperty(self, item, obj.hasOwnProperty(item) ? Object.deepExtend(self[item], obj[item]) : self[item]);
								} else {
									if (item === 'id' && self._ && self._.newId) {
										f.setProperty(self, 'id', -1);
									} else if (item === 'clientId' && self._ && self._.newId) {
										f.setProperty(self, 'clientId', f.getId());
									} else if (item === 'deleted') {
										f.setProperty(self, item, obj[item] || false);
									} else {
										f.setProperty(self, item, obj.hasOwnProperty(item) ? obj[item] : self[item]);
									}
								}
							}
						} else {
							if (self[item] instanceof Object && self[item].type && !self[item]._) {
								f.setProperty(self, item, f.create(self[item], self[item].type));
							}
						}
					} else {
						if (item === 'deleted') {
							f.setProperty(self, item, obj[item] || false);
						}
					}
				}
			});

			if (obj !== null && typeof obj === 'object')
				Object.keys(obj).forEach(function(item) {
					if (!self.hasOwnProperty(item)) {
						f.setProperty(self, item, obj[item]);
					}
				});

			if (self._ && self._.newId)
				self._.newId = false;
			if (self.ignoreUnique)
				self.ignoreUnique = false;

			if (self.type) {
				var items = this.collections[self.type];
				if (items) {
					if (self.id > 0) {
						if (items[self.id]) {
							$.setProperty(items[self.id], self);
							self = items[self.id];
						} else {
							items[self.id] = self;
						}

						if (self.clientId) {
							if (items[self.clientId]) {
								$.setProperty(items[self.clientId], self);

								if (!self.lockRemove) {
									delete items[self.clientId];
								}
							}
						}
					} else {
						if (self.clientId) {
							if (items[self.clientId]) {
								$.setProperty(items[self.clientId], self);
								self = items[self.clientId];
							} else {
								items[self.clientId] = self;
							}
						}
					}
				}
			}

			return self;
		},
		_create: function(type, proto, values, obj) {
			var self = this,
				r = $.extend(Object.create(proto), values, {
					type: type
				});

			if (r.unique && !obj.ignoreUnique) {
				r = r.unique(obj) || r;
			}

			if (obj == undefined) obj = type !== 'string' ? type : {};

			if (r && !r._) r._ = {};

			if (r.init) {
				//$.init(this, obj) should be called inside r.init(obj) to init inner objects recursively
				r.init(obj);
			} else {
				self.init(r, obj);
			}

			r._.toJSON = function() {
				return null;
			};

			return r;
		},
		create: function() {
			var array = Array.prototype.slice.call(arguments, 0);

			if (array.length <= 0) {
				console.log('can\'t create object without type name');
				return null;
			}

			var self = this,
				obj = {},
				proto = {},
				values = {};

			if ($.type(array[0]) !== 'string') {
				obj = array[0];
				array = array.slice(1);
			}

			array.forEach(function(arg) {
				if (arg !== undefined) {
					if ($.type(arg) === 'string') {
						var type = arg;
						if (!self.protos[arg] && obj.typePath) {
							$.collections[array[0]] = $.collections[array[0]] || {};

							// #todo to prevent double loading page, we need to have some unique
							$.protos[array[0]] = $.protos[array[0]] || {
								unique: function(d) {
									return nodejs ? null : $.collections.xpath(this.type, 'realpath', decodeURI(d.realpath.split('?')[0].toLowerCase()));
								}
							};

							obj.lockRemove = true;

							require([obj.typePath.toLowerCase()], function() {
								$.extend(true, proto, self.protos[arg]);
								$.extend(true, values, self.objects[arg]);

								var typepath = array[0][0].toLowerCase() + array[0].slice(1);
								var t = self.collections[typepath][obj.clientId];

								if (!t) t = obj;

								t.ignoreUnique = true;

								var r = self._create(array[0], proto, values, t);

								// in case when js loaded faster then data, don't remove object.
								if (r.id > 0) {
									delete self.collections[r.type][r.clientId];
								}
							});

							type = 'page';
						}

						$.extend(true, proto, self.protos[type]);
						$.extend(true, values, self.objects[type]);
					} else if (arg instanceof Object) {
						$.extend(true, proto, arg);
					}
				}
			});

			var newId = obj._ && obj._.newId;
			var r = self._create(array[0], proto, $.extend(true, {}, values), obj);
			
			if (!newId) {
				obj.clientId = r.clientId;
			}

			return r;
		},
		arrOpt: {
			send: false,
			rows: undefined,
			before: false,
			offset: 0,
			count: 0,
			clearBeforeReload: true,
			params: {},
			// able ignore init
			ignoreInit: false
		},
		array: function (array, options, methods) {
			var a = [];

			if ($.type(array) === 'object') {
				methods = options;
				options = array;
			} else if ($.type(array) === 'array') {
				a = array;
			}

			a._ = $.extend({}, this.arrOpt, options);

			if (methods) {
				Object.keys(methods).forEach(function (item) {
					a[item] = methods[item];
				});
			}

			return a;
		},
		requestObject: function (p) {
			if (typeof site !== 'undefined' && site.banned)
				return false;
			var data = JSON.stringify({
				data: JSON.stringify(p),
				sessionGuid: p.session,
				type: p.type
			});
			return $.ajax({
				type: 'POST',
				contentType: 'application/json',
				url: path + 'services.svc/post/',
				data: data,
				dataType: 'json',
				timeout: 10000
			});
		}
	};

	$.extend($, f);

	f.add('object', {
		_: {
			params: {
				// depth of applying sendArray and sendObject options
				depth: 1,
				// send arrays when save object
				sendArray: false,
				// send inner objects when save object
				sendObject: false
				// ignore init after save request. This options should set in true if we update this kind of object by notifications
				// ignoreInitAfterSave: undefined

				// ignore cloning this object when clone parent object.
				// This options should set in true if we don't need cope some inner options of object
				// exmpale: clone some entity which have comment tree. We need only clone object and get new id after save, but not comments
				// ignoreClone: undefined

				// this is hidden option, using in clone process, to reset id in -1 and get new client id
				// newId: undefined
			},
			// this is hidden option showing request status
			send: false

			// if don't need to check collections for existing objects
			// ignoreUnique: undefined

			// if dontSend is true, object won't be sent to server
			// dontSend: undefined
		},
		id: -1,
		deleted: false
	}, {
		clearInNotification: true,
		// cts: { 'client_name': 'server_name' },
		// stc: { 'server_name': 'client_name' },
		success: function (r) {
			console.log(r);
		},
		err: function (r) {
			console.log(r);
			//switch (r.code) {
			//	case 1:
			//		site.loginDialog();
			//		break;
			//}
		},
		init: function (r) {
			this.clientId = f.getId();
			if (r && r.data) {
				this.id = r.data.id;
			}
			f.init(this, r);
		},
		unique: function (obj) {
			return $.collections[this.type][obj.id];
		},
		handle: function (r) {
			console.log(r);
		},
		request: function (params, success, err) {
			var self = this;
			if (!this._.send || this._.abortAjax) {
				if (this._.abortAjax && this._.ajax) {
					this._.ajax.abort();
				}

				var f = $,
					callbacks = {
						success: success,
						err: err
					};

				f.setProperty(self._, 'send', true);

				params.session = window.site ? window.site.session || Cookies.get().session : Cookies.get().session;
				params.type    = f.cts[params.type] || params.type;

				this._.ajax = f.requestObject(params)
					.done(function (d) {
						if (d.response.additional) {
							console.log(d.response);
						}

						if (d.session && site.session && d.session !== site.session && params.type !== 'logoff') {
							site.session = d.session;

							site.connectionStopped = true;

							$.connection.hub.stop();
						}

						f.setProperty(self._, 'loaded', true);
						f.setProperty(self._, 'send', false);

						if (d.success && !d.response.deleted && !params.ignoreInitAfterSave) {
							self.init(d.response);
						}
						
						if (!d.success && d.response.code) {
							if (!site.captchaRequests) {
								f.setProperty(site, 'captchaRequests', new Array());
							}
							if (d.response.code === 1) {
								site.loginDialog(d);
							} else if (d.response.code === 66) {
								var captchaRequest = d.response;
								f.setProperty(captchaRequest, 'callbacks', callbacks);
								f.setProperty(captchaRequest, 'caller', self);
								site.captchaRequests._push(captchaRequest);
								site.captchaDialog();
							} else if (d.response.code === 67) {
								site.banDialog();
							}
						}

						f.setProperty(site, 'time', d.time);

						var c = d.success ? 'success' : 'err';

						(callbacks[c] ? callbacks[c] : self[c]).call(self, d.response);
					})
					.fail(function (err) {
						f.setProperty(self._, 'send', false);

						console.log(err);

						if (err.statusText === 'timeout') {
							site.timeoutDialog(err);
						}
					});
			} else {
				console.log('this object waiting answer...', self);
			}
			return this;
		},
		pse: function (arr) {
			var arg = Array.prototype.slice.call(arr, 0);
			if (arg.length > 0) {
				var type = $.type(arg[0]);
				if (type === 'number') {
					arg[0] = $.extend({}, this._.params, {
						count: arg[0]
					});
				} else if (type === 'function') {
					arg.unshift(this._.params);
				} else {
					arg[0] = $.extend({}, this._.params, arg[0]);
				}

				arg[1] = arg[1] ? arg[1] : undefined;
				arg[2] = arg[2] ? arg[2] : undefined;
			} else {
				arg.push(this._.params);
			}

			return arg;
		},
		// 1 param - count of load items or object with load params
		// 2 param - success callback
		// 3 param - error callback
		load: function () {
			$.setProperty(this, 'requestType', 'load');
			return this.request.apply(this, this.pse(arguments));
		},
		lazyload: function (params, callback) {
			if (this._.loaded) {
				if ($.type(params) === 'function') {
					callback = params;
				}
				callback && callback();
			} else {
				this.load(params, callback);
			}
		},
		reload: function () {
			if (this._.clearBeforeReload) {
				this.clear();
			}
			this.load.apply(this, arguments);
		},
		reloadWithDelay:function(delay, callback){

			if( typeof delay == 'undefined')
				delay = 300;

			clearTimeout(this._.timeout);

			this._.timeout = setTimeout(function(){

				this.reload(callback);

			}.bind(this), delay);
		},
		form: function (params) {
			var self = this,
				obj = {};
			Object.keys(this).forEach(function (item) {
				if (item !== '_') {
					var prop = self[item];
					if (!(prop && prop._ && prop._.dontSend)) {
						if (prop instanceof Array) {
							if (params.sendArray) {
								obj[item] = [];
								if (params.depth > 0) {
									var p = $.extend({}, params, {
										depth: params.depth - 1
									});
									prop.forEach(function (a) {
										obj[item].push(a && a.form ? a.form(p) : a);
									});
								}
							}
						} else if (prop instanceof Object) {
							if (params.sendObject) {
								obj[item] = prop.form ? (params.depth > 0 ? prop.form($.extend({}, params, {
									depth: params.depth - 1
								})) : {}) : prop;
							}
						} else {
							obj[item] = prop;
						}
					}
				}
			});
			return obj;
		},
		// 1 param - save params
		// 2 param - success callback
		// 3 param - error callback
		save: function () {
			$.setProperty(this, 'requestType', 'save');
			var arg = this.pse(arguments);
			arg[0] = this.form(arg[0]);
			arg[0].ignoreInitAfterSave = typeof arg[0].ignoreInitAfterSave !== 'undefined' ? arg[0].ignoreInitAfterSave : this._.ignoreInitAfterSave;
			return this.request.apply(this, arg);
		},
		remove: function (params, success, error) {
			if (this.id > 0) {
				this.deleted = true;
				this.save(params, success, error);
			}
		},
		template: function () {

		},
		xpath: function (path) {
			return $.xpath(this, path);
		},
		_clone: function() {
			this._.newId = this.ignoreUnique = true;
			var r = $.create(this, this.type);
			this.ignoreUnique = this._.newId = false;
			return r;
		},
		clone: function () {
			return this._clone();
		},
		_clear: function (depth) {
			if (depth == undefined) depth = 3;
			else if (depth === 0) return;
			for (var property in this) {
				if (this.hasOwnProperty(property)) {

					var obj = this[property];

					switch ($.type(obj)) {

						case 'object':
							if (property !== '_' && property !== 'parentNode') {
								if (obj._ && obj._clear && !obj._.ignoreClear) {
									obj._clear(depth - 1);
									
									f.setProperty(this, property, obj.type && !obj._.setNullInsteadEmptyObject ? { type: obj.type } : null);
								}
							}
							break;

						case 'array':
							if (obj._ && obj._.params && !obj._.params.ignoreClear) obj.clear(true);
							break;

						default:
							break;
					}

				}
			};

			var items = $.collections[this.type];

			if (items) {
				delete items[this.id ? this.id : this.clientId];
			}
		},
		clear: function (depth) {
			this._clear(depth);
		},
		saveProperty: function(field, success, error) {
			$.create({
				_: {
					params: {sendArray: true}
				},
				type: 'property',
				objectType: this.type,
				field: field,
				value: this[field],
				id: this.id
			}, 'object').save(success, error);
		},
		views: {
			keys: {
				id: {
					show: false
				},
				clientId: {
					show: false
				},
				_type: {
					show: false
				},
				deleted: {
					show: false
				}
			}
		}
	});

	Object.fastExtend(Array.prototype, {
		success: f.protos['object'].success,
		err: f.protos['object'].err,
		request: f.protos['object'].request,
		pse: f.protos['object'].pse,
		reload: f.protos['object'].reload,
		reloadWithDelay: f.protos['object'].reloadWithDelay,
		// push - if true (default value) push all items, otherwise reinit items with matching ids and push everything else
		init: function (r, push) {
			$.set(this, r, push === undefined ? true : push);
		},
		insert: function (i, item) {
			return this.insertRange(i, item);
		},
		_push: function (item) {
			return this.insert(this.length, item);
		},
		remove: function (i, s, e) {
			if (s != undefined) {
				var self = this;
				if (i > -1) {
					var t = this[i];
					if (t.id > -1) {
						this[i].remove(function (r) {
							if (self[i] === t) {
								self.removeRange(i, 1);
							}
							s(r);
						}, e);
					} else {
						this.removeRange(i, 1);
						s();
					}
				}
			} else {
				this.removeRange(i, 1);
			}
			return this;
		},
		_pop: function () {
			return this.remove(this.length - 1);
		},
		clone: function () {
			var t = $.extend(true, this.slice(), this);
			t.init();
			return t;
		},
		clear: function (clearEachItem) {
			this.offset = 0;
			if (clearEachItem) {
				this.forEach(function (item) {
					if (item.clear) item.clear();
				});
			}
			return this.removeRange(0, this.length);
		},
		get: function (id, func) {
			var f = func === undefined ? function (a, b) {
				return a && a.id === b;
			} : func;
			for (var i = 0; i < this.length; i++) {
				if (f(this[i], id)) {
					return this[i];
				}
			}
			return null;
		},
		_filter: function (ids, have, func) {
			var a = [],
				f = func === undefined ? function (a, b) {
					return a.id === b;
				} : func;
			for (var i = 0; i < this.length; i++) {
				var t = true;
				for (var j = 0; j < ids.length; j++) {
					if (f(this[i], ids[j])) {
						if (have) {
							a.push(this[i]);
						}
						t = false;
						break;
					}
				}
				if (t && !have) {
					a.push(this[i]);
				}
			}
			return a;
		},
		shuffle: function (b) {
			var i = this.length,
				j, t;

			while (i) {
				j = Math.floor((i--) * Math.random());
				t = b && typeof this[i].shuffle !== 'undefined' ? this[i].shuffle() : this[i];
				this[i] = this[j];
				this[j] = t;
			}

			return this;
		},
		_shuffle: function (b) {
			Array.prototype.shuffle.call(this, b);
			return this.refresh();
		},
		load: function () {
			var arg = this.pse(arguments);

			if (!this._.clearBeforeReload) {
				arg[0].offset = 0;
			} else {
				if (arg[0].count > 0) {
					arg[0].offset = (this._.offset + this.length);
				} else {
					this._.negativeCount = true;
					arg[0].count = -arg[0].count;
					arg[0].offset = (this._.offset - arg[0].count);
				}
			}

			if (this.length === 0 || this.length + this._.offset < this._.rows || this._.autofill || typeof this._.rows === 'undefined' || !this._.clearBeforeReload) {
				this.request.apply(this, arg);
			}

			return this;
		},
		lazyload: function (params, callback) {
			var length = this.length;

			if (typeof this._.rows === 'undefined') {
				if (typeof params === 'number' && params > length && length > 0)
					params = params - length;

				this.load(params, callback);
			} else {
				if ($.type(params) === 'function')
					callback = params;

				if (callback)
					callback(this);
			}
		},
		equal: function (a, b, prop) {
			return a[prop] === b;
		},
		_get: function (prop, value, index) {
			var r = index ? -1 : null,
				func = this.equal;
			if (prop !== undefined) {
				if ($.type(prop) === 'function') {
					func = prop;
				} else {
					if (value === undefined) {
						value = prop;
						prop = 'id';
					}
				}

				var l = this.length;
				for (var i = 0; i < l; ++i) {
					var element = this[i];
					if (typeof element !== 'undefined' && func(element, value, prop)) {
						r = index ? i : this[i];
						break;
					}
				}
			}
			return r;
		},
		search: function (prop, value) {
			return this._get(prop, value, true);
		},
		xpath: function (path, value, index) {
			return this._get(function (a, b) {
				return $.xpath(a, path) === b;
			}, value, index);
		},
		__remove: function (valueOrIdOrPredicate) {
			if (typeof valueOrIdOrPredicate === 'function') {
				var predicate = valueOrIdOrPredicate;
				var observableThis = $.observable(this);
				for (var i = 0; i < this.length; ++i) {
					var item = this[i];
					if (predicate(item)) {
						observableThis.remove(i);
						--i;
					}
				}
			} else if (this._) {
				var id = valueOrIdOrPredicate;
				return this.__remove(function (item) { return item.id === id; });
			} else {
				var value = valueOrIdOrPredicate;
				return this.__remove(function (item) { return item === value; });
			}

			return this;
		},
		// sortFields is array of field with this interface:
		// { direction: int{0(none), 1(asc), 2(desc)}, caption: string }
		sortManyFieldsPredicate: function (a, b) {
			var compareResult = 0,
				sortFields = this._.params.column;

			if (!$.isArray(sortFields)) return compareResult;

			var lengthSortFields = sortFields.length;

			var ascSort = function (a, b) {
					var typeOfA = typeof a;
				    var typeOfB = typeof b;
				    if ((typeOfA === typeOfB) && (typeOfA === 'string')) {
						a = a.toLowerCase();
						b = b.toLowerCase();
					}
					if (a === b) return 0;
					return a > b ? 1 : -1;
				},
				descSort = function (a, b) {
					return -1 * ascSort(a, b);
				};

			for (var i = 0; i < lengthSortFields && compareResult === 0; ++i) {
				switch (sortFields[i].direction) {
					case 1:
						compareResult = ascSort(a[sortFields[i].caption], b[sortFields[i].caption]);
						break;
					case 2:
						compareResult = descSort(a[sortFields[i].caption], b[sortFields[i].caption]);
						break;
				}
			}

			return compareResult;
		},
		// Every element compare with objectOrValue and return index of the first element that satisfies predicate
		// If predicate supports many fields then sortFields is required
		getIndexOfFirst: function(objectOrValue) {
			if (!objectOrValue) return -1;

			var array = this,
				i = 0;
			var checkUndefinedAndPredicate = function (a, b) {
				return a === 'undefined' || a.id === b.id || array.sortManyFieldsPredicate(a, b) < 0;
			}

			for (; i < array.length && checkUndefinedAndPredicate(array[i], objectOrValue); ++i) { }

			return i;
		},
		// Check on array is sorted by array._.params.column
		IsSortedArray: function() {
			var sortFields = this._.params.column;
			if (!$.isArray(sortFields)) return false;

			var lengthSortFields = sortFields.length;
			for (var i = 0; i < lengthSortFields; ++i) {
				if (sortFields[i].direction !== 0) return true;
			}

			return false;
		}
	});

	f.add('tree', {
		_: {
			fields: {
				children: 'children',
				parent: 'id',
				child: 'parent'
			}
		}
	}, 'object', {
		_remove: f.protos.object.remove,

		get: function (prop, value) {
			if (prop !== undefined) {
				if (value === undefined) {
					value = prop;
					prop = 'id';
				}

				if (this[prop] === value) {
					return this;
				} else {
					var t;
					for (var i = 0; i < this[this._.fields.children].length; i++) {
						t = this[this._.fields.children][i].get(prop, value);
						if (t != null) {
							if (!t._.parent) {
								t._.parent = this;
								t._.index = i;
							}
							return t;
						}
					}
				}
			}
			return null;
		},
		func: function (func) {
			if (func(this)) {
				return this;
			} else {
				var t;
				for (var i = 0; i < this[this._.fields.children].length; i++) {
					t = this[this._.fields.children][i].func(func);
					if (t != null) {
						if (!t._.parent) {
							t._.parent = this;
							t._.index = i;
						}
						return t;
					}
				}
			}
			return null;
		},
		xpath: function (path, value) {
			var arr = path.split('.'),
				f = arr.length > 1 ? function (node) {
					var r = node;
					arr.forEach(function (item) {
						r = r[item];
					});
					return r === value;
				} : function (node) {
					return node[path] === value;
				};

			if (f(this)) {
				return this;
			} else {
				for (var i = 0; i < this[this._.fields.children].length; i++) {
					var t = this[this._.fields.children][i].func(f);
					if (t != null) {
						if (!t._.parent) {
							t._.parent = this;
							t._.index = i;
						}
						return t;
					}
				}
			}
			return null;
		},
		activate: function (node) {
			$.setProperty(this.current, 'active', false);
			$.setProperty(this, 'current', node || this);
			$.setProperty(this.current, 'active', true);
		},
		remove: function (index, f, e) {
			if (index instanceof Function) {
				e = f;
				f = index;
			}

			if (index instanceof Function && this._ && this._.parent && this._.index > -1) {
				if (!this._.removed) {
					this._.removed = true;
					var children = this._.parent[this._.fields.children];
					children.remove(this._.index, function (r) {
						for (var i = this._.index; i < children.length; ++i) {
							children[i]._.index--;
						}

						f && f(r);
					}.bind(this), e);
				} else {
					if (f) {
						this._remove(f, e);
					}
				}
			} else {
				if (!this._.removed) {
					this[this._.fields.children][index]._.removed = true;
					this[this._.fields.children].remove(index, f, e);
				} else {
					this._remove(f, e);
				}
			}
		},
		_push: function (node) {
			node._.parent = this;
			node._.index = this[this._.fields.children].length;

			this[this._.fields.children]._push(node);
		},
		push: function (node, anyway) {
			if (this._ && this._.fields && this._.fields.parent && this._.fields.child) {
				var t = this.xpath(this._.fields.parent, $.xpath(node, this._.fields.child));

				var arr = (t ? t : this)[this._.fields.children];

				if (t || anyway) {
					arr._push(arr._ && arr._.type && !node.type ? $.create(node, arr._.type) : node);
				}
			}
		},
		getCount: function () {
			var c = this[this._.fields.children].length;
			this[this._.fields.children].forEach(function (item) {
				c += item.count();
			});
			return c;
		},
		getParent: function () {
			var r = null;
			if (this._ && this._.fields && this._.fields.parent) {
				r = this.get(this[this._.fields.parent]);
			} else {
				console.log('can\'t get parent');
			}
			return r;
		}
	});

	return $;
}));
