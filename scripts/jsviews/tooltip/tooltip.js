/**
 * Tooltip oriented tag.
 * Interface:
 *     [@prop data]            {object} Target data.
 *     [@prop position]        {string} Tooltip position.
 *     [@prop position]        {string} Tooltip vertical position.
 *     [@prop autoPosition]    {bool}   Calculate position.
 *     [@prop contextSelector] {bool}   Dom element is used to calculate the position
 *     [@prop disabled]        {bool}   Disable show tooltip
 */

define(['jquery', 'text!tooltip.html', 'jsviews', 'css!tooltip.css'], function ($, tmpl) {
	'use strict';

	$.views.tags({
		tooltip: {

			template:tmpl,

			init: function (tagCtx, linkCtx) {

				var options = tagCtx.props.options || tagCtx.props;

				this.data = tagCtx.args[0] ? tagCtx.args[0] : tagCtx.view.type === 'validate' ? tagCtx.view.parent.data : tagCtx.view.data;

				this.id = options.id || '';

				this.className = options.className || '';

				this.position = options.position || 'right';

				this.autoPosition = options.autoPosition || false;

				this.contextSelector = options.contextSelector || 'body';

				this.disabled = options.disabled || false;

				this.enableTooltip = false;

				this.calculation = false;

				this.configured = false;
			},
			onAfterLink: function () {
				var self = this,
					parent = self.contents(true, '.tooltip-tag-container'),
					el = this.el = parent.find('.tooltip-caption'),
					container = el.closest(self.contextSelector);

					if(!self.configured){
						if(!self.disabled){
							el
								.on('mouseenter',  function (event) {

									if(self.autoPosition){

										$.observable(self).setProperty({
											calculation : true,
											enableTooltip : true
										});

										var offset = container.offset();
										var scroll = $(window).scrollTop(),
											corners = {
												top : offset.top - 10,
												bottom: offset.top + container.outerHeight() - 10,
												left: offset.left - 10,
												right: offset.left + container.outerWidth() - 10
											};
										var tooltip = parent.find('.tooltip-tag-tooltip');
										var tooltipWidth = tooltip.outerWidth(),
											tooltipHeight = tooltip.outerHeight(),
											parentWidth = parent.outerWidth(),
											parentHeight = parent.outerHeight(),
											parentOffset = parent.offset();

										if(scroll > offset.top){
											corners.top = scroll;
										}

										if( corners.bottom > $(window).height() + scroll ){
											corners.bottom = $(window).height() + scroll;
										}


										if(parentOffset.left - tooltipWidth > corners.left && parentOffset.top + tooltipHeight < corners.bottom){
											$.observable(self).setProperty('position','left');

											$.observable(self).setProperty('calculation', false);

											return true;
										}

										if(parentOffset.left + parentWidth + tooltipWidth < corners.right && parentOffset.top + tooltipHeight < corners.bottom){
											$.observable(self).setProperty('position','right');

											$.observable(self).setProperty('calculation', false);

											return true;
										}

										var difference = (parentWidth - tooltipWidth)/2;

										if(parentOffset.top + parentHeight + tooltipHeight < corners.bottom ){

											if( difference < 0){

												if(parentOffset.left - Math.abs(difference) < corners.left){
													$.observable(self).setProperty('position','right_bottom');

													$.observable(self).setProperty('calculation', false);

													return true;

												}

												if(parentOffset.left + parentWidth + Math.abs(difference) > corners.right){
													$.observable(self).setProperty('position','left_bottom');

													$.observable(self).setProperty('calculation', false);

													return true;

												}
											}

											$.observable(self).setProperty('position','bottom');

											$.observable(self).setProperty('calculation', false);

											return true;
										}

										if(parentOffset.top - tooltipHeight > corners.top ){

											if( difference < 0){

												if(parentOffset.left - Math.abs(difference) < corners.left){
													$.observable(self).setProperty('position','right_top');

													$.observable(self).setProperty('calculation', false);

													return true;

												}

												if(parentOffset.left + parentWidth + Math.abs(difference) > corners.right){
													$.observable(self).setProperty('position','left_top');

													$.observable(self).setProperty('calculation', false);

													return true;

												}
											}

											$.observable(self).setProperty('position','top');

											$.observable(self).setProperty('calculation', false);

											return true;
										}


									}else{
										$.observable(self).setProperty('enableTooltip', true);
									}
								})
								.on('mouseleave', function (event) {
									self.checkElement(event,parent);
								});
						}
						self.configured = true;
					}

			},
			checkElement: function(event,parent){
				var element = event.toElement || event.relatedTarget,
					self = this;

				if (parent.find(element).length === 0) {
					$.observable(self).setProperty('enableTooltip', false);
				}else{
					$(element).one('mouseleave',function(e){
						self.checkElement(e,parent);
					});
				}
			},
			render: function () {
				var tagCtx = this.tagCtx;
				return 0 === tagCtx.index ? tagCtx.render() : '';
			}
		}
	});
});
