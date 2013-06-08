window.djdt = (function(window, document, jQuery) {
	jQuery.cookie = function(name, value, options) { if (typeof value != 'undefined') { options = options || {}; if (value === null) { value = ''; options.expires = -1; } var expires = ''; if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) { var date; if (typeof options.expires == 'number') { date = new Date(); date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000)); } else { date = options.expires; } expires = '; expires=' + date.toUTCString(); } var path = options.path ? '; path=' + (options.path) : ''; var domain = options.domain ? '; domain=' + (options.domain) : ''; var secure = options.secure ? '; secure' : ''; document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join(''); } else { var cookieValue = null; if (document.cookie && document.cookie != '') { var cookies = document.cookie.split(';'); for (var i = 0; i < cookies.length; i++) { var cookie = $.trim(cookies[i]); if (cookie.substring(0, name.length + 1) == (name + '=')) { cookieValue = decodeURIComponent(cookie.substring(name.length + 1)); break; } } } return cookieValue; } };
	var $ = jQuery;
	var COOKIE_NAME = 'djdt';
	var djdt = {
		jQuery: jQuery,
		events: {
			ready: []
		},
		isReady: false,
        response_keys: ['HTML'],
        selected_response_index: 0,
        add_response_key: function(name) {
             djdt.response_keys[djdt.response_keys.length] = name;
        },
        get_selected_response_key: function() {
            return djdt.response_keys[djdt.selected_response_index];
        },
		init: function() {
			$('#djDebug').show();
			var current = null;
			$('#djDebug ul.djDebugPanelList li a').live('click', function() {
				if (!this.className) {
					return false;
				}
				current = $('#djDebug #' + this.className);
				if (current.is(':visible')) {
					$(document).trigger('close.djDebug');
					$(this).parent().removeClass('active');
				} else {
					$('.panelContent').hide(); // Hide any that are already open
					current.show();
					$('#djDebug .djDebugToolbar li').removeClass('active');
					$(this).parent().addClass('active');
				}
				return false;
			});
			$('#djDebug a.djDebugClose').live('click', function() {
				$(document).trigger('close.djDebug');
				$('#djDebug .djDebugToolbar li').removeClass('active');
				return false;
			});

			$('#djDebug .remoteCall').live('click', function() {
				var self = $(this);
				var name = self[0].tagName.toLowerCase();
				var ajax_data = {};

				if (name == 'button') {
					var form = self.parents('form:eq(0)');
					ajax_data['url'] = self.attr('formaction');

					if (form.length) {
						ajax_data['data'] = form.serialize();
						ajax_data['type'] = form.attr('method') || 'POST';
					}
				}

				if (name == 'a') {
					ajax_data['url'] = self.attr('href');
				}

				$.ajax(ajax_data).done(function(data){
					$('#djDebugWindow').html(data).show();
				}).fail(function(xhr){
						var message = '<div class="djDebugPanelTitle"><a class="djDebugClose djDebugBack" href="">Back</a><h3>'+xhr.status+': '+xhr.statusText+'</h3></div>';
						$('#djDebugWindow').html(message).show();
				});

				$('#djDebugWindow a.djDebugBack').live('click', function() {
					$(this).parent().parent().hide();
					return false;
				});

				return false;
			});

			$('#djDebugTemplatePanel a.djTemplateShowContext').live('click', function() {
				djdt.toggle_arrow($(this).children('.toggleArrow'));
				djdt.toggle_content($(this).parent().next());
				return false;
			});
			$('#djDebug a.djDebugToggle').live('click', function(e) {
				e.preventDefault();
				$(this).parent().find('.djDebugCollapsed').toggle();
				$(this).parent().find('.djDebugUncollapsed').toggle();
			});
			$('#djDebug a.djToggleSwitch').live('click', function(e) {
				e.preventDefault();
				var btn = $(this);
				var id = btn.attr('data-toggle-id');
				var open_me = btn.text() == btn.attr('data-toggle-open');
				if (id === '' || !id) {
					return;
				}
				var name = btn.attr('data-toggle-name');
				btn.parents('.djDebugPanelContent').find('#' + name + '_' + id).find('.djDebugCollapsed').toggle(open_me);
				btn.parents('.djDebugPanelContent').find('#' + name + '_' + id).find('.djDebugUncollapsed').toggle(!open_me);
				$(this).parents('.djDebugPanelContent').find('.djToggleDetails_' + id).each(function(){
					var $this = $(this);
					if (open_me) {
						$this.addClass('djSelected');
						$this.removeClass('djUnselected');
						btn.text(btn.attr('data-toggle-close'));
						$this.find('.djToggleSwitch').text(btn.text());
					} else {
						$this.removeClass('djSelected');
						$this.addClass('djUnselected');
						btn.text(btn.attr('data-toggle-open'));
						$this.find('.djToggleSwitch').text(btn.text());
					}
				});
				return;
			});
			function getSubcalls(row) {
				var id = row.attr('id');
				return $('.djDebugProfileRow[id^="'+id+'_"]');
			}
			function getDirectSubcalls(row) {
				var subcalls = getSubcalls(row);
				var depth = parseInt(row.attr('depth'), 10) + 1;
				return subcalls.filter('[depth='+depth+']');
			}
			$('.djDebugProfileRow .djDebugProfileToggle').live('click', function(){
				var row = $(this).closest('.djDebugProfileRow');
				var subcalls = getSubcalls(row);
				if (subcalls.css('display') == 'none') {
					getDirectSubcalls(row).show();
				} else {
					subcalls.hide();
				}
			});
			$('#djDebug a.djHideToolBarButton').live('click', function() {
				djdt.hide_toolbar(true);
				return false;
			});
			$('#djShowToolBarButton').click(function() {
				djdt.show_toolbar();
				return false;
			});
			$(document).bind('close.djDebug', function() {
				// If a sub-panel is open, close that
				if ($('#djDebugWindow').is(':visible')) {
					$('#djDebugWindow').hide();
					return;
				}
				// If a panel is open, close that
				if ($('.panelContent').is(':visible')) {
					$('.panelContent').hide();
					return;
				}
				// Otherwise, just minimize the toolbars
				// if ($('#djDebugToolbar').is(':visible')) {
					djdt.hide_toolbar(true);
					return;
				// }
			});
			if ($.cookie(COOKIE_NAME)) {
				djdt.hide_toolbar(false);
			} else {
				djdt.show_toolbar(false);
			}
			$('#djDebug .djDebugHoverable').hover(function(){
				$(this).addClass('djDebugHover');
			}, function(){
				$(this).removeClass('djDebugHover');
			});
			djdt.isReady = true;
			$.each(djdt.events.ready, function(_, callback){
				callback(djdt);
			});
		},
		toggle_content: function(elem) {
			if (elem.is(':visible')) {
				elem.hide();
			} else {
				elem.show();
			}
		},
		close: function() {
			$(document).trigger('close.djDebug');
			return false;
		},
		hide_toolbar: function(setCookie) {
			// close any sub panels
			$('#djDebugWindow').hide();
			// close all panels
			$('.panelContent').hide();
			$('#djDebug .djDebugToolbar li').removeClass('active');
			// finally close toolbar
			$('#djDebug .djDebugToolbar').hide('fast');
			$('#djDebugToolbarHandle').show();
			// Unbind keydown
			$(document).unbind('keydown.djDebug');
			if (setCookie) {
				$.cookie(COOKIE_NAME, 'hide', {
					path: '/',
					expires: 10
				});
			}
		},
		show_toolbar: function(animate) {
			// Set up keybindings
			$(document).bind('keydown.djDebug', function(e) {
				if (e.keyCode == 27) {
					djdt.close();
				}
                if (e.keyCode == 37) {
					djdt.prev_toolbar();
				}
                if (e.keyCode == 39) {
					djdt.next_toolbar();
				}
			});
			$('#djDebugToolbarHandle').hide();
            var toolbar_selector = '#djDebugToolbar' + djdt.get_selected_response_key()
			if (animate) {
				$(toolbar_selector).show('fast');
			} else {
				$(toolbar_selector).show();
			}
			$.cookie(COOKIE_NAME, null, {
				path: '/',
				expires: -1
			});
		},
        prev_toolbar: function() {
            var count = djdt.response_keys.length;
            if (count > 1) {
			    djdt.hide_toolbar();
                djdt.selected_response_index -= 1;
                if (djdt.selected_response_index < 0) {
                    djdt.selected_response_index = count - 1;
                }
                djdt.show_toolbar(false);
            }
        },
        next_toolbar: function() {
            var count = djdt.response_keys.length;
            if (count > 1) {
                djdt.hide_toolbar();
                djdt.selected_response_index += 1;
                if (djdt.selected_response_index > count - 1) {
                    djdt.selected_response_index = 0;
                }
                djdt.show_toolbar(false);
            }
        },
		toggle_arrow: function(elem) {
			var uarr = String.fromCharCode(0x25b6);
			var darr = String.fromCharCode(0x25bc);
			elem.html(elem.html() == uarr ? darr : uarr);
		},
		ready: function(callback){
			if (djdt.isReady) {
				callback(djdt);
			} else {
				djdt.events.ready.push(callback);
			}
		},
        add_ajax_response: function(name, toolbar) {
            djdt.add_response_key(name);
            $('#djDebug').append(toolbar);
        }
	};
	$(document).ready(function() {
		djdt.init();
	});
	return djdt;
}(window, document, jQuery.noConflict(true)));
