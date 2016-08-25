/**
 * Rate oriented tag.
 * 
 * Interface:
 *     <@args[0]>        {object}         target data.
 *     [@prop type]      {string}         objectType.
 *     [@prop className] {string}         DOM class name.
 *     [@prop readOnly]  {bool}           readonly flag.
 *     [@prop options]   {object}         pass in raty plugin.
 *
 */

define(['jquery', 'text!rating.html', 'css!rating.css', 'rate', 'tooltip'], function($, tmplRating) {
	'use strict';

	var uniqeRatingId = 1234;

	$.views.tags({
		rating: {
			template: tmplRating,
			init: function(tagCtx, linkCtx) {
				var self = this,
					options = self.options = tagCtx.props.options || tagCtx.props;

				self.data = tagCtx.args[0];

				self.type = options.type || self.data.type;

				self.id = options.id || 'rating-' + uniqeRatingId++;

				self.className = options.className || '';

				self.readOnly = options.readOnly || false;

				self.rating = typeof options.rating !== 'undefined' ? options.rating : self.data.rating || 0;
				self.yourRatingId = options.yourRatingId || -1;

				self.votes = options.votes || self.data.votes || 0;

				self.showTooltip = options.showTooltip || false;

				self.tooltipContextSelector = options.tooltipContextSelector || null;

				self.tooltipAutoPosition = options.tooltipAutoPosition || false;
				
				self.icon = options.icon || false;

				self.onRate = options.onRate;

				self.observeObject = options.observeObject === undefined ? true : options.observeObject;

				self.counts = [1, 2, 3, 4, 5];
			},
			onAfterLink: function(tagCtx, linkCtx) {
				var tag = this;

				if (!tag.readOnly) {
					tag.contents()
						.on('mouseover', '.stars .star-item', function () {
							$(this).addClass('hover-on').nextAll().addClass('hover-off').end().prevAll().addClass('hover-on');
						})
						.on('mouseout', '.stars .star-item', function () {
							tag.contents().find('.stars').children().removeClass('hover-on hover-off');
						})
						.on('click', '.stars .star-item', function () {
							var score = $.view(this).data;

							$.create({
								objectId: tag.data.id,
								id: tag.yourRatingId,
								rating: score,
								objectType: tag.type
							}, 'rate').save(function(r) {
								if (tag.onRate) {
									tag.onRate(r, score);
								}
							}, function(r) {
								if (tag.onRate) {
									tag.onRate(r, score);
								}
							});
						});
				}

				if (tag.observeObject) {
					$.observe(tag.data, 'rating', function (ev, args) {
						$.observable(tag).setProperty({
							rating: args.value
						});
					});
				}
			},
			onUpdate: function(ev, eventArgs, tagCtxs) {
				return false;
			},
			onBeforeChange: function(ev, eventArgs) {
				return true;
			},
			dataBoundOnly: true
		}
	});
});