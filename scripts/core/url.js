define(['jquery', 'es5-shim', 'es5-sham', nodejs ? undefined : 'history'], function ($) {
	(nodejs ? global : window).url = (function (exports, $) {
		/**
		 * Histories and index.
		 */
		var histories = [location.href],
			historiesIndex = 0;

		/**
		 * Subscribers array.
		 */
		var subscribers = [];

		/**
		 * Replacing.
		 */
		var dontEvaluateState = false,
			dontPushState     = false;

		/**
		 * Updating.
		 */
		var dontUpdateStateParameters = false;

		/**
		 * State.
		 */
		var stateSearch = {},
			stateHash = {},
			statePath = [];

		var serialize = function (source, starter, separator) {
			var serializedData = Object.keys(source).map(function (key) {
				var value = source[key];

				return Array.isArray(value) ?
					value.map(function (valueElement, i) {
						return key + '[' + i + ']' + '=' + valueElement;
					}).join(separator) : (value !== null ? (value !== '' ? key + '=' + value : key) : '');
			}).filter(function (entry) {
				return entry;
			}).join(separator);

			return serializedData ? starter + serializedData : '';
		}

		var serializeStateHash = exports.serializeStateHash = function () {
			return serialize(stateHash, '#', ';');
		}

		var serializeStateSearch = exports.serializeStateSearch = function () {
			return serialize(stateSearch, '?', '&');
		}

		var serializeStatePath = exports.serializeStatePath = function () {
			return '/' + statePath.join('/');
		}

		var serializeState = exports.serializeState = function () {
			return serializeStatePath() + serializeStateSearch() + serializeStateHash();
		}

		/**
		 * Public
		 */

		/**
		 * Get state hash.
		 */
		var getStateHash = exports.getStateHash = function () {
			return stateHash;
		};

		/**
		 * Get state search.
		 */
		var getStateSearch = exports.getStateSearch = function () {
			return stateSearch;
		};

		/**
		 * Get state path.
		 */
		var getStatePath = exports.getStatePath = function () {
			return statePath;
		};

		/**
		 * Get histories.
		 */
		var getHistories = exports.getHistories = function () {
			return histories;
		};

		/**
		 * Get histories index.
		 */
		var getHistoriesIndex = exports.getHistoriesIndex = function () {
			return historiesIndex;
		};

		/**
		 * Get parameters.
		 */
		var parse = exports.parse = function (source, splitter) {
			var indexPattern = /\[(\d+)\]/;
			var parameters = {},
				pairs = (source || '').split(splitter);

			pairs.forEach(function (pair, pairIndex) {
				if (pairs[pairIndex] === '')
					return;

				var values = pairs[pairIndex].split('=');

				var key = values[0],
					value = values[1] || 0;

				if (indexPattern.test(key)) {
					var index = parseInt(indexPattern.exec(key)[1]),
						parameter = key.split('[')[0];

					parameters[parameter] = parameters[parameter] || [];
					parameters[parameter][index] = decodeURIComponent(value || '');
				} else {
					parameters[key] = decodeURIComponent(value || '');
				}
			});

			return parameters;
		};

		/**
		 * Get hash parameters.
		 */
		var parseUrlHash = exports.parseUrlHash = function () {
			return parse(location.hash.slice(1), ';');
		};

		/**
		 * Get search parameters.
		 */
		var parseUrlSearch = exports.parseUrlSearch = function () {
			return parse(location.search.slice(1), '&');
		};

		/**
		 * Get path vector
		 */
		var parseUrlPath = exports.parseUrlPath = function () {
			return location.pathname.slice(1).split('/');
		};

		var updateState = exports.updateState = function () {
			stateSearch = parseUrlSearch();
			stateHash = parseUrlHash();
			statePath = parseUrlPath();
		};

		updateState();

		if (!nodejs)
			$(window).bind('popstate', function (event) {
				var state = History.getState(),
					href = location.href;

				var data = state.data || {};

				/**
				 * Not necessary to update state parameters
				 * if change of one of them initiated popstate.
				 */
				if (!dontUpdateStateParameters) {
					var oldStatePathFirst = statePath[0];
					var oldStatePathLength = statePath.length;

					statePath   = parseUrlPath();
					stateSearch = parseUrlSearch();
					stateHash   = parseUrlHash();
				}

				/**
				 * Not necessary to go further
				 * if only replace required.
				 */
				if (dontPushState) {
					histories[historiesIndex] = href;

					return;
				}

				if (!dontEvaluateState) {
					if (href === histories[historiesIndex - 1]) {
						// If going back.
						// Let user to go back.
						--historiesIndex;
					} else if (href === histories[historiesIndex + 1]) {
						// If going forward.
						// Let user to go forward.
						++historiesIndex;
					} else if (href !== histories[historiesIndex]) {
						// If going to new path.
						// Let user to visit new path.
						histories[++historiesIndex] = href;

						// Cut unreachable histories branch.
						histories.splice(historiesIndex + 1, histories.length);
					}

					if (subscribers.some(function (subscriber, index) {
						var skip;

						skip = data.tag && !data.any && (!subscriber.tag || subscriber.tag.split(',').indexOf(data.tag) < 0);
						skip = skip || data.ignore;

						if (skip) {
							return;
						}

						var status = subscriber(state, false) || {};

						if (status.freeze) {
							if (href === histories[historiesIndex - 1]) {
								// If going back.
								// Do not let user to go back.
								History.forward();
							} else if (href === histories[historiesIndex + 1]) {
								// If going forward.
								// Do not let user to go forward.
								History.back();
							}

							return true;
						}

						if (status.stop) {
							return true;
						}
					})) {
						// Stopped.
					} else {
						// Not stopped.
						// Try to go one last time.
						subscribers.some(function (subscriber, index) {
							var skip;

							skip = data.tag && !data.any && (!subscriber.tag || subscriber.tag.split(',').indexOf(data.tag) < 0);
							skip = skip || data.ignore;

							if (skip) {
								return;
							}

							var status = subscriber(state, true) || {};

							if (status.freeze) {
								if (href === histories[historiesIndex - 1]) {
									// If going back.
									// Do not let user to go back.
									History.forward();
								} else if (href === histories[historiesIndex + 1]) {
									// If going forward.
									// Do not let user to go forward.
									History.back();
								}

								return true;
							}

							if (status.stop) {
								return true;
							}
						});
					}
				}

				History.busy(false);
			});

		/**
		 * Subscribe
		 */
		var subscribe = exports.subscribe = function (tag, callback, id) {
			callback.tag = tag;
			callback.id = id;

			// If this subscriber already exists then
			// update it.
			var oldSubscriber;
			if (id && (oldSubscriber = subscribers.get(id)))
				unsubscribe(oldSubscriber);

			subscribers.push(callback);
		}

		exports.publish = function (id) {
			var handle = subscribers.get(id);
			if (handle) {
				handle(History.state);
			}
		}

		/**
		 * Unsubscribe
		 */
		var unsubscribe = exports.unsubscribe = function (callback) {
			var subscriberIndex;
			if (subscribers.some(function (subscriber, index) {
				if (subscriber === callback) {
					subscriberIndex = index;
					return true;
			}
			})) {
				subscribers.remove(subscriberIndex);

				return true;
			} else {
				return false;
			}
		}

		/**
		 * Replace state
		 */
		var replaceState = exports.replaceState = function (stateData, stateTitle, stateUrl) {
			dontPushState = true;

			if (stateData && stateData.ignore) {
				delete stateData.ignore;

				dontEvaluateState = true;
			}

			History.replaceState(stateData, stateTitle, stateUrl);

			if (dontEvaluateState)
				dontEvaluateState = false;

			dontPushState = false;
		}

		/**
		 * Push state
		 */
		var pushState = exports.pushState = function (stateData, stateTitle, stateUrl) {
			if (stateData && stateData.ignore) {
				delete stateData.ignore;

				dontEvaluateState = true;
			}

			History.pushState(stateData, stateTitle, stateUrl);

			if (dontEvaluateState)
				dontEvaluateState = false;

			History.busy(false);
		}

		/**
		 * Replace hash
		 */
		var replaceStateHash = exports.replaceStateHash = function (stateData, key, value) {
			if (key && typeof (key) === 'object') {
				var keyValuePairs = key;
				$.extend(stateHash, keyValuePairs);
			} else {
				stateHash[key] = value;
			}

			var newSerializedState = serializeState();

			dontUpdateStateParameters = true;

			replaceState(stateData, document.title, newSerializedState);

			dontUpdateStateParameters = false;
		}

		/**
		 * Push hash
		 */
		var pushStateHash = exports.pushStateHash = function (stateData, key, value) {
			if (key && typeof (key) === 'object') {
				var keyValuePairs = key;
				$.extend(stateHash, keyValuePairs);
			} else {
				stateHash[key] = value;
			}

			var newSerializedState = serializeState();

			dontUpdateStateParameters = true;

			pushState(stateData, document.title, newSerializedState);

			dontUpdateStateParameters = false;
		}

		/**
		 * Replace search
		 */
		var replaceStateSearch = exports.replaceStateSearch = function (stateData, key, value) {
			if (key && typeof (key) === 'object') {
				var keyValuePairs = key;
				$.extend(stateSearch, keyValuePairs);
			} else {
				stateSearch[key] = value;
			}

			var newSerializedState = serializeState();

			dontUpdateStateParameters = true;

			replaceState(stateData, document.title, newSerializedState);

			dontUpdateStateParameters = false;
		}

		/**
		 * Push search
		 */
		var pushStateSearch = exports.pushStateSearch = function (stateData, key, value) {
			if (key && typeof (key) === 'object') {
				var keyValuePairs = key;
				$.extend(stateSearch, keyValuePairs);
			} else {
				stateSearch[key] = value;
			}

			var newSerializedState = serializeState();

			dontUpdateStateParameters = true;

			pushState(stateData, document.title, newSerializedState);

			dontUpdateStateParameters = false;
		}

		/**
		 * Back
		 */
		var back = exports.back = function () {
			dontPushState = true;
			dontEvaluateState = true;

			History.back();

			dontPushState = false;
			dontEvaluateState = false;
		}

		/**
		 * Forward
		 */
		var forward = exports.forward = function () {
			dontPushState = true;
			dontEvaluateState = true;

			History.forward();

			dontPushState = false;
			dontEvaluateState = false;
		}

		/**
		 * Decompose
		 */
		var decompose = exports.decompose = function (string) {
			return {
				path: string.replace(/[?#].*/, '').replace(/(.*\/\/[^/]*\/)|\//, '').split('/'),
				search: string.indexOf('?') > 0 ? parse(string.replace(/.*\?([^#]*)(.*)/, '$1'), '&') : {},
				hash: string.indexOf('#') > 0 ? parse(string.replace(/.*#/, ''), ';') : {}
			};
		}

		return exports;
	}({}, $));
});