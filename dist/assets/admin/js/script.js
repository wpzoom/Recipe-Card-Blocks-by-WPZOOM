jQuery(document).ready(function(){
	( function($, Settings) {
		$('.wp-tab-bar a').click(function(event){
			event.preventDefault();

			var href = $(this).attr('href');
			var query_args = getUrlVars( href );
			var context = $(this).closest('.wp-tab-bar').parent(); // Limit effect to the container element.
			
			$('.wp-tab-bar li', context).removeClass('wp-tab-active');
			$(this).closest('li').addClass('wp-tab-active');
			$('.wp-tab-panel', context).hide();
			$( '#'+query_args['tab'], context ).show();

			// Change url depending by active tab
			window.history.pushState('', '', href);
		});

		// Make setting wp-tab-active optional.
		$('.wp-tab-bar').each(function(){
			if ( $('.wp-tab-active', this).length )
				$('.wp-tab-active', this).click();
			else
				$('a', this).first().click();
		});

		// reset settings to defaults
		$('#wpzoom_rcb_reset_settings').click(function(){
			var data = {
			    security: Settings.ajax_nonce,
			    action: 'wpzoom_reset_settings',
			};

			if (window.confirm("Do you really want to Reset all settings to default?")) {
				$.post( Settings.ajaxUrl, data, function(response){
					if ( response.status == '200' ) {
						var query_args = getUrlVars( window.location.href );

						if ( query_args.length > 0 ) {
							window.location.href = window.location.href + "&wpzoom_reset_settings=1";
						} else {
							window.location.href = window.location.href + "?wpzoom_reset_settings=1";
						}
					} else {
						alert('Something went wrong when tried to reset the settings!')
					}
				});
			}
		});

		// close Welcome banner
		$('.wpzoom-rcb-welcome-close').click(function(e){
			e.preventDefault();

			var banner = $(this).attr('href');
			var data = {
			    security: Settings.ajax_nonce,
			    action: 'wpzoom_welcome_banner_close',
			};

			$(banner).fadeOut();

			$.post( Settings.ajaxUrl, data, function(response){
				if ( response.status != '200' ) {
					alert('Something went wrong!')
				}
			});
		});

		function getUrlVars( $url ) {
		    var vars = [], hash;
		    var hashes = $url.slice($url.indexOf('?') + 1).split('&');
		    for(var i = 0; i < hashes.length; i++)
		    {
		        hash = hashes[i].split('=');
		        vars.push(hash[0]);
		        vars[hash[0]] = hash[1];
		    }
		    return vars;
		}


        // setting field preview
        $('.wpzoom-rcb-field-preview').each(function(){
            var $this = $(this),
                $field = $(this).parents('fieldset');
            var thumbnail = $(this).data('preview-thumbnail'),
                position = $(this).data('preview-position');

            $(this).on('mouseover', function(){

                if ( $this.hasClass('active') ) {
                    $this.removeClass('active');
                    $field.find('.wpzoom-rcb-field-preview-thumbnail').remove();
                    return;
                }

                $this.addClass('active');
                $field.append('<span class="wpzoom-rcb-field-preview-thumbnail preview-position-'+ position +'"><img src="'+ thumbnail +'" width="400" height="300"></span>');

                $('.wpzoom-rcb-field-preview').not(this).parent().find('.wpzoom-rcb-field-preview-thumbnail').remove();
                $('.wpzoom-rcb-field-preview').not(this).removeClass('active');
                
            });

            $(this).on('mouseout', function(){

                if ( $this.hasClass('active') ) {
                    $this.removeClass('active');
                    $field.find('.wpzoom-rcb-field-preview-thumbnail').remove();
                    return;
                }

            });

        });

	})(jQuery, WPZOOM_Settings);
});