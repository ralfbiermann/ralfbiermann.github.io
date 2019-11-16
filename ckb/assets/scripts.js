// polyfills
if (!String.prototype.trim) {
    (function() {
        // Make sure we trim BOM and NBSP
        var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
        String.prototype.trim = function() {
            return this.replace(rtrim, '');
        };
    })();
}

var BK = {
	
	MinZoomValue: 70,
	MaxZoomValue: 130,
	ZoomStepSize: 5,
	
	Init: function() {
		BK.InitNavTop();
		BK.InitArticle();
		BK.InitTools();
		BK.InitBody();
		BK.InitTopLink();
		BK.InitZoom();
		BK.InitColorScheme();
		$(window).resize(BK.DetectMode);
		BK.DetectMode();
		BK.InitViewSettings();
		BK.InitMisc();
		$(window).resize();
	},

	StartOverlayMode: function() {
		if($('body').hasClass('overlay-open')) return;
		$('body').data('overlay-y', window.scrollY).addClass('overlay-open');
	},

	EndOverlayMode: function() {
		if(!$('body').hasClass('overlay-open')) return;
		$('body').removeClass('overlay-open');
		window.scrollTo(0, $('body').data('overlay-y'));
	},

	ToggleOverlayMode: function(open) {
		if(open) {
			BK.StartOverlayMode();
		} else {
			BK.EndOverlayMode();
		}
	},

	InitBody: function() {

		$(window).resize(function() {

			// close nav-top if resizing from small to large screen
			if(!$('html').hasClass('less-md') && $('body').hasClass('menu-overlay')) {
				$('#nav-top-toggle').click();
			}

			// close nav-left if resizing from small to large screen
			if(!$('html').hasClass('less-sm') && $('body').hasClass('nav-left-overlay')) {
				$('.tools-navi>span').first().click();
			}

		});

	},

	InitNavTop: function() {

		var $items = $('.nav-top-item');
		var $nav = $('#nav-top');

		// bind event to navigation anchors
		var enableMenuEvent = true;
		$items.children('a').on('mouseenter mousedown mouseup touchstart touchend click', function(e) {

			var $this = $(this).parent();
			var wasOpen = $this.hasClass('open');
			
			if($('html').hasClass('less-md')) {
				
				// small mode
				
				if(e.type!=='click') return;
				
				$items.removeClass('open');
				if(!wasOpen) $this.addClass('open');
				
				e.preventDefault();
				return false;
				
			} else {
				
				// large mode
				
				// ignore mouseenter and touchstart if menu is already open (needed for touch devices)
				if(e.type!=='click' && wasOpen) return;
				
				// prevent double events on touch devices (occurred on Surface with Firefox)
				if(!enableMenuEvent) {
					e.preventDefault();
					return false;
				}
				enableMenuEvent = false;
				window.setTimeout(function() { enableMenuEvent = true; }, 100);

				var preventDefault = true;
				
				if(wasOpen) preventDefault = false;
				$nav.addClass('open');
				$items.removeClass('open');
				$this.addClass('open');
				
				if(preventDefault) {
					e.preventDefault();
					return false;
				}

			}

		});
		
		$nav.mouseleave(function() {
			// large mode: close menu on mouseleave
			if($('html').hasClass('less-md')) return;
			$nav.removeClass('open');
			$items.removeClass('open');
			BK.EndOverlayMode();
			$('body').removeClass('menu-overlay');
		});
		
		// large mode: close nav top when clicking somewhere else (this is for touch devices)
		$('header,article,footer').click(function() {
			if($('body').hasClass('overlay-open')) return;
			$nav.removeClass('open');
			$items.removeClass('open');
			BK.EndOverlayMode();
			$('body').removeClass('menu-overlay');
		});

		// small mode: bind event to toggle button
		$('#nav-top-toggle').click(function(e) {

			var open = !$nav.hasClass('open');

			if(open) window.scrollTo(0, 0);
			$nav.toggleClass('open', open);
			BK.ToggleOverlayMode(open);
			$('body').toggleClass('menu-overlay', open);
			$(this).toggleClass('open', open);

			e.preventDefault();
			return false;

		});

		// close menu on escape
		$(document).bind('keydown', function(e) {
			if(e.keyCode!==27) return;
			if(!$('html').hasClass('less-md')) return;
			if($('#nav-top-toggle').hasClass('open')) $('#nav-top-toggle').click();
		});

	},
	
	CloseNavTop: function() {
		
	},
	
	InitArticle: function() {
		
		// Stretch article height so that a) the left nav is fully visible and
		// b) the line between article-col-left and article-col-right goes
		// down to the footer.
		
		var $article = $('article');
		if($article.length===0) return;
		
		var $nav = $('#nav-left');
		if($nav.length===0) return;
		
		$(window).resize(function() {
			
			var min = 0;
			if(!$('html').hasClass('xs')) {
				if($nav.length>0) min = $nav.height();
			}
			
			if(min===0) {
				$article.css('min-height', '');
			} else {
				$article.css('min-height', min+'px');
			}
			
		});

	},

	InitTools: function() {

		if($('#tools').length===0) return;
		
		$('#tools').addClass('visible');

		$('.tools-navi>span').click(function() {

			var open = !$('#nav-left').hasClass('open');

			$('#nav-left').toggleClass('open', open);
			if(open) $('#nav-left').scrollTop(0);
			
			// manually trigger scroll event (for attached mode) because Chrome on Android
			// doesn't do it after calling scrollTop
			$(window).scroll();
			
			BK.ToggleOverlayMode(open);
			$('body').toggleClass('nav-left-overlay', open);
			$('.tools-navi').toggleClass('active', open);

		});
		
		$(window).on('scroll resize', function() {
			var fixed = !$('body').hasClass('overlay-open') && 0 > ( $(document).height() - $('footer').outerHeight(true) - $(window).height() - $(window).scrollTop() + $('#tools').height() );
			$('#tools').toggleClass('attached', fixed);
		});
		
		if($('.tools-navi').length>0) {
			$('h1.chapter-title,.h1.chapter-title').addClass('enable-tools-trigger').click(function() {
				if(!$('html').hasClass('xs')) return;
				$('.tools-navi>span').click();
			});
		}
		
		$('.tools-print>button').click(function() {
			$(this).blur();
			window.print();
		});
		
		$('.tools-share>button').click(function() {
			$(this).blur();
		});
		
		$('.btn-copy-to-clipboard').click(function() {
			var $btn = $(this);
			$btn.removeClass('copy-success');
			var content = $btn.data('content');
			content = content.replace(/\\n/, "\n");
			var success = Utils.CopyToClipboard(content);
			if(success) {
				$btn.addClass('copy-success');
			}
			$btn.blur();
		});
		
	},
	
	InitTopLink: function() {
		$(window).on('scroll resize', function() {
			BK.UpdateTopLink();
		});
	},
	
	UpdateTopLink: function() {
		var scrollTop = $(window).scrollTop();
		if(scrollTop>200) {
			$('#to-top').addClass('visible');
			var onFooter = 0 > ( $(document).height() - $('footer').outerHeight(true) - $(window).height() - scrollTop + $('#to-top').height() + 43);
			$('#to-top').toggleClass('on-footer', onFooter);
		} else {
			$('#to-top').removeClass('visible on-footer');
		}
	},
	
	DetectMode: function() {
		$('html').removeClass('lg md sm xs xxs less-sm less-md less-lg');
		if ($('.detection.visible-xs-block:visible').length) {
			$('html').addClass('xs less-sm less-md less-lg');
			if($(window).width()<480) {
				$('html').addClass('xxs');
			}
		} else if ($('.detection.visible-sm-block:visible').length) {
			$('html').addClass('sm less-md less-lg');
		} else if ($('.detection.visible-md-block:visible').length) {
			$('html').addClass('md less-lg');
		} else {
			$('html').addClass('lg');
		}
	},
	
	InitZoom: function() {
		
		var zoom = parseInt(BK.GetSetting('ZoomValue'));
		if(!isNaN(zoom)) BK.Zoom(zoom);
		
		$('.btn-set-zoom').click(function() {
			var $btn = $(this);
			BK.Zoom(parseInt($btn.data('zoom')));
			$btn.blur();
		});
		
	},
	
	Zoom: function(size) {
		
		// detect current zoom factor
		var curZoom = 0;
		var classes = $('body').attr('class').split(" ");
		for(var i = 0; i<classes.length; i++) {
			var cls = classes[i];
			if(cls.substr(0, 5)!=='zoom-') continue;
			curZoom = parseInt(cls.substr(5));
			break;
		}
		if(isNaN(curZoom)) curZoom = 0;
		if(curZoom<=0) curZoom = 100;
		
		// determine final zoom factor
		if(size==='in') size = curZoom + BK.ZoomStepSize;
		if(size==='out') size = curZoom - BK.ZoomStepSize;
		if(size<BK.MinZoomValue) size = BK.MinZoomValue;
		if(size>BK.MaxZoomValue) size = BK.MaxZoomValue;
		if(size%BK.ZoomStepSize!==0) size = 100;
		
		if(curZoom!==size) {
		
			// update zoom factor via css class
			$('body').removeClassRegex(/^zoom\-/);
			if(size!==100) $('body').addClass('zoom-'+size);
		
			// remember the value
			BK.SetSetting('ZoomValue', size);
			
		}
		
		$('.tools-zoom-in').toggleClass('disabled', size===BK.MaxZoomValue);
		$('.tools-zoom-out').toggleClass('disabled', size===BK.MinZoomValue);
		$('.btn-set-zoom').removeClass('active');
		$('.btn-set-zoom[data-zoom="' + size + '"]').addClass('active');
		
	},
	
	GetSetting: function(key) {
		Cookies.get(key);
	},
	
	SetSetting: function(key, value) {
		Cookies.set(key, value, { expires: 365*10 });
	},
	
	InitViewSettings: function() {
		$('input[type="checkbox"][data-view-setting]').each(function() {
			var $chk = $(this);
			var key = $chk.data('view-setting');
			$chk.change(function() {
				BK.ToggleViewSetting(key);
			});
		});
	},
	
	ToggleViewSetting: function(key) {
		var active = $('body').hasClass(key);
		if(active) {
			$('body').removeClass(key);
			BK.SetSetting(key, 0);
		} else {
			$('body').addClass(key);
			BK.SetSetting(key, 1);
		}
	},
	
	InitColorScheme: function() {
		
		BK.SetColorScheme(BK.GetColorScheme());
		if(window.matchMedia) {
			var scheme = window.matchMedia('(prefers-color-scheme: dark)');
			if(scheme.addListener) {
				scheme.addListener(function() { BK._CheckColorScheme(); });
			}
		}
		
		$('.btn-scheme-auto').click(function() { BK.SetColorScheme('auto'); });
		$('.btn-scheme-light').click(function() { BK.SetColorScheme('light'); });
		$('.btn-scheme-dark').click(function() { BK.SetColorScheme('dark'); });
		
	},
	
	SetColorScheme: function(scheme) {
		$('html').removeClass('scheme-auto scheme-light scheme-dark');
		if(scheme !== 'auto' && scheme !== 'light' && scheme !== 'dark') scheme = 'auto';
		$('html').addClass('scheme-' + scheme);
		BK._ToggleSettingClass('.btn-scheme-auto', scheme==='auto');
		BK._ToggleSettingClass('.btn-scheme-light', scheme==='light');
		BK._ToggleSettingClass('.btn-scheme-dark', scheme==='dark');
		BK.SetSetting('ColorScheme', scheme);
		BK._CheckColorScheme();
	},
	
	GetColorScheme: function() {
		var $base = $('html');
		if($base.hasClass('scheme-light')) {
			return 'light';
		} else if($base.hasClass('scheme-dark')) {
			return 'dark';
		} else {
			return 'auto';
		}
	},
	
	_CheckColorScheme: function() {
		var scheme = BK.GetColorScheme();
		var dark = scheme==='dark' || (scheme==='auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
		$('html').toggleClass('dark', dark);
	},
	
	_ToggleSettingClass: function(selector, value) {
		$(selector).each(function() {
			var $el = $(this);
			if($el.hasClass('btn-tools')) {
				$el.toggleClass('active', value);
			} else if($el.hasClass('btn')) {
				$el.toggleClass('btn-light', !value).toggleClass('btn-dark', value);
			} else if($el.hasClass('dropdown-item')) {
				$el.toggleClass('active', value);
			}
		});
	},
	
	InitMisc: function() {
		
		$('.toc-title').click(function() {
			$(this).closest('.toc').toggleClass('open');
		});
		
		$('.ajax-replace-button').click(function() {
			var $btn = $(this);
			var $after = false;
			if($btn.data('after')) $after = $($btn.data('after'));
			var $img = $('<p><img src="images/loader.gif" /></p>');
			$btn.replaceWith($img);
			$.ajax({
				url: $btn.data('url'),
				success: function(result) {
					if($after===false) {
						$img.replaceWith(result);
					} else {
						$after.after(result);
						$img.remove();
					}
				}
			});
		});
		
		$('select.advanced-select').each(function() {
			var $select = $(this);
			BK.InitAdvancedSelect($select);
		});
		
		$('[data-select-target]').click(function(e) {
			var $this = $(this);
			var $target = $($this.data('select-target'));
			Utils.SelectText($target, 'auto');
			e.preventDefault();
			e.stopPropagation();
		});
		
		$('select.autosubmit').change(function() {
			$(this).closest('form').submit();
		});
		
		$('.multi-select').each(function() {
			
			var $select = $(this);
			var $target = $($select.data('select-target'));
			var $values = $select.children('li');
			$select.prepend('<li>Ausgewählt</li>');
			var $display = $select.children().eq(0);
			var conc = $select.data('select-concatenator');
			if(!conc) conc = ', ';
			var max = parseInt($select.data('max-select'));
			if(isNaN(max) || max<0) max = 0;
			var autoSubmit = $select.hasClass('autosubmit');
			var valueBeforeOpen = $target.val();
			var countBeforeOpen = 0;
			
			var update = function() {
				
				var longs = [];
				var shorts = [];
				var keys = [];
				
				$values.filter('.active').each(function() {
					var $item = $(this).clone();
					$item.find('.multi-select-check').remove();
					var long = $item.html();
					longs.push(long);
					shorts.push($item.data('option-short') ? $item.data('option-short') : long);
					keys.push($item.data('option-value'));
				});
				
				if($select.hasClass('open')) {
					if(max>0) {
						$display.text('Bis zu ' + max + ' Einträge auswählen:');
					} else {
						$display.text('Ein oder mehrere Einträge auswählen:');
					}
				} else {
					if(longs.length===0) {
						$display.text('Kein Wert ausgewählt.');
					} else if(longs.length===1) {
						$display.html(longs[0]);
					} else {
						$display.html(shorts.join(conc));
					}
				}
				
				var value = keys.join(',');
				$target.val(value);
				
				if(autoSubmit && !$select.hasClass('open') && value!==valueBeforeOpen) {
					$select.closest('form').submit();
				}
				
			};
			update();
			
			$select.click(function(e) {
				
				if(!$select.hasClass('open')) {
					
					valueBeforeOpen = $target.val();
					countBeforeOpen = $values.filter('.active').length;
					$select.addClass('open');
					update();
					
				} else {
					
					var $source = $(e.target);
					var $li = $source.closest('li');
					
					if($li.index()===0) {
						$select.removeClass('open');
						update();
					} else if($source.hasClass('multi-select-check')) {
						var count = $values.filter('.active').length;
						if(!$li.hasClass('active')) {
							if(max>0 && count>=max) {
								alert('Es können maximal ' + max + ' Einträge ausgewählt werden.');
							} else {
								$li.addClass('active');
								if(autoSubmit && max>0 && countBeforeOpen<max && count+1===max) {
									$select.removeClass('open');
								}
								update();
							}
						} else {
							if(count>1) {
								$li.removeClass('active');
								update();
							}
						}
					} else if($li.length>0) {
						if(!$li.hasClass('active')) {
							$values.removeClass('active');
							$li.addClass('active');
						}
						$select.removeClass('open');
						update();
					}
					
				}
				
				e.stopPropagation();
				
			});
			
			$(document).click(function() {
				if(!$select.hasClass('open')) return;
				$select.removeClass('open');
				update();
			});
			
		});
		
		$('.fieldset-small-toggable').each(function() {
			var $set = $(this);
			$set.find('legend').click(function() {
				$set.toggleClass('closed');
			});
		});
		
	},
	
	InitAdvancedSelect: function($select) {
		var options = {
			width: 'resolve'
		};
		if($select.data('no-search')) options.minimumResultsForSearch = Infinity;
		if($select.data('has-icons')) {
			var tpl = function(value) {
				if(!value.id) return value.text;
				var $option = $(value.element);
				var icon = $option.data('icon');
				if(!icon) return value.text;
				return $('<span>' + $option.data('icon') + ' ' + value.text + '</span>');
			};
			options.templateResult = tpl;
			options.templateSelection = tpl;
		}
		$select.select2(options);
	}

};

var PublicRevision = {

	LastSelectedText: null,

	Init: function() {

		// fetch selection for public revisions
		$(window).on('click touchend', function() {
			var sel = PublicRevision.GetSelectedText();
			if(sel!=='') PublicRevision.LastSelectedText = sel;
		});

	},

	GetSelectedText: function() {
		var text = false;
		if (window.getSelection) {
			return window.getSelection().toString();
		} 
		if (!text && document.getSelection) {
			return document.getSelection().toString();
		}
		if (!text && document.selection) {
			return document.selection.createRange().text.toString();
		}
		if(!text) {
			return '';
		} else {
			return text;
		}
	},
	
	Open: function(params) {
		var a = PublicRevision.LastSelectedText;
		if(a===null) a = '';
		a = String(a);
		a = a.trim();
		if(a.length===0) {
			alert("Sie haben einen Fehler im Text gefunden? Wir würden uns freuen, wenn Sie sich ganz kurz Zeit nehmen könnten, um uns darauf hinzuweisen.\n\nSelektieren Sie einfach den Satz, in dem der Fehler vorkommt und klicken Sie dann nochmal auf 'Fehler melden'.");
		} else if(a.length<50) {
			alert("Der von Ihnen selektierte Text ist zu kurz ("+a.length+" Zeichen). Bitte selektieren Sie auch die umliegenden Worte mit.");
		} else if(a.length>1000) {
			alert("Der von Ihnen selektierte Text ist zu lang ("+a.length+" Zeichen). Bitte wählen Sie eine kleinere Selektion.");
		} else {
			window.window_prev = window.open("fehler-melden?"+params+"&original="+encodeURIComponent(a),"window_prev", "width=550,height=570,left=0,right=0,resizable=yes,scrollbars=yes,status=no,location=no,menubar=no,toolbar=no");
			if (window.window_prev) {
				window.window_prev.focus();
			}
		}
	}

};

var Footnotes = {
	
	CurrentOpen: null,
	
	Init: function() {
		
		// Note: Bootstrap popovers don't close in iPads when using data-trigger="focus".
		// The reason is that iPads never trigger the click event on <html> and <body>.
		// Therefore we'll roll our own implementation that fetches clicks from
		// <body>, <header>, <article> and <footer>, thus having the same behaviour.
		// (Keep <body> because it still works on non-iPad devices.)
		
		$('.footnote').each(function() {
			var $fn = $(this);
			$fn.data('toggle', 'popover').data('trigger', 'manual').data('placement', 'bottom').data('html', true).attr('role', 'button').attr('tabindex', 0).data('content', $fn.data('footnote'));
			$fn.popover({container: 'body'});
			$fn.click(function(e) {
				if(Footnotes.CurrentOpen && Footnotes.CurrentOpen[0]!==this) Footnotes.Close();
				AjaxTooltips.Close();
				Popovers.Close();
				$(this).popover('toggle');
				e.stopPropagation();
			}).on('show.bs.popover', function(e) {
				Footnotes.CurrentOpen = $(this);
			});
			$fn.find('a').click(function(e) {
				e.preventDefault();
			});
		});
		
		$('body,header,article,footer').click(function(e) {
			if($(e.target).closest('.popover').length>0) return;
			Footnotes.Close();
		});
		
	},
	
	Close: function() {
		if(Footnotes.CurrentOpen) Footnotes.CurrentOpen.popover('hide');
	}
	
};

var Feedbacks = {
	
	SlideDuration: 300,
	
	Open: function(type) {
		
		var $subject = $('#inline_feedback_subject');
		var $type = $('#inline_feedback_type');
		
		switch(type) {
			case 'question':
				$subject.val('Frage zu diesem Artikel');
				$type.val('question');
				break;
			default:
				$subject.val('Meine Meinung zu dem Artikel');
				$type.val('feedback');
				break;
		}
		
		$('#inline_feedback_links').slideUp(Feedbacks.SlideDuration);
		$('#inline_feedback_form').slideDown(Feedbacks.SlideDuration);
		
	},
	
	Close: function() {
		$('#inline_feedback_links').slideDown(Feedbacks.SlideDuration);
		$('#inline_feedback_form').slideUp(Feedbacks.SlideDuration);
	}

};

var Popovers = {
	
	CurrentOpen: null,
	
	Init: function() {
		
		// Note: See notes on class Footnotes for further explanation.
		
		$('.btn-open-popover').each(function() {
			var $btn = $(this);
			var $target = $($btn.data('target'));
			var cls = $btn.data('popover-class');
			var baseCls = cls ? ' ' + cls : '';
			var titleCls = cls ? ' ' + cls + '-title' : '';
			var contentCls = cls ? ' ' + cls + '-content' : '';
			$btn.data('toggle', 'popover')
			   .data('trigger', 'manual')
			   .data('placement', 'bottom')
			   .data('html', true)
			   .attr('role', 'button')
			   .attr('tabindex', 0)
			   .data('content', $target.html());
			$btn.popover({
				container: 'body',
				template: '<div class="popover'+baseCls+'" role="tooltip"><div class="arrow"></div><div class="popover-title'+titleCls+'"></div><div class="popover-content'+contentCls+'"></div></div>'
			});
			$btn.click(function(e) {
				if(Popovers.CurrentOpen && Popovers.CurrentOpen[0]!==this) Popovers.Close();
				AjaxTooltips.Close();
				Footnotes.Close();
				$(this).popover('toggle');
				e.stopPropagation();
				return false;
			}).on('show.bs.popover', function(e) {
				Popovers.CurrentOpen = $(this);
			});
		});
		
		$('body,header,article,footer').click(function(e) {
			Popovers.Close();
		});
		
	},
	
	Close: function() {
		if(Popovers.CurrentOpen) {
			var $btn = Popovers.CurrentOpen;
			$btn.popover('hide');
			$btn.removeClass('active');
			Popovers.CurrentOpen = null;
		}
	}
	
};

var AjaxTooltips = {
	
	CurrentOpen: null,
	LastAjax: null,
	History: [],
	
	Init: function() {
		
		// Note: See notes on class Footnotes for further explanation.
		
		$('.ajax-tooltip').each(function() {
			var $fn = $(this);
			$fn.data('toggle', 'popover')
			   .data('trigger', 'manual')
			   .data('placement', 'bottom')
			   .data('html', true)
			   .attr('role', 'button')
			   .attr('tabindex', 0)
			   .data('content', 'Wird geladen ...');
			$fn.popover({
				container: 'body',
				title: 'Wird geladen ...',
				template: '<div class="popover ajax-tooltip-container" role="tooltip"><div class="arrow"></div><div class="popover-title ajax-tooltip-title"></div><div class="popover-content ajax-tooltip-content"></div></div>'
			});
			$fn.click(function(e) {
				if(AjaxTooltips.CurrentOpen && AjaxTooltips.CurrentOpen[0]!==this) AjaxTooltips.Close();
				Footnotes.Close();
				Popovers.Close();
				$(this).popover('toggle');
				AjaxTooltips.History = [];
				AjaxTooltips._LoadContent($fn, $fn.data('tooltip-url'));
				$fn.addClass('active');
				e.stopPropagation();
				return false;
			}).on('show.bs.popover', function(e) {
				AjaxTooltips.CurrentOpen = $(this);
			});
			$fn.find('a').click(function(e) {
				e.preventDefault();
			});
		});
		
		$('body,header,article,footer').click(function(e) {
			if($(e.target).closest('.ajax-tooltip-container').length>0) return;
			AjaxTooltips.Close();
		});
		
	},
	
	Close: function() {
		if(AjaxTooltips.CurrentOpen) {
			var $fn = AjaxTooltips.CurrentOpen;
			$fn.popover('hide');
			$fn.removeClass('active');
			AjaxTooltips.CurrentOpen = null;
		}
	},
	
	Back: function(event) {
		if(AjaxTooltips.History.length===0) return;
		AjaxTooltips.History.pop();
		if(AjaxTooltips.History.length===0) return;
		var result = AjaxTooltips.History[AjaxTooltips.History.length -1];
		AjaxTooltips._UpdateContent(AjaxTooltips.CurrentOpen, result.Title, result.Content);
		event.stopPropagation();
		return false;
	},
	
	_LoadContent: function($fn, contentUrl) {
		if(AjaxTooltips.LastAjax) AjaxTooltips.LastAjax.abort();
		AjaxTooltips._UpdateContent($fn, 'Wird geladen ...', '<center><img src="images/loader.gif" /></center>');
		AjaxTooltips.LastAjax = $.ajax({
			url: contentUrl,
			dataType: 'json',
			success: function(result) {
				AjaxTooltips.History.push(result);
				AjaxTooltips._UpdateContent($fn, result.Title, result.Content);
			}
		});
	},
	
	_UpdateContent: function($fn, title, content) {
		$fn.data('bs.popover').options.title = title;
		$fn.data('bs.popover').options.content = content;
		$fn.popover('show');
		var $c = $('.ajax-tooltip-container');
		$c.find('[data-tooltip-url]').off('click').click(function() {
			AjaxTooltips._LoadContent($fn, $(this).data('tooltip-url'));
			return false;
		});
		if(AjaxTooltips.History.length>1) {
			var $t = $('.ajax-tooltip-title');
			$t.prepend('<span class="ajax-tooltip-button" onclick="return AjaxTooltips.Back(event);"><span class="fa fa-arrow-left"></span></span>');
		}
	}
	
};

var Utils = {
	
	CtrlPressed: false,
	ShiftPressed: false,
	AltPressed: false,
	
	InitMain: function() {
		Utils._InitKeyEvents();
	},
	
	_InitKeyEvents: function() {
		$(window).keydown(function(e) {
			switch(e.which) {
				case 17:
					Utils.CtrlPressed = true;
					break;
				case 16:
					Utils.ShiftPressed = true;
					break;
				case 18:
					Utils.AltPressed = true;
					break;
			}
		}).keyup(function(e) {
			switch(e.which) {
				case 17:
					Utils.CtrlPressed = false;
					break;
				case 16:
					Utils.ShiftPressed = false;
					break;
				case 18:
					Utils.AltPressed = false;
					break;
			}
		});
	},
	
	SelectText: function(el, addToRange) {
		
		var $el = $(el);
		if($el.length===0) return;
		
		var node = $el[0];
		var add = false;
		if(typeof addToRange !== 'undefined') {
			if(addToRange==='auto') {
				add = Utils.CtrlPressed || Utils.ShiftPressed;
			} else {
				add = addToRange == true;
			}
		}
		
		if (document.body.createTextRange) {
			var range = document.body.createTextRange();
			range.moveToElementText(node);
			range.select();
		} else if (window.getSelection) {
			var selection = window.getSelection();
			var range = document.createRange();
			range.selectNodeContents(node);
			if(!add) selection.removeAllRanges();
			selection.addRange(range);
		}
		
	},
	
	CopyToClipboard: function(text) {
		
		var el = document.createElement('textarea');
		el.value = text;
		el.setAttribute('readonly', '');
		el.style = {position: 'absolute', left: '-9999px'};
		document.body.appendChild(el);

		if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
			// save current contentEditable/readOnly status
			var editable = el.contentEditable;
			var readOnly = el.readOnly;

			// convert to editable with readonly to stop iOS keyboard opening
			el.contentEditable = true;
			el.readOnly = true;

			// create a selectable range
			var range = document.createRange();
			range.selectNodeContents(el);

			// select the range
			var selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(range);
			el.setSelectionRange(0, 999999);

			// restore contentEditable/readOnly to original state
			el.contentEditable = editable;
			el.readOnly = readOnly;
		} else {
			el.select(); 
		}
		
		var success = false;
		try {
			success = document.execCommand('copy');
		} catch (err) {
		}
		
		if(success) {
			//alert('Der Text wurde in die Zwischenablage kopiert!');
		} else {
			alert('Der Text konnte nicht in die Zwischenablage kopiert werden :-(');
		}

		document.body.removeChild(el);
		
		return success;
		
	}
	
};

