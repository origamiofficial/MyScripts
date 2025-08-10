// ==UserScript==
// @name         UniSA Portal Enhancements
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Open specific links in new tabs and redirect root page
// @author       You
// @match        https://lo.unisa.edu.au/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Redirect from root page to student portal in current tab
    if (window.location.pathname === '/my/') {
        window.location.href = 'https://my.unisa.edu.au/student/portal/';
    }

    // Add event listener for clicks on specific links
    document.addEventListener('click', function(event) {
        const anchor = event.target.closest('a');
        if (anchor && anchor.href) {
            try {
                const url = new URL(anchor.href);
                // Check if the link matches the specified patterns
                if ((url.pathname === '/mod/resource/view.php' || url.pathname === '/mod/url/view.php') &&
                    url.search.startsWith('?id=')) {
                    event.preventDefault(); // Stop the default link behavior
                    window.open(anchor.href, '_blank'); // Open in a new tab
                }
            } catch (e) {
                // Ignore invalid URLs silently
            }
        }
    });
})();