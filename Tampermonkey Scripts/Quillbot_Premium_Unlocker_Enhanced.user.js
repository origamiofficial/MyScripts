// ==UserScript==
// @name         Quillbot Premium Unlocker Enhanced
// @namespace    https://gist.github.com/origamiofficial/5f9aa3d947b393363a8575616b380fce
// @version      2.2
// @description  Unlocks all QuillBot Premium features across all tools with robust state management and avoids detection.
// @author       OrigamiOfficial
// @match        https://quillbot.com/*
// @icon         https://quillbot.com/favicon.png
// @require      https://greasyfork.org/scripts/455943-ajaxhooker/code/ajaxHooker.js?version=1124435
// @run-at       document-start
// @grant        none
// @license      MIT
// @updateURL    https://gist.githubusercontent.com/origamiofficial/5f9aa3d947b393363a8575616b380fce/raw/QuillbotPremiumUnlockerEnhanced.user.js
// @downloadURL  https://gist.githubusercontent.com/origamiofficial/5f9aa3d947b393363a8575616b380fce/raw/QuillbotPremiumUnlockerEnhanced.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Blocked cookie patterns for analytics/tracking
    const blockedCookiePatterns = [
        'AMP_', '_ga', '_gat', '_gid', '_uetsid', '_uetvid', '_fbp', 'kla_id', 'cf_chl_', 'Optanon', '_cf_bm', '_cfruid',
        'datadome', 'CONSENT', 'VISITOR_INFO1_LIVE', 'YSC', 'SRM_B', 'MR', 'bscookie', 'lidc', '_clck', '_clsk', '_scid'
    ];

    // Utility to set a cookie
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "; expires=" + date.toUTCString();
        document.cookie = name + "=" + (value || "") + expires + "; path=/; domain=.quillbot.com; SameSite=None; Secure";
    }

    // Utility to delete a cookie
    function deleteCookie(name) {
        document.cookie = name + '=; Max-Age=-99999999; path=/; domain=.quillbot.com';
    }

    // Clear blocked cookies
    function clearBlockedCookies() {
        document.cookie.split(';').forEach(cookie => {
            const name = cookie.split('=')[0].trim();
            if (blockedCookiePatterns.some(pattern => name.includes(pattern))) {
                deleteCookie(name);
            }
        });
    }

    // Set local storage with error handling
    function setLocalStorage(name, value) {
        try {
            localStorage.setItem(name, value);
        } catch (e) {
            console.error(`Error setting localStorage key "${name}":`, e);
        }
    }

    // Set session storage with error handling
    function setSessionStorage(name, value) {
        try {
            sessionStorage.setItem(name, value);
        } catch (e) {
            console.error(`Error setting sessionStorage key "${name}":`, e);
        }
    }

    // Initialize premium state
    setCookie("premium", "true", 365);
    setCookie("authenticated", "true", 365);
    setCookie("acceptedPremiumModesTnc", "true", 365);
    setLocalStorage("premium", "true");
    setLocalStorage("authenticated", "true");
    setLocalStorage("acceptedPremiumModesTnc", "true");
    setSessionStorage("premium", "true");

    // Clear analytics cookies on start
    clearBlockedCookies();

    // Flexible AJAX hooking
    ajaxHooker.hook(request => {
        // Block analytics/tracking requests
        if (request.url.includes('analytics') || request.url.includes('tracking') ||
            request.url.includes('metrics') || request.url.includes('clarity.ms')) {
            request.abort = true;
            return;
        }

        // Modify responses dynamically
        request.response = res => {
            try {
                const json = JSON.parse(res.responseText);
                const data = "data" in json ? json.data : json;

                // Generic premium status modifications
                if (data.profile) {
                    data.profile.premium = true;
                    data.profile.accepted_premium_modes_tnc = true;
                    data.profile.email_verified = true;
                }
                if (data.subscription) {
                    data.subscription = { amount: 999, billing_interval: 12 };
                }
                if (data.featureLimit) {
                    for (const key in data.featureLimit) {
                        data.featureLimit[key] = { reached: false, limitLeft: 100000, expiry: Date.now() + 365 * 24 * 60 * 60 * 1000 };
                    }
                }
                if (data.metrics) {
                    data.metrics = { character_count: 10000000, copied_text_count: 50000, created_output_count: 100000 };
                }
                if (data.flags) {
                    data.flags.sessExT = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
                }

                // Handle tool-specific premium indicators
                if (data.premium !== undefined) data.premium = true;
                if (data.limits) data.limits = { reached: false, limitLeft: 100000 };
                if (data.scan_limits) data.scan_limits = { reached: false, limitLeft: 100000 };
                if (data.report) data.report = { full_access: true, limit_reached: false };

                res.responseText = JSON.stringify("data" in json ? (json.data = data, json) : data);
            } catch (e) {
                console.error('Error modifying response:', e);
            }
        };
    });

    // Efficient DOM observer for state maintenance
    const observer = new MutationObserver(() => {
        if (document.cookie.indexOf('premium=true') === -1) setCookie("premium", "true", 365);
        if (document.cookie.indexOf('authenticated=true') === -1) setCookie("authenticated", "true", 365);
        if (document.cookie.indexOf('acceptedPremiumModesTnc=true') === -1) setCookie("acceptedPremiumModesTnc", "true", 365);
        document.querySelectorAll('script[src*="analytics"], script[src*="tracking"], script[src*="clarity"]').forEach(script => script.remove());
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Periodic state check with randomness
    function periodicCheck() {
        if (document.cookie.indexOf('premium=true') === -1 ||
            localStorage.getItem('premium') !== 'true' ||
            sessionStorage.getItem('premium') !== 'true') {
            setCookie("premium", "true", 365);
            setLocalStorage("premium", "true");
            setSessionStorage("premium", "true");
        }
        setTimeout(periodicCheck, 240000 + Math.random() * 120000); // 4-6 minutes
    }
    periodicCheck();

    // Periodic cleanup of analytics cookies
    setInterval(clearBlockedCookies, 60000);
})();