(function($) {
	
	$.fn.fixedThead = function() {
		
		this.each(function() {
			
			var $table = $(this);
			if($table.find('thead').length===0) return;
			
			if($table.height()<200) {
				// small tables don't need the fixed thead
				// we'll need to set the overflow on the wrapper, though
				$table.closest('.fixed-thead-wrapper').css('overflow-x', 'auto');
				return;
			}
			
			var Util = {
				
				Table: null,
				Head: null,
				Wrapper: null,
				ClonedTable: null,
				ClonedHead: null,
				ClonedWrapper: null,
				HiddenXs: false,
				HeadHeight: 0,
				
				Init: function($table) {
					
					this.Table = $table;
					this.Head = $table.find('thead');
					
					this.Wrapper = $table.closest('.fixed-thead-wrapper');
					
					this.ClonedTable = $($table[0].cloneNode());
					this.ClonedTable.css('position', 'relative');
					if(this.Wrapper.length===0) {
						this.ClonedWrapper = $('<div class="fixed-thead-wrapper-clone"></div>');
						this.Table.before(this.ClonedWrapper);
					} else {
						this.ClonedWrapper = $(this.Wrapper[0].cloneNode());
						this.ClonedWrapper.removeClass('fixed-thead-wrapper').addClass('fixed-thead-wrapper-clone');
						this.Wrapper.before(this.ClonedWrapper);
					}
					this.ClonedWrapper.append(this.ClonedTable);
					this.ClonedWrapper.css('overflow-x', 'hidden');
					this.ClonedWrapper.css('position', 'fixed').css('top', '0').css('display', 'none').css('z-index', 1200);
					
					this.Wrapper.css('overflow-x', 'auto');
					
					this.ClonedHead = this.Head.eq(0).clone();
					this.ClonedHead.addClass('clone');
					this.ClonedTable.append(this.ClonedHead);
					
					this.HiddenXs = $table.hasClass('fixed-thead-hidden-xs');
					
					var t = this;
					
					$(window).resize(function() {
						t.UpdateWidth();
						t.UpdateLeft();
					});
					$(window).resize();
					
					$(window).scroll(function() {
						t.UpdateVisibility();
						t.UpdateLeft();
					});
					$(window).scroll();
					
					this.Wrapper.scroll(function() {
						t.UpdateLeft();
					});
					
				},
				
				UpdateWidth: function() {
					if(this.Wrapper.length===0) {
						this.ClonedWrapper.width(this.Table.width());
					} else {
						this.ClonedWrapper.width(this.Wrapper.width());
					}
					this.ClonedTable.width(this.Table.width());
					var $original = this.Head.find('th');
					var $cloned = this.ClonedHead.find('th');
					for(var i=0; i<$original.length; i++) {
						var $th = $original.eq(i);
						$cloned.eq(i).width($th.width());
					}
					this.HeadHeight = this.Head.height();
				},
				
				UpdateVisibility: function() {
					if(this.HiddenXs && $('html').hasClass('xs')) {
						this.HideClone();
						return;
					}
					var scrollTop = $(window).scrollTop();
					var $offset = this.Table.offset();
					var tableTop = $offset.top;
					var tableBottom = tableTop + this.Table.height();
					if (scrollTop > tableTop && scrollTop < tableBottom - this.HeadHeight) {
						this.ShowClone();
					} else {
						this.HideClone();
					}
				},
				
				UpdateLeft: function() {
					var scrollLeft = $(window).scrollLeft();
					var tableLeft = this.Table.offset().left;
					var wrapperLeft = this.Wrapper.scrollLeft();
					this.ClonedWrapper.css('left', tableLeft - scrollLeft + wrapperLeft);
					this.ClonedTable.css('left', -wrapperLeft);
				},
				
				ShowClone: function() {
					if(this.ClonedWrapper.is(':visible')) return;
					this.Head.css('opacity', '0');
					this.UpdateWidth();
					this.ClonedWrapper.show();
				},
				
				HideClone: function() {
					if(!this.ClonedWrapper.is(':visible')) return;
					this.Head.css('opacity', 'initial');
					this.ClonedWrapper.hide();
				}
				
			};
			
			Util.Init($table);
			
		});
		
		return this;
		
    };
	
})(jQuery);

