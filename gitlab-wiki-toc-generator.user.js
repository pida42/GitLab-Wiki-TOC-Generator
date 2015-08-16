// ==UserScript==
// @name        GitLab-Wiki-TOC-Generator
// @namespace   http://pida.space/GitLab-Wiki-TOC-Generator/
// @include     http://*
// @include     https://*
// @match       http://*
// @match       https://*
// @require     https://code.jquery.com/jquery-2.1.4.min.js
// @version     1.0.0
// @grant       GM_addStyle
// ==/UserScript==

(function (jQuery) {

    // Run script after the page is fully
    jQuery(document).on('ready page:load', function () {

        // Stop - This is not GitLab frontend 
        if (typeof GitLab != 'object') {
            return false;
        }

        console.debug('Running custom script: GitLab-Wiki-TOC-Generator');

        var _css = "\
        .toc-clear {clear:both;}\
        #toc-box {z-index:999999; float:right; margin:10px 0 0 0; background-color:#fff; border:1px solid #ccc; border-radius:2px;}\
        .toc-box-head {background-color:#F5F5F5; border-bottom:1px solid #E1E1E1;}\
        .toc-title {float:left; display:block; padding:3px 5px; color:#999;}\
        .toc-delimiter {color:#ddd; float:right; margin:0px 0px 0px 5px; font-size:17px;}\
        .toc-show-hide {margin-right:3px; float:right; display:block; text-decoration:none; text-align:center;color: #999;padding: 3px 5px;}\
        #toc {margin:0 20px 0 10px; padding:10px 0 10px 0;}\
        .toc-list-ul {margin:0 0 0 10px !important; padding:0 !important;}\
        .toc-list-li {margin:0 0 5px 0 !important; padding:0 !important; list-style-position:inside; max-width:400px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}\
        .toc-link {text-decoration:none;}\
        ";

        // Set StyleSheet ;)
        GM_addStyle(_css);

        /** @var {Object} _ One object for all shits ;) */
        var _ = {

            /** @var {Object} config */
            config: {
                containerClass: '.wiki-holder',
                wikiContentClass: '.content',
                searchHeadsNestingLevels: {h1: 1, h2: 2, h3: 3, h4: 4, h5: 5},
                showHideAnimSpeed: 250
            },

            /** @var {Object} elements */
            elements: {
                clear: '<div class="toc-clear" />',
                box: '<div id="toc-box" />',
                boxHead: '<div class="toc-box-head" />',
                tocTitle: '<span class="toc-title">Table of content</span>',
                tocDelimiter: '<span class="toc-delimiter">|</span>',
                showHide: '<a href="javascript:void(0);" class="toc-show-hide">-</a>',
                toc: '<div id="toc" />',
                ul: '<ul class="toc-list-ul" />',
                li: '<li class="toc-list-li" style="list-style-type:octal;" />',
                link: '<a href="javascript:void(0);" class="toc-link" />'
            }
        };

        // HTML elements and some variables
        var $container = jQuery(_.config.containerClass);

        // TOC box element
        var $box = jQuery(_.elements.box);
        var $boxRight = (jQuery(_.config.wikiContentClass).get(0).offsetLeft - 1) + 'px';
        var $boxHead = jQuery(_.elements.boxHead);

        // Box title (header) + show/hide
        var $tocTitle = jQuery(_.elements.tocTitle);
        var $tocTitleSeparator = jQuery(_.elements.tocDelimiter);
        var $showHide = jQuery(_.elements.showHide);

        // Element for ul>li list with table of content
        var $toc = jQuery(_.elements.toc);

        // Create TOC header
        $boxHead.append($tocTitle);
        $boxHead.append($showHide);
        $boxHead.append($tocTitleSeparator);
        $boxHead.append(jQuery(_.elements.clear));

        // Generate TOC box content
        $box.append($boxHead);
        $box.append($toc);
        $box.prependTo($container);

        // Set first H1 css hack
        $container.find('h1:first-child').css({
            width: (jQuery(_.config.wikiContentClass).get(0).offsetWidth - ($box.get(0).offsetWidth + 10)) + 'px'
        });

        // actual node level
        var $elem = $toc;

        // tmp counter
        var prev = 0;

        // Find all header elements
        jQuery(Object.keys(_.config.searchHeadsNestingLevels).join(','), $container).each(function () {

            // set "this" to a new variable baceause we will need it in next click event function
            var $htag = jQuery(this);

            // get the nesting level
            var level = _.config.searchHeadsNestingLevels[this.tagName.toLowerCase()];

            // magic with list items ;)
            for (; prev < level; prev++) {
                $elem = jQuery(_.elements.ul).appendTo($elem);
            }
            for (; prev > level; prev--) {
                $elem = $elem.parent();
            }

            // TOC link to hash header
            jQuery('<a href="#" style="text-decoration:none">').appendTo(_.elements.li).text($htag.text()).click(function () {

                // position of target header
                var pos = $htag.position().top + 30;

                // if the target is first H1
                if (($htag.get(0).tagName).toLowerCase() == 'h1') {
                    pos = $htag.position().top - 5
                }

                // some animation for boring in application
                jQuery('html,body').animate({scrollTop: pos}, 'fast');
                $htag.delay(200).animate({opacity: 0}, 150).animate({opacity: 1}, 150).animate({opacity: 0}, 150).animate({opacity: 1}, 150);

                return false;
            })
                // append TOC link to the list
                .parent().appendTo($elem);
        });

        // Handle click event for show/hide TOC box
        $showHide.click(function () {

            // determine if is TOC box visible or not
            switch ($toc.is(':visible')) {

                // hidden
                case false:
                    $toc.show(_.config.showHideAnimSpeed, function () {
                        jQuery(_.elements.clear).hide(0);
                        $tocTitleSeparator.show(0);
                        $tocTitle.show(0);
                        $showHide.text('-');
                    });
                    break;

                // visible
                default:
                    $toc.hide(_.config.showHideAnimSpeed, function () {
                        $tocTitleSeparator.hide(0);
                        $tocTitle.hide(0);
                        jQuery(_.elements.clear).hide(0);
                        $showHide.text('+');
                    });
                    break;
            }

            return false;
        });

        // default visibility
        if (!$toc.is(':visible')) {
            $toc.hide(0);
            $tocTitle.hide(0);
            $showHide.text('-');
        }

        /**
         * Switching box position while scrolling
         * @return void
         */
        var fixDiv = function () {

            // determine if is page scrolled to top or somewhere below
            switch ((jQuery(window).scrollTop() > 100)) {

                // scrolling down or to the page top
                case true:
                    $box.css({
                        position: 'fixed',
                        top: '10px',
                        margin: '0',
                        right: $boxRight
                    });
                    break;

                // scrolled to the top of page
                default:
                    $box.css({
                        position: 'relative',
                        top: 'auto',
                        right: 'initial'
                    });
                    break;
            }
        };

        // handle scroll event
        jQuery(window).scroll(fixDiv);
        fixDiv();
    });
})(jQuery);