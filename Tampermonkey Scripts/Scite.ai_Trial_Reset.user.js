// ==UserScript==
// @name         Scite.ai Trial Reset and DOI Redirect
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  Reset trials on Scite.ai, populate assistant input, and redirect "View full text" links
// @author       OrigamiOfficial
// @match        https://scite.ai/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to delete the anonId cookie
    function deleteAnonIdCookie() {
        document.cookie = "anonId=; expires=Thu, 16 Dec 1971 00:00:00 UTC; path=/;";
    }

    // Function to modify the "Sign Up" button without causing re-renders
    function modifySignUpButton() {
        const buttons = document.querySelectorAll('.NavLogin__button___ds2E0, [data-testid="signup-button"]');
        for (const button of buttons) {
            if (button.textContent.includes('Sign Up')) {
                // Preserve all button attributes and styles
                button.textContent = 'Reset Trial';

                // Remove all existing event listeners
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);

                // Add our click handler
                newButton.addEventListener('click', function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    deleteAnonIdCookie();
                    window.location.reload();
                });

                return true; // Button found and modified
            }
        }
        return false; // Button not found
    }

    // Function to populate the assistant input
    function populateAssistantInput() {
        const inputText = 'Find recent articles that back up this paragraph: ';
        const selectors = [
            'input[placeholder="Ask a question"]',
            'input[placeholder="Ask a question..."]',
            'input[type="text"][data-testid="assistant-input"]',
            '#scite-app input[type="text"]',
            'textarea[placeholder="Ask a question"]',
            'textarea[placeholder="Ask a question..."]'
        ];

        for (const selector of selectors) {
            const input = document.querySelector(selector);
            if (input && !input.value) {
                input.value = inputText;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.focus();
                return true; // Input found and populated
            }
        }
        return false; // Input not found
    }

    // Function to handle "View full text" link clicks
    function setupLinkRedirect() {
        document.addEventListener('click', function(event) {
            const link = event.target.closest('a');
            if (link && /(Get access via publisher|View full text)/i.test(link.textContent)) {
                event.preventDefault();
                let doi = link.href;
                // Extract DOI from URL if needed
                const doiMatch = doi.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
                if (doiMatch) doi = doiMatch[0];

                const encodedDoi = doi.replace(/\//g, '~2F');
                const libraryUrl = `https://find.library.unisa.edu.au/discovery/search?query=any,contains,${encodedDoi}&tab=LIBCOLL&search_scope=MyInst_and_CI&vid=61USOUTHAUS_INST:UNISA&offset=0`;
                window.open(libraryUrl, '_blank');
            }
        });
    }

    // Function to modify Dashboard buttons to UniSA Library buttons
    function modifyDashboardButtons() {
        // Find all Dashboard buttons
        const buttons = document.querySelectorAll('button');
        let modifiedCount = 0;

        buttons.forEach(button => {
            if (button.textContent.trim() === 'Dashboard') {
                // Find the associated DOI link
                const container = button.closest('.PaperActions__mainContainer___FQPVQ');
                if (container) {
                    const doiLink = container.querySelector('a[href*="doi.org/"]');
                    if (doiLink) {
                        const doi = doiLink.href;
                        const doiMatch = doi.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
                        if (doiMatch) {
                            const cleanDoi = doiMatch[0];
                            const encodedDoi = cleanDoi.replace(/\//g, '~2F');
                            const libraryUrl = `https://find.library.unisa.edu.au/discovery/search?query=any,contains,${encodedDoi}&tab=LIBCOLL&search_scope=MyInst_and_CI&vid=61USOUTHAUS_INST:UNISA&offset=0`;

                            // Clone the button to remove event listeners
                            const newButton = button.cloneNode(true);
                            newButton.textContent = 'UniSA Library';

                            // Add click handler
                            newButton.addEventListener('click', function(e) {
                                e.preventDefault();
                                window.open(libraryUrl, '_blank');
                            });

                            // Replace the button
                            button.parentNode.replaceChild(newButton, button);
                            modifiedCount++;
                        }
                    }
                }
            }
        });

        return modifiedCount > 0;
    }

    // Main initialization sequence
    function initializePage() {
        // Set up link redirects
        setupLinkRedirect();

        // Check if we're on the assistant page
        const isAssistantPage = window.location.pathname.includes('/assistant');

        // Flags to track completed tasks
        let resetButtonDone = false;
        let inputPopulated = false;
        let dashboardButtonsModified = false;

        // Set up periodic checks for page elements
        const initInterval = setInterval(() => {
            // 1. Handle reset button
            if (!resetButtonDone) {
                resetButtonDone = modifySignUpButton();
            }

            // 2. Populate input on assistant page
            if (isAssistantPage && !inputPopulated) {
                inputPopulated = populateAssistantInput();
            }

            // 3. Modify Dashboard buttons on results pages
            if (isAssistantPage && !dashboardButtonsModified) {
                dashboardButtonsModified = modifyDashboardButtons();
            }

            // If all tasks are complete, stop checking
            if (resetButtonDone &&
                (!isAssistantPage || (inputPopulated && dashboardButtonsModified))) {
                clearInterval(initInterval);
            }
        }, 1000); // Check every second
    }

    // Start initialization after a short delay to allow initial page render
    setTimeout(initializePage, 2000);
})();