function zoomPic(pic, w, h) {
	w = parseInt(w) + 20;
	h = parseInt(h) + 20;
	window.window_zoompic = window.open(pic, "window_zoompic", "width="+w+",height="+h+"left=0,right=0,resizable=yes,scrollbars=yes,status=no,location=no,menubar=no,toolbar=no");
	if(window.window_zoompic) window.window_zoompic.focus();
}

$().ready(function() {

	BK.Init();
	PublicRevision.Init();
	Footnotes.Init();
	AjaxTooltips.Init();
	Popovers.Init();
	Utils.InitMain();

    // ensure anchors are working with our base url
	var pathname = window.location.href.split('#')[0];
    $('a[href^="#"]').each(function() {
        var $this = $(this),
            link = $this.attr('href');
		if(link==='#') return;
        $this.attr('href', pathname + link);
    });
	
	$('[data-click-url]').each(function() {
		var $t = $(this);
		$t.click(function() {
			var url = $t.data('click-url');
			if($t.data('new-window')) {
				window.open(url);
			} else {
				window.location.href = url;
			}
		});
		$t.find('input,label,a').click(function(e) {
			e.stopPropagation();
		});
	});
	
	// focus and select the bible search term
	if($('#searchstring').length && document.location.hash==='') {
		$('#searchstring').focus().select();
	}
	
	$.fn.removeClassRegex = function(regex) {
		return $(this).removeClass(function(index, classes) {
			return classes.split(/\s+/).filter(function(c) {
				return regex.test(c);
			}).join(' ');
		});
	};
	
	$('[data-tooltip]').each(function() {
		var $t = $(this);
		$t.data('toggle', 'tooltip').data('placement', 'bottom').data('title', $t.data('tooltip'));
		$t.tooltip({
			container: 'body'
		});
	});
	
	$('table.fixed-thead').fixedThead();
	
	$('table.fixed-thead-x').each(function() {
		
		var $table = $(this);
		var $head = $table.find('thead');
		if($head.length===0) return;
		
		var hiddenXs = $table.hasClass('fixed-thead-hidden-xs');
		
		var $clone = $head.eq(0).clone();
		$clone.addClass('clone');
		$clone.css('position', 'fixed').css('top', '0').css('display', 'none');
		$head.after($clone);
		
		var $wrapper = $table.closest('.fixed-thead-wrapper');
		$wrapper.css('overflow-x', 'auto');
		
		$(window).resize(function() {
			
			var scrollLeft = $(window).scrollLeft();
			var tableLeft = $table.offset().left;
			
			$clone.width($head.width()).css('left', tableLeft - scrollLeft);
			
			var $original = $head.find('th');
			var $cloned = $clone.find('th');
			for(var i=0; i<$original.length; i++) {
				var $th = $original.eq(i);
				$cloned.eq(i).width($th.width());
			}
			
		});
		$(window).resize();
		
		$(window).scroll(function() {
			if(hiddenXs && $('html').hasClass('xs')) {
				$clone.hide();
				return;
			}
			var scrollTop = $(window).scrollTop();
			var scrollLeft = $(window).scrollLeft();
			var $offset = $table.offset();
			var tableTop = $offset.top;
			var tableBottom = tableTop + $table.height();
			var tableLeft = $offset.left;
			if (scrollTop > tableTop && scrollTop < tableBottom) {
				$head.css('opacity', '0');
				$clone.show().css('left', tableLeft - scrollLeft);
			} else {
				$head.css('opacity', 'initial');
				$clone.hide();
			}
		});
		$(window).scroll();
		
	});
	
});

$(window).on('hashchange load', function() {
	var $anchor = $(':target');
	var fixedElementHeight = 40;
	if ($anchor.length > 0) {
		$('html, body')
			.stop()
			.animate(
				{scrollTop: $anchor.offset().top - fixedElementHeight},
				200
			);
	}
});

