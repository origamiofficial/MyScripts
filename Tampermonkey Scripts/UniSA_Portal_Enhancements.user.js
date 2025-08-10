// ==UserScript==
// @name         UniSA Portal Enhancements
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Open links in new tabs, redirect root page, and add assignments button
// @author       You
// @match        https://lo.unisa.edu.au/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Redirect from root page to student portal
    if (window.location.pathname === '/my/') {
        window.location.href = 'https://my.unisa.edu.au/student/portal/';
        return;
    }

    // Add CSS styles with updated color scheme (#00539f)
    GM_addStyle(`
        #assignmentsButton {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #00539f;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: none;
            user-select: none;
        }
        
        #assignmentsButton:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 25px rgba(0,0,0,0.3);
            background: #0066cc;
        }
        
        #assignmentsButton:active {
            transform: scale(0.95);
            background: #004080;
        }
        
        #assignmentsList {
            position: fixed;
            z-index: 9998;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            padding: 15px 0;
            max-height: 70vh;
            overflow-y: auto;
            transform-origin: bottom right;
            animation: fadeIn 0.3s ease-out;
            display: none;
            min-width: 250px;
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
        }
        
        .assignment-item {
            padding: 12px 25px;
            white-space: nowrap;
            cursor: pointer;
            transition: background 0.2s;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            align-items: center;
            color: #333;
        }
        
        .assignment-item:hover {
            background: #e6f0ff;
        }
        
        .assignment-item::before {
            content: '📄';
            margin-right: 10px;
            font-size: 1.1em;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .pulse {
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(0, 83, 159, 0.7); }
            70% { box-shadow: 0 0 0 12px rgba(0, 83, 159, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 83, 159, 0); }
        }
        
        .no-assignments {
            padding: 15px 25px;
            color: #666;
            font-style: italic;
            text-align: center;
        }
    `);

    // Check if we're on a course page
    const coursePageRegex = /^https:\/\/lo\.unisa\.edu\.au\/course\/view\.php\?id=\d+(&sectionid=\d+)?$/;
    if (coursePageRegex.test(window.location.href)) {
        createFloatingButton();
    }

    // Original link handling
    document.addEventListener('click', function(event) {
        const anchor = event.target.closest('a');
        if (anchor && anchor.href) {
            try {
                const url = new URL(anchor.href);
                if ((url.pathname === '/mod/resource/view.php' || url.pathname === '/mod/url/view.php') &&
                    url.search.startsWith('?id=')) {
                    event.preventDefault();
                    window.open(anchor.href, '_blank');
                }
            } catch (e) {
                // Ignore invalid URLs
            }
        }
    });

    function createFloatingButton() {
        // Create button
        const button = document.createElement('button');
        button.id = 'assignmentsButton';
        button.innerHTML = '📝';
        button.title = 'View Assignments';
        document.body.appendChild(button);

        // Create list container
        const list = document.createElement('div');
        list.id = 'assignmentsList';
        document.body.appendChild(list);

        // Load saved position or set default
        const savedPos = GM_getValue('buttonPosition', {x: 20, y: 20});
        button.style.right = `${savedPos.x}px`;
        button.style.bottom = `${savedPos.y}px`;

        // Add drag functionality
        let isDragging = false;
        let offset = {x: 0, y: 0};

        button.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);

        function startDrag(e) {
            if (e.target !== button) return;
            isDragging = true;
            const rect = button.getBoundingClientRect();
            offset = {
                x: e.clientX - rect.right,
                y: e.clientY - rect.bottom
            };
            button.style.transition = 'none';
            e.preventDefault();
        }

        function drag(e) {
            if (!isDragging) return;
            const x = window.innerWidth - e.clientX + offset.x;
            const y = window.innerHeight - e.clientY + offset.y;
            
            button.style.right = `${x}px`;
            button.style.bottom = `${y}px`;
        }

        function stopDrag() {
            if (!isDragging) return;
            isDragging = false;
            button.style.transition = '';
            
            // Save position
            const rect = button.getBoundingClientRect();
            GM_setValue('buttonPosition', {
                x: window.innerWidth - rect.right,
                y: window.innerHeight - rect.bottom
            });
        }

        // Add pulse animation
        button.classList.add('pulse');
        
        // Button click handler
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleAssignmentList();
        });

        // Click outside to close
        document.addEventListener('click', function(e) {
            if (!list.contains(e.target) && e.target !== button) {
                list.style.display = 'none';
            }
        });

        function toggleAssignmentList() {
            if (list.style.display === 'block') {
                list.style.display = 'none';
                return;
            }
            
            // Clear existing items
            list.innerHTML = '';
            
            // Find assignment links and remove duplicates by ID
            const links = Array.from(document.querySelectorAll('a[href*="/mod/assign/view.php"]'));
            const uniqueAssignments = new Map();

            links.forEach(link => {
                try {
                    const url = new URL(link.href);
                    const idParam = url.searchParams.get('id');
                    
                    if (idParam) {
                        // Use assignment ID as unique key
                        if (!uniqueAssignments.has(idParam)) {
                            uniqueAssignments.set(idParam, {
                                name: link.textContent.trim(),
                                url: link.href
                            });
                        }
                    }
                } catch (e) {
                    // Ignore invalid URLs
                }
            });

            if (uniqueAssignments.size === 0) {
                const item = document.createElement('div');
                item.className = 'no-assignments';
                item.textContent = 'No assignments found';
                list.appendChild(item);
            } else {
                // Sort assignments alphabetically
                const sortedAssignments = Array.from(uniqueAssignments.values()).sort((a, b) => 
                    a.name.localeCompare(b.name)
                );

                sortedAssignments.forEach(assign => {
                    const item = document.createElement('div');
                    item.className = 'assignment-item';
                    item.textContent = assign.name;
                    item.onclick = () => window.open(assign.url, '_blank');
                    list.appendChild(item);
                });
            }
            
            // Position list relative to button
            const buttonRect = button.getBoundingClientRect();
            list.style.bottom = `${window.innerHeight - buttonRect.top}px`;
            list.style.right = `${window.innerWidth - buttonRect.right}px`;
            list.style.display = 'block';
        }
    }
})();