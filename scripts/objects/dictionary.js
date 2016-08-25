define(['jquery', 'factory'], function($) {
	'use strict';

	$.add('dictionary', {
		_: {
			dontSend: true,
			viewers: []
		},
		params: {
			withRows: true
		},
		count: 6,
		pages: {},
		_pagesCounter: 1,
		advanceLoading: false,
		pageNumber: undefined,
		consecutivePages: 0,	// number of consecutive pages from first that are loaded
		itemsLength: 0, // To be changed with _setItemsLength only!
		pagesCount: 0,  // To be changed with _setItemsLength only!
		beforeFirstRequestCompleted: true,
		itemsType: 'auto'
	}, 'object', {
		/**
		 *	
		 * @param {object}	r						r can contain listed properties only or can be serialized Rows object to initialize first page of the dictionary
		 * @param {number}	r.itemsOnPage			items on page
		 * @param {bool}	r.advancedLoading		load next page in advance when page is loaded (not tested)
		 * @param {object}	r.params				params for arrays of all pages
		 * @param {boolean}	r.observed
		 */
		init: function (r) {
			this.clientId = this.clientId || $.getId();
			$.collections.dictionary[this.clientId] = this;
			this.params.withRows = true;
			
			if (r) {
				if (typeof r.itemsOnPage !== 'undefined') {
					this.count = r.itemsOnPage;
				}

				if (typeof r.advanceLoading !== 'undefined') {
					this.advanceLoading = r.advanceLoading;
				}

				if (r.itemsType) {
					this.itemsType = r.itemsType;
				}

				//init only empty dictionaries from empty list object
				if (r.list && (!this.itemsLength || r.list.length || (r.list.list && r.list.list.length))) {
					var listObj = r.list.list ? r.list : r;

					this._setItemsLength(listObj.count || 0);

					$.setProperty(this, 'beforeFirstRequestCompleted', false);

					var firstPageIndex = Math.ceil((listObj.offset || 0) / this.count) + 1;
					var skipElements = (firstPageIndex - 1) * this.count - (listObj.offset || 0);
					var pagesToInit =  Math.ceil((listObj.list.length - skipElements) / this.count);

					for (var i = 0; i < pagesToInit; i++) {
						var pageToInit = firstPageIndex + i;

						if (!this.pages[pageToInit]) {
							$.setProperty(this.pages, pageToInit + '', $.array({
								type: this.itemsType,
								params: r.params,
								offset: (pageToInit - 1) * this.count
							}));
						}

						var startFromIndex = (pageToInit - 1) * this.count - (listObj.offset || 0);
						this.pages[pageToInit].init({
							list: listObj.list.slice(startFromIndex, startFromIndex + this.count),
							count: listObj.count
						}, false);

						if (this.pages[pageToInit].length + pageToInit * this.count < this.itemsLength && this.pages[pageToInit].length < this.count) {
							this._setUncomplete(this.pages[pageToInit]);
						} else {
							this._setUncomplete(this.pages[pageToInit], false);
						}

						this._updateConsecutivePages();
					}
				}

				$.extend(true, this.params, r.params);
			}

			if (!this.observed && !nodejs) {
				this.observed = true;

				var self = this;

				$.observe(this, 'count', function() {
					self.clear();
					self.getPage(1);
				});
			}

			this._.ignoreClear = true;
		},
		clear: function () {
			$.setProperty(this, {
				pages: {},		
				pageNubmer: undefined,
				itemsLength: undefined,
				pagesCount: undefined,
				consecutivePages: 0,
				beforeFirstRequestCompleted: true
			});
		},
		/**
		 * Clears all pages and reloads current
		 * @param {number}         itemsRemoved     // Count of items that was removed
		 * @param {boolean}        useUncomplete    // If true - set uncomplete flag of the page to true, and don't reload it
		 * @param {function()}     callback
		 */
		clearAllReloadViewed: function (itemsRemoved, useUncomplete, callback) {
			var self = this;
			// set all pages in dictionary to undefined except for the viewed pages
			Object.keys(self.pages).forEach(function (page) {
				if (!self.pageIsViewed(page)) {
					//$.setProperty(self.pages, page+'', undefined);
					if (self.pages[page]) {	//crutch for jsViews
						self.pages[page].clear();
					}
				}
			});
			// if useUncomplete don't reload current page
			self._.viewers.filter(function (viewer) {
				return viewer.page;
			}).forEach(function (viewer) {
				if (!useUncomplete && !self.isLoadingPage(viewer.page)) {
					// reload current page
					self.getPage(viewer.page, callback, true, true);
				} else if (self.pages[viewer.page]) {
					// mark page as uncomplete
					self._setUncomplete(self.pages[viewer.page]);
					callback && callback();
				}
			});
			self._updateConsecutivePages();
		},
		/**
		 * Set current page and reload it if necessary
		 * @param {number}				n				number of page
		 * @param {function()}			callback 
		 * @param {boolean=true}		updateLength	whether number of pages should be updated
		 * @param {boolean}				force			update page even if it's already loaded and ucomplete flag is set to false
		 */
		getPage: function (n, callback, updateLength, force) {
			var self = this;
			updateLength = updateLength === undefined ? true : updateLength;

			if (!self.pages[n] || self.pages[n].length === 0 || self._pageIsUncomplete(self.pages[n]) || force) {
				// if page isn't created or page is empty or page is uncomplete or force flag is true
				var array = self.pages[n] || $.array({
							type: self.itemsType,
							params: self.params,
							offset: (n - 1) * self.count
						});
				if (!array._) {
					array._ = {};
					array._.offset = 0;
				}
				array._.type = self.itemsType;
				array._.params = self.params;

				$.setProperty(self.pages, String(n), array);
				if (array.length > 0) {
					array.clear();
				}

				array.load(self.count, function (r) {
					$.setProperty(self, '_pagesCounter', self._pagesCounter + 1);
					self._setUncomplete(array, false);
					$.setProperty(self, 'beforeFirstRequestCompleted', false);

					if (updateLength && r.count != undefined) {
						self._setItemsLength(r.count);
					}
					self._updateConsecutivePages();

					// call callback if it exists
					callback && callback();
				});

				$.setProperty(self, '_pagesCounter', self._pagesCounter + 1);
			} else {
				self._setItemsLength(self.itemsLength);		//sometimes pagesCount is incorrect
				// if page have been already loaded then refresh nth page
				if (self._pageIsUnrefreshed(self.pages[n])) {
					self.pages[n].refresh();
					self._setToBeRefreshed(self.pages[n], false);
					self._updateConsecutivePages();
				}
				// call the callback if it exists
				callback && callback();
			}

			return this.pages[n];
		},
		/**
		 * Search for an element on loaded pages and return page number.
		 * @param		{number}	id		id of an element
		 * @returns		{number}			number of the page if element was found, otherwise null
		 */
		getElementPage: function (id) {
			var self = this;
			var foundPage = null;

			Object.keys(self.pages).some(function (pageNumber) {
				if (pageNumber <= self.pagesCount) {
					if (self.pages[pageNumber] && self.pages[pageNumber].search(id) >= 0) {
						foundPage = pageNumber;
						return true;
					} else {
						return false;
					}
				}
			});
			return foundPage;
		},
		/**
		 * returns empty dictionary with changed params
		 * @param		{object}		params		paramsToBeChanged
		 * @param		{boolean}		replace		wether extend or replace params
		 * @returns		{object}					empty dictionary with changed params
		 */
		emptyWithChangedParams: function(params, replace) {
			var self = this;
			var newParams = replace
				? params
				: $.extend(true, {}, self.params, params);
			return $.create({
				itemsType: self.itemsType,
				itemsOnPage: self.count,
				params: newParams
			}, 'dictionary');
		},
		/**
		 * clears dictionary and changes params
		 * @param		{object}		params		paramsToBeChanged
		 * @param		{boolean}		replace		wether extend or replace params
		 * @returns		{object}					returns self 
		 */
		clearChangeParams: function(params, replace) {
			var self = this;
			$.setProperty(self, {
				pages: {},
				viewers: [],
				pageNumber: undefined,
				itemsLength: 0,
				pagesCount: 0,
				conscecutivePages: 0,
				beforeFirstRequestCompleted: true,
				params: replace
					? params
					: $.extend(true, {}, self.params, params)
			});
			return self;
		},
		/**
		 * Filters dictionary elements which are not undefined on loaded pages.
		 * Callbakc takes one argument: filtered element (no index and array arguments like in Array.prototype.filter)
		 * @param	{function}	callback 
		 * @returns {array} 
		 */
		filter: function (callback) {
			var self = this;
			return Object.keys(self.pages).reduce(function (result, nextPageNumber) {
				var nextPage = self.pages[nextPageNumber];
				return nextPage
					? result.concat(nextPage.filter(function (e) {
						return e && callback(e);
					}))
					: result;
			}, []);
		},
		/**
		 * Works like Array.prototype.reduce but initialValue argument is mandatory.
		 * Works only for elements wich are not undefine
		 * @param	{function}	callback 
		 * @param	{object}	initialValue
		 * @returns {array} 
		 */
		reduce: function (callback, initialValue) {
			var self = this;
			return Object.keys(self.pages).reduce(function (result, nextPageNumber) {
				var nextPage = self.pages[nextPageNumber];
				return nextPage
					? nextPage.reduce(function (innerResult, nextElement) {
						return nextElement !== undefined
							? callback(innerResult, nextElement)
							: innerResult;
					}, result)
					: result;
			}, initialValue);
		},
		_get: function(prop, value) {
			var self = this;
			var r = null;

			Object.keys(self.pages).some(function (page) {
				return r = self.pages[page]._get(prop, value);
			});

			return r;
		},
		xpath: function (path, value) {
			var self = this;
			return self._get(function (a, b) {
				return $.xpath(a, path) === b;
			}, value, index);			
		},
		/**
		 * Unshifts element into dictionary, 
		 * sets uncomplete and toBeRefreshed flags, reloads current page.
		 * 
		 * @param	{object} element 
		 * @param	{function} callback 
		 */
		unshift: function(element, callback) {
			var self = this;

			if (self.beforeFirstRequestCompleted) {
				callback && callback();
			}

			self._setItemsLength(self.itemsLength + 1);

			if (self.itemsLength === 0) {
				// if there are no pages in the dictionary
				// then create new first page with this element
				$.setProperty(self.pages, '1', $.array([element], {
					type: this.itemsType,
					params: this.params,
					offset: 0
				}));


			} else {
				// for all pages starting from the second put the last element at the beggining of the next page
				for (var i = self.pagesCount; i >= 2; i--) {
					if (self.pages[i]) {
						if (self.pages[i - 1] && self.pages[i - 1][self.itemsOnPage]) {
							//unshift element and refresh markup if page is viewed
							if (i < self.pagesCount) {
								self.pages[i].pop();
							}
							self.pages[i].unshift(self.pages[i - 1][self.itemsOnPage]);
							self._setToBeRefreshed(self.pages[i]);
							if (self.pageIsViewed(i)) {
								self.getPage(i);
							}
						} else {
							if (self.pageIsViewed(i)) {
								var loadAndUnshift = function (pageIndex) {
									var page = self.pages[pageIndex];
									var missingElementAsArray = $.array({
										type: self.itemsType,
										params: self.params,
										offset: (pageIndex - 1) * self.count - 1
									});
									missingElementAsArray.load(1, function (r) {
										if (pageIndex < self.pagesCount) {
											page.pop();
										}
										page.insert(0, missingElementAsArray[0]);
										self._updateConsecutivePages();
									});
								}
								//load missing element
								loadAndUnshift(i);
							} else {
								//unshift undefiend; page may be updated later
								if (i < self.pagesCount) {
									self.pages[i].pop();
								}
								self.pages[i].unshift(undefined);
								self._setUncomplete(self.pages[i]);
							}
						}
					}
				}

				if (self.pages[1]) {
					// if the first page in the dictionary exists
					// then add the element to the beggining of the page
					if (self.pagesCount > 1) {
						self.pages[1].pop();
					}
					self.pages[1].unshift(element);
					self._setToBeRefreshed(self.pages[1]);
					if (self.pageIsViewed(1)) {
						self.pages[1].refresh();
					}
				}
			}

			self._updateConsecutivePages();
			callback && callback();
		},
		/**
		 * Pushes element or array of elements into dictionary. Reloads last page if loadUncompletePage
		 * @param {object|array}	elements 
		 * @param {boolean}			loadUncompletePage		whether to load uncomplete page to wich elements was pushed or set uncomplete flag only
		 * @param {function}		callback 
		 */
		push: function(elements, loadUncompletePage, callback) {
			var self = this;
			var pagesBeforePush = self.pagesCount;
			if (Object.prototype.toString.call(elements) !== '[object Array]') {
				elements = [elements];
			}
			if (self.beforeFirstRequestCompleted || elements.length === 0) {
				callback && callback();
			} else {
				var itemsOnLastPage = self.itemsLength % self.count;
				var remainingElements;

				//this function is called synchronously or from callback
				var doRemainingActions = function() {
					var pagesRemaining = Math.ceil(remainingElements.length / self.count);
					for (var i = 0; i < pagesRemaining; i++) {
						//create next new page from remaining elements to be pushed
						if (!self.pages[self.pagesCount + i + 1]) {		
							var anotherNewPage = $.array(remainingElements.slice(i * self.count, self.count), {
								type: self.itemsType,
								params: self.params,
								offset: (pagesBeforePush + i) * self.count
							});
							self._setToBeRefreshed(anotherNewPage);
							$.setProperty(self.pages, self.pagesCount + i + 1 + '', anotherNewPage);
						} else { //crutch for jsViews
							self.pages[self.pagesCount + i + 1].pop(self.pages[self.pagesCount + i + 1].length);
							self.pages[self.pagesCount + i + 1].push.apply(self.pages[self.pagesCount + i + 1], remainingElements.slice(i * self.count, self.count));
							self._setToBeRefreshed(self.pages[self.pagesCount + i + 1]);
						}
					}

					self._setItemsLength(self.itemsLength + elements.length);
					self._updateConsecutivePages();
					callback && callback();
				}

				if (itemsOnLastPage !== 0) {
					if (self.pages[pagesBeforePush]) {
						//Page is loaded. Push new elements, request to server isn't needed.
						self.pages[pagesBeforePush]
							._push(elements.slice(0, self.count - itemsOnLastPage));
						remainingElements = elements.slice(self.count - itemsOnLastPage);

						//Push remaining elements to dictionary.
						doRemainingActions();
					} else {
						var newPage;
						if (!loadUncompletePage) {
							//If loadUncompletePage is false then create new page from array of undefined and new elements and set uncomplete to true.
							newPage = $.array((new Array(itemsOnLastPage)).concat(elements.slice(0, self.count)), {
								type: self.itemsType,
								params: self.params,
								offset: (pagesBeforePush - 1) * self.count
							});
							self._setUncomplete(newPage);
							$.setProperty(self.pages, self.pagesCount + '', newPage);
							remainingElements = elements.slice(self.count - itemsOnLastPage);

							//Push remaining elements to dictionary.
							doRemainingActions();
						} else {
							//If loadUncompletePage is true then just reload page.
							newPage = $.array({
								type: self.itemsType,
								params: self.params,
								offset: (pagesBeforePush - 1) * self.count
							});
							newPage.load(this.count, function(r) {
								$.setProperty(self.pages, self.pagesCount + '', newPage);
								remainingElements = elements.slice(self.count - itemsOnLastPage);

								//Push remaining elements to dictionary.
								doRemainingActions();
							});
						}
					}

				} else {
					remainingElements = elements;

					doRemainingActions();
				}
			}
			self._updateConsecutivePages();
		},
		/**
		 * Moves element to specified index (from zero)
		 * @param		{number}		elementId				
		 * @param		{number}		destIndex				Counted from zero.
		 * @param		{boolean}		afterServerUpdated		If false loads missing elements from their positions before rerodering
		 * @param		{function()}	callback 
		 * @param		{number}		sourcePageIndex			Counted from one. If specified start to look for element on this page.
		 * @returns		{} 
		 */
		findAndReorderOrClear: function (id, destIndex, afterServerUpdated, callback, sourcePageIndex) {
			var self = this;

			if (self.beforeFirstRequestCompleted) {
				callback && callback();
			}

			sourcePageIndex = sourcePageIndex && +sourcePageIndex;
			var destPageIndex = Math.floor(destIndex / self.count) + 1;
			if (destPageIndex > self.pagesCount) {
				throw 'Invalid destination page index!';
			}
			var destPage = self.pages[destPageIndex];
			var indexOnPage = -1;
			var newIndexOnPage = destIndex % self.count;
			var sourcePage = sourcePageIndex && self.pages[sourcePageIndex];
			if (sourcePage) {
				indexOnPage = sourcePage.search(id);
			}
			if (indexOnPage === -1) {
				sourcePageIndex = +self.getElementPage(id);
			}

			if (!sourcePageIndex) {
				self.clearAllReloadViewed(null, null, callback);
				return;
			}

			sourcePage = self.pages[sourcePageIndex];
			indexOnPage = sourcePage.search(id);
			var element = sourcePage[indexOnPage];
			
			//we may need to do more than one request and execute callback after all of them are completed
			var requestsInProgress = 0;

			if (sourcePageIndex === destPageIndex) {
				$.observable(sourcePage).move(indexOnPage, newIndexOnPage);
			} else if (sourcePageIndex < destPageIndex) {		//shifting elements back
				for (var i = sourcePageIndex; i < destPageIndex; i++) {
					var pageToBeModyfied = self.pages[i];
					var nextPage = self.pages[i + 1];
					if (pageToBeModyfied) {
						if (i == sourcePageIndex) {
							pageToBeModyfied.remove(indexOnPage);
						} else {
							pageToBeModyfied.remove(0);
						}
						if (nextPage && nextPage[0]) {
							if (self.pageIsViewed(i)) {
								pageToBeModyfied._push(nextPage[0]);
							} else {
								pageToBeModyfied.push(nextPage[0]);
								self._setToBeRefreshed(pageToBeModyfied);
							}
						} else {
							if (self.pageIsViewed(i)) {
								var loadAndPush = function (pageIndex) {
									var page = self.pages[pageIndex];
									var missingElementAsArray = $.array({
										type: self.itemsType,
										params: self.params,
										offset: pageIndex * self.count - (afterServerUpdated ? 1 : 0)
									});
									requestsInProgress++;
									missingElementAsArray.load(1, function (r) {
										requestsInProgress--;
										page._push(missingElementAsArray[0]);
										if (requestsInProgress === 0) {
											callback && callback();
										}
										self._updateConsecutivePages();
									});
								}

								loadAndPush(i);
							} else {
								self._setUncomplete(pageToBeModyfied);
							}
						}
					}
				}

				if (destPage) {
					destPage.remove(0);
					destPage.insert(newIndexOnPage, element);
					if (requestsInProgress === 0) {
						callback && callback();
					}
				}
			} else {	// sourcePageIndex > destPageIndex		shifting elements forward
				for (var i = sourcePageIndex; i > destPageIndex; i--) {
					var pageToBeModyfied = self.pages[i];
					var prevPage = self.pages[i - 1];
					if (pageToBeModyfied) {
						if (i == sourcePageIndex) {
							pageToBeModyfied.remove(indexOnPage);
						} else {
							pageToBeModyfied.remove(self.count - 1);
						}
						if (prevPage && prevPage[self.count - 1]) {
							if (self.pageIsViewed(i)) {
								pageToBeModyfied.insert(0, prevPage[self.count - 1]);
							} else {
								pageToBeModyfied.unshift(prevPage[self.count - 1]);
								self._setToBeRefreshed(pageToBeModyfied);
							}
						} else {
							if (self.pageIsViewed(i)) {
								var loadAndUnshift = function (pageIndex) {
									var page = self.pages[pageIndex];
									var missingElementAsArray = $.array({
										type: self.itemsType,
										params: self.params,
										offset: (pageIndex - 1) * self.count - (afterServerUpdated ? 0 : 1)
									});
									requestsInProgress++;
									missingElementAsArray.load(1, function (r) {
										requestsInProgress--;
										page.insert(0, missingElementAsArray[0]);		
										if (requestsInProgress === 0) {
											callback && callback();
										}
										self._updateConsecutivePages();
									});
								}

								loadAndUnshift(i);
							} else {
								self._setUncomplete(pageToBeModyfied);
							}
						}
					}
				}

				if (destPage) {
					destPage.remove(self.count - 1);
					destPage.insert(newIndexOnPage, element);
					if (requestsInProgress === 0) {
						callback && callback();
					}
				}
			}
			self._updateConsecutivePages();
		},
		remove: function(pageIndex, elementToRemove, callback) {
			var self = this;
			var result = {			//object passed to the callback and to be returned from the function
				elementFoundAndRemoved: false,
				currentPageDeleted: false
			};
			if (!self.pages[pageIndex]) {
				callback && callback(result);
				return result;
			}

			//search for the element
			var elementIndex = -1;
			if (typeof (elementToRemove) === 'function') {
				self.pages[pageIndex].some(function(el, i) {
					if (elementToRemove(el)) {
						elementIndex = i;
						return true;
					} else {
						return false;
					}
				});
			} else if (typeof (elementToRemove) === 'number') {
				elementIndex = self.pages[pageIndex].search(elementToRemove);
			} else {
				elementIndex = self.pages[pageIndex].search(elementToRemove.id);
			}
			if (elementIndex === -1) {
				callback && callback(result);
				return result;
			}

			//this function is called synchronously or from callback
			var doRemainingActions = function() {
				for (var i = pageIndex + 1; i < self.pagesCount; i++) {
					//shift left elements on the next page
					if (self.pages[i]) {
						self.pages[i].splice(0, 1);
						if (self.pages[i + 1] && self.pages[i + 1][0] !== undefined) {
							self.pages[i].push(self.pages[i + 1][0]);
						} else {
							self.pages[i].push(undefined);
							self._setUncomplete(self.pages[i]);
						}
						self._setToBeRefreshed(self.pages[i]);
					}
				}

				if (self.pages[self.pagesCount]) {
					self.pages[self.pagesCount].remove(0);
					if (self.pages[self.pagesCount].length == 0) {
						//remove last page
						//$.setProperty(self.pages, pageIndex + '', undefined);
						result.currentPageDeleted = true;
					}
				}

				self._setItemsLength(self.itemsLength - 1);

				result.elementFoundAndRemoved = true;
				self._updateConsecutivePages();
				callback && callback(result);
				return result;
			}

			//remove one element and shift other elements left
			if (+pageIndex !== +self.pagesCount) {
				//not last page

				if (!self.pages[+pageIndex + 1] || self.pages[+pageIndex + 1][0] == undefined) {
					//missing element have to be loaded from server
					var missingElementAsArray = $.array({
						type: self.itemsType,
						params: self.params,
						offset: pageIndex * self.count - 1
					});
					$.observable(self.pages[pageIndex]).remove(elementIndex);
					missingElementAsArray.load(1, function(r) {
						
						self.pages[pageIndex]._push(missingElementAsArray[0]);

						//load next page in advance for the purpose of removing element faster next time
						if (self.advanceLoading) {
							self.getPage(pageIndex + 1);
						}

						//shift remaining pages
						doRemainingActions();
					});
				} else {
					//missing element is already loaded to the client
					$.observable(self.pages[pageIndex]).remove(elementIndex);
					self.pages[pageIndex]._push(self.pages[+pageIndex + 1][0]);
					
					//shift remaining pages
					doRemainingActions();
				}
			} else {
				//last page
				$.observable(self.pages[pageIndex]).remove(elementIndex);
				if (self.pages[pageIndex].length == 0) {
					//remove last page
					//$.setProperty(self.pages, pageIndex + '', undefined);
					result.currentPageDeleted = true;
				}

				self._setItemsLength(self.itemsLength - 1);

				result.elementFoundAndRemoved = true;
				callback && callback(result);
				return result;
			}
			self._updateConsecutivePages();
		},
		/**
		 * If one of the loaded pages contains element, remove it, else clear dictionary.
		 * @param		{number}		elementId 
		 * @param		{boolean=true}		reloadViewed	
		 * @param		{function}		callback
		 * @returns {} 
		 */
		findAndRemoveOrClear: function (elementId, reloadViewed, callback) {
			var self = this;
			reloadViewed = reloadViewed === undefined ? true : reloadViewed;
			var elementPage = self.getElementPage(elementId);
			if (elementPage !== null) {
				self.remove(elementPage, elementId, callback);
			} else {
				if (reloadViewed) {
					self.clearAllReloadViewed(1, null, callback);
				} else {
					self.clear();
				}
				callback && callback();
			}
		},
		/**
		 * Change page items length and pages count
		 * @private 
		 * @param {Number} itemsLength - items length
		 * @returns {undefined} 
		 */
		isLoadingPage: function(pageNumber) {
			var self = this;

			return self.pages && self.pages[pageNumber] && self.pages[pageNumber]._ && self.pages[pageNumber]._.send;
		},
		/**
		 * Specified page will be reloaded instead of clearing
		 * @param {number} page 
		 * @returns {} 
		 */
		addViewer: function (page) {
			var self = this;
			var newViewer = {
				page: page,
				dictionary: self
			};
			self._.viewers.push(newViewer);
			return newViewer;
		},
		removeViewer: function(viewer) {
			var self = this;
			var i = self._.viewers.indexOf(viewer);
			if (i >= 0) {
				self._.viewers.splice(i, 1);
				return true;
			} else {
				return false;
			}
		},
		pageIsViewed: function (pageNumber) {
			var self = this;
			return self._.viewers.some(function (viewer) {
				return viewer.page == pageNumber;
			});
		},
		_setItemsLength: function (itemsLength) {
			var self = this;
			$.setProperty(self, {
				itemsLength: itemsLength,
				pagesCount: self.count ? Math.ceil(itemsLength / self.count) : 0
			});
			self._.viewers.forEach(function (viewer) {
				if (viewer.page > self.pagesCount && viewer.page != 1) {
					viewer.page = undefined;
				}
			});
		},
		/**
		 * Set refreshed property of the page to be true
		 * @private 
		 * @param {Object} page - page object
		 * @returns {undefined} 
		 */
		_setToBeRefreshed: function (page, value) {
			$.extend(true, page, {
				_: {
					toBeRefreshed: typeof (value) !== 'undefined' ? value : true
				}
			});
		},
		/** Set uncomplete property of the page to be true
		 * @private 
		 * @param {Object} page - page object
		 * @returns {undefined} 
		 */
		_setUncomplete: function(page, value) {
			$.extend(true, page, {
				_: {
					uncomplete: typeof (value) !== 'undefined' ? value : true
				}
			});
		},
		/**
		 * @private
		 * returns true if page._.toBeRefreshed is true
		 * @param {array} page 
		 * @returns {} 
		 */
		_pageIsUnrefreshed: function (page) {
			return page._ && page._.toBeRefreshed;
		},
		/**
		 * returns true if page._.uncomplete is true
		 * @param {array} page 
		 * @returns {} 
		 */
		_pageIsUncomplete: function (page) {
			return page._ && page._.uncomplete;
		},
		/**
		 * @private
		 * Updates number of consecutive pages from first that are loaded
		 * @returns {} 
		 */
		_updateConsecutivePages: function () {
			var self = this;
			var consecutivePages = 0;
			for (var i = 1; i <= self.pagesCount; i++) {
				var page = self.pages[i];
				if (page && page.length > 0 && !self._pageIsUncomplete(page)) {
					consecutivePages++;
				} else {
					break;
				}
			}
			$.setProperty(self, 'consecutivePages', consecutivePages);
		}
	});
});