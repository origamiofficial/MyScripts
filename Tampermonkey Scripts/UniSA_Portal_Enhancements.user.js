// ==UserScript==
// @name         UniSA Portal Enhancements
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Open links in new tabs, redirect root page, and add assignments/quiz button with due dates and submission status
// @author       OrigamiOfficial
// @match        https://lo.unisa.edu.au/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // Redirect from root page to student portal
    if (window.location.pathname === '/my/') {
        window.location.href = 'https://my.unisa.edu.au/student/portal/';
        return;
    }

    // Add CSS styles
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
            min-width: 280px;
            max-width: 420px;
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
        }
        
        .section-title {
            padding: 10px 25px 5px;
            font-weight: 600;
            color: #00539f;
            font-size: 1.1em;
            border-bottom: 1px solid #e0e0e0;
            margin: 10px 0 5px;
            display: flex;
            align-items: center;
        }
        
        .section-title::before {
            content: '';
            display: inline-block;
            width: 6px;
            height: 18px;
            background: #00539f;
            border-radius: 3px;
            margin-right: 10px;
        }
        
        .section-empty {
            padding: 15px 25px;
            color: #888;
            font-style: italic;
            text-align: center;
            font-size: 0.9em;
        }
        
        .assignment-item {
            padding: 12px 25px;
            cursor: pointer;
            transition: background 0.2s;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            flex-direction: column;
            border-bottom: 1px solid #f8f8f8;
        }
        
        .assignment-item:hover {
            background: #e6f0ff;
        }
        
        .assignment-header {
            display: flex;
            align-items: flex-start;
            margin-bottom: 4px;
        }
        
        .assignment-icon {
            font-size: 1.1em;
            margin-right: 8px;
            flex-shrink: 0;
            margin-top: 2px;
        }
        
        .assignment-name {
            font-weight: 500;
            flex-grow: 1;
            word-break: break-word;
        }
        
        .assignment-details {
            display: flex;
            flex-direction: column;
            margin-left: 23px;
            font-size: 0.85em;
            color: #666;
        }
        
        .assignment-due {
            margin-bottom: 3px;
            line-height: 1.4;
        }
        
        .assignment-status {
            display: flex;
            align-items: center;
            font-weight: 500;
        }
        
        .status-icon {
            margin-right: 5px;
            font-size: 1.1em;
        }
        
        .status-submitted {
            color: #4CAF50;
        }
        
        .status-pending {
            color: #F44336;
        }
        
        .status-passed {
            color: #888;
        }
        
        .assignment-due.highlight {
            color: #e53935;
            font-weight: 500;
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
        
        .no-activities {
            padding: 15px 25px;
            color: #666;
            font-style: italic;
            text-align: center;
        }
        
        .loading-details {
            font-size: 0.85em;
            color: #999;
            margin-top: 4px;
            font-style: italic;
        }
        
        .spinner {
            display: inline-block;
            width: 10px;
            height: 10px;
            border: 2px solid rgba(0, 83, 159, 0.3);
            border-radius: 50%;
            border-top-color: #00539f;
            animation: spin 1s ease-in-out infinite;
            margin-right: 5px;
            vertical-align: middle;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
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
        button.title = 'View Activities';
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

        async function toggleAssignmentList() {
            if (list.style.display === 'block') {
                list.style.display = 'none';
                return;
            }
            
            // Clear existing items
            list.innerHTML = '';
            
            // Find activity links
            const assignmentLinks = Array.from(document.querySelectorAll('a[href*="/mod/assign/view.php"]'));
            const quizLinks = Array.from(document.querySelectorAll('a[href*="/mod/quiz/view.php"]'));
            
            // Organize into sections
            const sections = [
                {
                    title: "Assignments",
                    type: "assignment",
                    activities: new Map()
                },
                {
                    title: "Quizzes",
                    type: "quiz",
                    activities: new Map()
                }
            ];

            // Process assignments
            assignmentLinks.forEach(link => {
                try {
                    const url = new URL(link.href);
                    const idParam = url.searchParams.get('id');
                    if (idParam) {
                        sections[0].activities.set(idParam, {
                            name: link.textContent.trim(),
                            url: link.href
                        });
                    }
                } catch (e) {
                    // Ignore invalid URLs
                }
            });

            // Process quizzes
            quizLinks.forEach(link => {
                try {
                    const url = new URL(link.href);
                    const idParam = url.searchParams.get('id');
                    if (idParam) {
                        sections[1].activities.set(idParam, {
                            name: link.textContent.trim(),
                            url: link.href
                        });
                    }
                } catch (e) {
                    // Ignore invalid URLs
                }
            });

            // Check if there are any activities
            const totalActivities = [...sections[0].activities, ...sections[1].activities].length;
            if (totalActivities === 0) {
                const item = document.createElement('div');
                item.className = 'no-activities';
                item.textContent = 'No activities found';
                list.appendChild(item);
            } else {
                // Create sections
                sections.forEach(section => {
                    if (section.activities.size === 0) return;
                    
                    // Add section title
                    const title = document.createElement('div');
                    title.className = 'section-title';
                    title.textContent = section.title;
                    list.appendChild(title);
                    
                    // Sort activities alphabetically
                    const sortedActivities = Array.from(section.activities.values()).sort((a, b) => 
                        a.name.localeCompare(b.name)
                    );

                    // Create activity items
                    sortedActivities.forEach(activity => {
                        const item = document.createElement('div');
                        item.className = 'assignment-item';
                        
                        const header = document.createElement('div');
                        header.className = 'assignment-header';
                        
                        const icon = document.createElement('div');
                        icon.className = 'assignment-icon';
                        icon.textContent = section.type === 'assignment' ? '📝' : '📝';
                        
                        const nameElement = document.createElement('div');
                        nameElement.className = 'assignment-name';
                        nameElement.textContent = activity.name;
                        
                        header.appendChild(icon);
                        header.appendChild(nameElement);
                        
                        const detailsElement = document.createElement('div');
                        detailsElement.className = 'assignment-details';
                        
                        // Show loading state for all activities
                        const loadingElement = document.createElement('div');
                        loadingElement.className = 'loading-details';
                        loadingElement.innerHTML = '<span class="spinner"></span> Loading details...';
                        detailsElement.appendChild(loadingElement);
                        
                        item.appendChild(header);
                        item.appendChild(detailsElement);
                        
                        item.onclick = () => window.open(activity.url, '_blank');
                        list.appendChild(item);
                        
                        // Fetch activity details
                        fetchActivityDetails(activity.url, section.type).then(({ dueDate, status }) => {
                            detailsElement.innerHTML = '';
                            
                            if (dueDate) {
                                const dueElement = document.createElement('div');
                                dueElement.className = 'assignment-due';
                                dueElement.textContent = section.type === 'assignment' 
                                    ? `Due: ${dueDate}` 
                                    : `Due: ${dueDate}`;
                                
                                const lowerDate = dueDate.toLowerCase();
                                if (lowerDate.includes('today') || lowerDate.includes('tomorrow')) {
                                    dueElement.classList.add('highlight');
                                }
                                
                                detailsElement.appendChild(dueElement);
                            }
                            
                            const statusElement = document.createElement('div');
                            statusElement.className = `assignment-status status-${status}`;
                            
                            const statusIcon = document.createElement('span');
                            statusIcon.className = 'status-icon';
                            statusIcon.textContent = status === 'submitted' ? '✓' : status === 'passed' ? '⏰' : '⌛';
                            
                            const statusText = document.createElement('span');
                            statusText.textContent = status === 'submitted' 
                                ? 'Submitted' 
                                : status === 'passed' 
                                ? 'Due date passed' 
                                : section.type === 'quiz' ? 'Not Submitted' : 'Pending';
                            
                            statusElement.appendChild(statusIcon);
                            statusElement.appendChild(statusText);
                            detailsElement.appendChild(statusElement);
                        }).catch(error => {
                            detailsElement.innerHTML = '';
                            
                            const errorElement = document.createElement('div');
                            errorElement.className = 'assignment-due';
                            errorElement.textContent = 'Details not available';
                            detailsElement.appendChild(errorElement);
                        });
                    });
                });

                // Add empty state for sections with no activities
                sections.forEach(section => {
                    if (section.activities.size === 0) {
                        const empty = document.createElement('div');
                        empty.className = 'section-empty';
                        empty.textContent = `No ${section.title.toLowerCase()} found`;
                        list.appendChild(empty);
                    }
                });
            }
            
            // Position list relative to button
            const buttonRect = button.getBoundingClientRect();
            list.style.bottom = `${window.innerHeight - buttonRect.top}px`;
            list.style.right = `${window.innerWidth - buttonRect.right}px`;
            list.style.display = 'block';
        }
        
        function fetchActivityDetails(url, type) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    onload: function(response) {
                        try {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(response.responseText, "text/html");
                            
                            let dueDate = '';
                            let status = 'pending';
                            
                            if (type === 'assignment') {
                                // Extract assignment due date
                                const dueDateElement = doc.querySelector("#region-main > div.activity-header > div.activity-information > div.activity-dates > div > div:nth-child(2)");
                                if (dueDateElement) {
                                    dueDate = dueDateElement.textContent.trim();
                                    const prefix = "Assignment due date:";
                                    if (dueDate.startsWith(prefix)) {
                                        dueDate = dueDate.slice(prefix.length).trim();
                                    }
                                }
                                
                                // Check assignment submission status
                                const submissionButton = doc.querySelector('div.completion-info > button');
                                status = submissionButton ? 'submitted' : 'pending';
                            } else if (type === 'quiz') {
                                // Extract quiz due date
                                const dueDateElement = doc.querySelector("#region-main > div.activity-header > div > div.activity-dates > div > div:nth-child(2)");
                                if (dueDateElement) {
                                    dueDate = dueDateElement.textContent.trim();
                                    const prefixes = ["Quiz closes:", "Quiz closed:"];
                                    for (const prefix of prefixes) {
                                        if (dueDate.startsWith(prefix)) {
                                            dueDate = dueDate.slice(prefix.length).trim();
                                            break;
                                        }
                                    }
                                }
                                
                                // Check if quiz is closed
                                const isClosed = dueDateElement && dueDateElement.textContent.includes("Quiz closed:");
                                
                                if (isClosed) {
                                    // For closed quizzes, mark as due date passed
                                    status = 'passed';
                                } else {
                                    // For open quizzes: look for re-attempt button
                                    const buttons = doc.querySelectorAll('button');
                                    for (const button of buttons) {
                                        if (button.textContent.includes("Re-attempt quiz")) {
                                            status = 'submitted';
                                            break;
                                        }
                                    }
                                    // If no re-attempt button found, check for grade or review button
                                    if (status !== 'submitted') {
                                        const gradeElement = doc.querySelector(".grade");
                                        if (gradeElement && gradeElement.textContent.trim() !== "-") {
                                            status = 'submitted';
                                        } else {
                                            const reviewButton = doc.querySelector('input[value="Review"]');
                                            if (reviewButton) {
                                                status = 'submitted';
                                            }
                                        }
                                    }
                                }
                            }
                            
                            resolve({ dueDate, status });
                        } catch (e) {
                            reject("Error parsing details");
                        }
                    },
                    onerror: function() {
                        reject("Failed to fetch details");
                    },
                    timeout: 10000 // 10 seconds timeout
                });
            });
        }
    }
})();