// ==UserScript==
// @name         Amazon AU Redirect
// @namespace    https://gist.github.com/origamiofficial/23203b030d4ecbd219e48d3d41d406d3
// @version      1.0
// @description  Redirects non-Australian Amazon domains to amazon.com.au, handles 404 errors, and prevents loops.
// @author       OrigamiOfficial
// @match        *://*.amazon.*/*
// @grant        GM.xmlHttpRequest
// @run-at       document-start
// @updateURL    https://gist.githubusercontent.com/origamiofficial/23203b030d4ecbd219e48d3d41d406d3/raw/AmazonRedirect.user.js
// @downloadURL  https://gist.githubusercontent.com/origamiofficial/23203b030d4ecbd219e48d3d41d406d3/raw/AmazonRedirect.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Exit if already on amazon.com.au to prevent loops
    if (window.location.hostname.endsWith('amazon.com.au')) {
        return;
    }

    // Extract product ID from URL (e.g., /dp/B08J5K1Q2R or /gp/product/B08J5K1Q2R)
    const url = window.location.href;
    const match = url.match(/\/(dp|gp\/product)\/([A-Z0-9]{10})/);
    if (!match) {
        return; // Not a product page, exit
    }

    const productId = match[2];
    const amazonAuUrl = `https://www.amazon.com.au/dp/${productId}`;

    // Check session storage to prevent re-redirect if user navigates back
    const redirectKey = `amazon_redirect_${productId}`;
    if (sessionStorage.getItem(redirectKey)) {
        return; // Redirect already attempted, exit
    }

    // Perform fast HEAD request to check availability on Amazon AU
    GM.xmlHttpRequest({
        method: 'HEAD',
        url: amazonAuUrl,
        timeout: 5000, // 5-second timeout for reliability
        onload: function(response) {
            if (response.status === 200) {
                // Product exists, set flag and redirect
                sessionStorage.setItem(redirectKey, 'true');
                window.location.href = amazonAuUrl;
            }
            // Status 404 or others: do nothing
        },
        onerror: function() {
            // Network error: do nothing
        },
        ontimeout: function() {
            // Timeout: do nothing
        }
    });
})();