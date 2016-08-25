define(['factory'], function ($) {
	$.add('document', {
		_: {
			params: { sendArray: true, sendObject: true, depth: 1 }
		},
		name: '',
		langs: [],
		goEditing: false,
		active: false,
		current: 0,
		lang: 0
	}, 'object', {
		views:{
			keys: {
				langs: {
					caption: 'Short Description',
					view: '{^{for langs[~root^lang]}} {^{:shorttext}} {{/for}}'
				}
			}
		}
	});

	$.add('section', {
		_: {
			fields: {
				children: 'children',
				parent: 'parent',
				child: 'objectId'
			},
			params: {
				type: 'SectionParams',
				documents: 100,
				depth: 1,
				count: 100,
				sendArray: true,
				sendObject: true
			},
			ignoreClear: true
		},
		path: '',
		children: $.array({
			type: 'section'
		}),
		documents: $.array({
			type: 'document',
			params: {
				type: 'documentListParams',
				ignoreClear: true
			}
		}),
		lang: 0,
		current: 0,
		sectiontype: 3,
		defaultdocument: 0,
		page: '',
		published: false,
		valid: true,
		langs: $.array([], {
			params: {
				ignoreClear: true
			}
		}),
		created: false,
		active: false,
		disabled: false,
		hidden: false,
		title: '',
		tmpl: 'tmplArticle'
	}, 'tree', {
		setTitle: true,
		init: function (r) {
			this.baseinit(r);
		},
		baseinit: function (r) {
			if (r) {
				this.clientId = this.clientId || $.getId();
				$.init(this, r);

				if (this.id > 0) {
					this.documents._.params.id = this.id;
					$.setProperty(this._, 'loaded', true);
				}

				if (this.typePath) {
					this.data = this;

					this._.params.path = this.path;
				}

				if (!this.dfd) {
					this.dfd = $.Deferred();

					if (nodejs) {
						var self = this;

						self.create();
						self.activate();

						this.dfd.resolve('page complete');
					}
				}
			}
		},
		innerInit: function (r, callback) {
			var tmpl = this.tmpl;
			var title = this.title;

			this.clientId = this.clientId || $.getId();

			var self = $.init(this, r);

			self.realpath = self.realpath && decodeURI(self.realpath.toLowerCase());

			self.tmpl = tmpl;
			self.title = title;

			this.data = this;

			this._.params.path = this.path;

			self.name = self.name.toLowerCase();

			callback && callback(self);

			if (!self.dfd) {
				self.dfd = $.Deferred();
			}

			this.dfd = self.dfd;

			if (nodejs) {
				self.create();
				self.activate();
				this.create();
				this.activate();
			}

			if (r.id) {
				self.dfd.resolve('page complete');
			}
		},
		activate: function (node) {
			if (node) {
				$.setProperty(this.current, 'active', false);
				$.setProperty(this, 'current', node);
				$.setProperty(this.current, 'active', true);
			} else {
				if (!nodejs && this.setTitle && (this.title || (this.langs && this.langs[0].title))) {
					$(document).attr('title', this.title || this.langs[0].title);
				}

				$.setProperty(this, 'active', true);
			}
		},
		create: function () {
			$.setProperty(this, 'created', true);
		},
		scroll: function () { },
		seo: function (section) {
			var self = this,
				f = function (a, b) {
					return a.data.path === b;
				};
			if (section) {
				site.dfd.done(function () {
					var t = f(site.menu, section) ? site.menu : site.menu.get(section, f);
					if (t) {
						site.seo(t.data.documents.list.get(self.path, function (a, b) {
							return a.name === b;
						}));
					}
				});
			} else {
				site.dfd.done(function () {
					var t = f(site.menu, self.path) ? site.menu : site.menu.get(self.path, f);
					if (t) {
						site.seo(t.data);
					}
				});
			}
		},
		getByPath: function (path, tabs, dontset) {
			var n = this.func(function (a) {
				return a.path !== '' && (
					path.toLowerCase() === a.path.toLowerCase() ||
					path.toLowerCase() === '/' + a.path.toLowerCase() ||
					(a.complexPath && path.indexOf(a.path) !== -1));
			});

			if (n != null && !n.disabled) {
				site.setPage({
					path: n.path,
					name: n.name,
					sectiontype: n.sectiontype,
					push: 1,
					realpath: location.pathname + location.search + location.hash,
					dontset: dontset
				}, tabs);

				return n;
			} else {
				return false;
			}
		},
		newItem: function (data) {
			return $.create(data, 'section');
		},
		clear: function() {
			this._clear();

			$.observable(this).setProperty({created: false});
		},
		views: {
			keys: {
				documents: {
					show: false
				},
				realpath: {
					show: false
				},
				children: {
					show: false
				},
				langs: {
					show: false
				},
				typePath: {
					show: false
				}
			}
		}
	});

	$.add('page', {
		_: {
			params: {
				type: 'PageLoader',
				documents: 4,
				useSystemLang: true
			}
		}
	}, 'section', {
		init: function (r) {
			this.baseinit(r);
		},
		unique: function (d) {
			if (nodejs) {
				return null;
			} else {
				return d.realpath ? $.collections.xpath(this.type, 'realpath', decodeURI(d.realpath.split('?')[0].toLowerCase())) : null;
			}
		},
		_load: $.protos.section.load,
		load: function (callback) {
			if (!nodejs) {
				if (!window.location.origin) {
					window.location.origin = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
				}

				this._.params.fullpath = this.realpath ? window.location.origin + '/' + this.realpath + (this.realpath.indexOf('?') !== -1 ? '' : url.serializeStateSearch()) : window.location.href;

				this._load(callback);
			}
		},
		recreate: function () {
			this.clear();

			this.load((function () {
				this.create();
			}).bind(this));
		}
	});
});