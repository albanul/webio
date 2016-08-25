//Abstract class. Descendants must implement methods filterCondition and tryToMoveCondition and add property ownerType.
//Handles reordering items in dictionary.
//Reorders items in dictionaries that pass both filterCondition and tryToMoveCondition (if thisClientIsInitiator isn't set to true).
//Reloads items if only filterCondition is passed.

//Remember to set thisClietnIsInitiator to true before saving object or moveDictionaryItem may work incorrectly (most probably just do unnecessary reloads).
define(['factory', 'dictionary'], function ($) {
	$.add('moveDictionaryItem', {
		_: {
			thisClientIsInitiator: false		//if set to true moveDictionaryItems assumes that dictionarys that could be reordere are already reordered and do nothing with them. Dictionaries that was to be reloaded are still reloaded.
		},
		id: 0,
		from: 0,
		to: 0,
		order: 1,
		ownerType: ''			//e.g. category for card, course for courseScreen
	}, 'object', {
		handle: function (n) {
			var self = this;
			var	owner = self.ownerType && $.collections[self.ownerType] && $.collections[self.ownerType][self.from];

			Object.keys($.collections.dictionary).filter(function (dictId) {
				return self.filterCondition($.collections.dictionary[dictId], owner);
			}).forEach(function (dictId) {
				var d = $.collections.dictionary[dictId];
				if (self.tryToMoveCondition(d, owner)) {
					if (!self._.thisClientIsInitiator) {			//This flag should be set by client which initiate moving of items. If it is true, item have already been moved and no actions by moveDictionaryItems are required.
						d.findAndReorderOrClear(self.id, self.order, true);
					}
				} else {
					d.clearAllReloadViewed();
				}
			});
		},
		//filters dictionaries to update
		//owner is just $.collections[self.ownerType][self.from] so for each moveDictionaryItem object there is only one owner object
		//owner may or may not have property thats value is equals to dictionary passed as parameter
		filterCondition: function(dictionary, owner) {
			throw 'Not implemented!';
		},
		//this method is called for dictionaries filtered with filterConditionMethod
		//if true moveDictionaryItem object tries to move item instead of clearing or reloading dictionary
		tryToMoveCondition: function(dictionary, owner) {
			throw 'Not implemented!';
		}
	});
});