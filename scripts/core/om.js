define(['jquery', 'jsviews', 'signalr'], function ($) {
	JSON.stringifyParts = function (target, properties) {
		return JSON.stringify(target, function (key, value) {
			if (this !== target)
				// If below first level
				return value;
			else {
				// If at first level
				return properties.some(function (item) {
					return key === item;
				}) || key === '' ? value : undefined;
			}
		});
	}

	window.OM = {
		init: function (target, modifiedByDefault, trackedProperties, remoteData) {
			// Return if observable modifications are already set
			if (typeof target.modified !== 'undefined')
				return;

			target.OM = {
				// Original snapshot
				original: JSON.stringifyParts(target, trackedProperties),

				// List of tracked properties
				trackedProperties: trackedProperties
			}

			// Set "modified" flag
			$.observable(target).setProperty({
				modified: modifiedByDefault || false
			});

			// Set observer function
			var observer = function (ev, arg) {
				var wasModified = target.modified,
					modified    = target.OM.original !== JSON.stringifyParts(target, trackedProperties) || target.id < 0;

				$.observable(target).setProperty({
					modified: modified
				});

				if (remoteData) {
					if (wasModified > modified)
						$.observable(remoteData).setProperty({
							count: remoteData.count - 1
						});
					else if (wasModified < modified)
						$.observable(remoteData).setProperty({
							count: remoteData.count + 1
						});
				}
			}

			// Call observe
			trackedProperties.forEach(function (propertyName) {
				var property = target[propertyName];

				$.observe(target, propertyName, observer);
			});
		},
		reset: function (target) {
			if (!target.OM)
				return;

			target.OM.original = JSON.stringifyParts(target, target.OM.trackedProperties);

			$.observable(target).setProperty({
				modified: false
			});
		}
	}
});