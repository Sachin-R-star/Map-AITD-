document.addEventListener('DOMContentLoaded', function() {
    // --- Elements ---
    const chatDrawer = document.getElementById('chatDrawer');
    const floatingChatBtn = document.getElementById('floatingChatBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const aiAssistantBtn = document.getElementById('aiAssistantBtn');
    
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const speechBtn = document.getElementById('speechBtn');
    const muteVoiceBtn = document.getElementById('muteVoiceBtn');

    // --- State ---
    let chatHistory = [];
    let isVoiceMuted = localStorage.getItem('chatVoiceMuted') === 'true';
    let recognition = null;
    let isRecording = false;

    // Update mute button icon initially
    updateMuteButtonUI();

    // --- Event Listeners for Drawer ---
    floatingChatBtn.addEventListener('click', toggleChatDrawer);
    closeChatBtn.addEventListener('click', closeChatDrawer);
    if (aiAssistantBtn) {
        aiAssistantBtn.addEventListener('click', openChatDrawer);
    }

    function toggleChatDrawer() {
        chatDrawer.classList.toggle('closed');
        if (!chatDrawer.classList.contains('closed')) {
            chatInput.focus();
            scrollToBottom();
        }
    }

    function openChatDrawer() {
        chatDrawer.classList.remove('closed');
        chatInput.focus();
        scrollToBottom();
    }

    function closeChatDrawer() {
        chatDrawer.classList.add('closed');
        // Stop speech if speaking
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }

    // --- Sound Synthesis (Text-to-Speech) ---
    function speakText(text) {
        if (isVoiceMuted || !window.speechSynthesis) return;

        // Stop current speaking
        window.speechSynthesis.cancel();

        // Strip markdown and HTML tags for cleaner speech
        let cleanText = text.replace(/[\#\*\_`\>]/g, '') // Remove markdown symbols
                            .replace(/<[^>]*>/g, '')      // Remove HTML tags
                            .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Try to select a suitable Hindi/English voice
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;

        // Try to find a Hindi voice first, since most text might be Hindi/Hinglish
        selectedVoice = voices.find(v => v.lang.startsWith('hi-'));
        
        if (!selectedVoice) {
            // Fallback to English voice
            selectedVoice = voices.find(v => v.lang.startsWith('en-'));
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }

    muteVoiceBtn.addEventListener('click', function() {
        isVoiceMuted = !isVoiceMuted;
        localStorage.setItem('chatVoiceMuted', isVoiceMuted);
        updateMuteButtonUI();
        if (isVoiceMuted && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    });

    function updateMuteButtonUI() {
        muteVoiceBtn.innerText = isVoiceMuted ? '🔇' : '🔊';
        muteVoiceBtn.title = isVoiceMuted ? 'Unmute Voice' : 'Mute Voice';
    }

    // --- Speech Recognition (Speech-to-Text) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'hi-IN'; // Set to Hindi/Hinglish by default, responds well to English too
        recognition.interimResults = false;

        recognition.onstart = function() {
            isRecording = true;
            speechBtn.classList.add('recording');
            chatInput.placeholder = "Listening...";
        };

        recognition.onerror = function(event) {
            console.error("Speech recognition error:", event.error);
            stopRecording();
        };

        recognition.onend = function() {
            stopRecording();
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            sendChatMessage();
        };

        speechBtn.addEventListener('click', function() {
            if (isRecording) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    } else {
        speechBtn.style.display = 'none'; // Hide if browser doesn't support Web Speech API
    }

    function stopRecording() {
        isRecording = false;
        speechBtn.classList.remove('recording');
        chatInput.placeholder = "Ask Sarathi anything...";
    }

    // --- Sending Messages ---
    sendChatBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    async function sendChatMessage() {
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        // Clear input
        chatInput.value = '';

        // Add user message bubble
        appendMessageBubble('user', messageText);

        // Add typing indicator
        const typingIndicator = showTypingIndicator();

        try {
            // Call backend API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'bypass-tunnel-reminder': 'true'
                },
                body: JSON.stringify({
                    message: messageText,
                    history: chatHistory
                })
            });

            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }

            // Remove typing indicator
            removeTypingIndicator(typingIndicator);

            // Create bot message bubble early for streaming chunks
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('chat-message', 'bot');

            const contentDiv = document.createElement('div');
            contentDiv.classList.add('message-content');
            messageDiv.appendChild(contentDiv);

            const timeDiv = document.createElement('div');
            timeDiv.classList.add('message-time');
            const now = new Date();
            timeDiv.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            messageDiv.appendChild(timeDiv);

            chatMessages.appendChild(messageDiv);
            scrollToBottom();

            // Set up stream reader to decode Server-Sent Events (SSE)
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let accumulatedText = "";
            let partialChunk = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = (partialChunk + chunk).split(/\r?\n/);
                
                // Keep the last incomplete block for the next iteration
                partialChunk = lines.pop();

                for (const line of lines) {
                    const cleanLine = line.trim();
                    if (!cleanLine) continue;

                    if (cleanLine.startsWith('data: ')) {
                        const rawData = cleanLine.substring(6).trim();
                        if (rawData === '[DONE]') continue;
                        
                        try {
                            const parsed = JSON.parse(rawData);
                            if (parsed.text) {
                                accumulatedText += parsed.text;
                                contentDiv.innerHTML = parseSimpleMarkdown(accumulatedText);
                                scrollToBottom();
                            }
                        } catch (e) {
                            console.warn("Failed to parse SSE JSON chunk:", e, rawData);
                        }
                    }
                }
            }

            // Once streaming completes:
            // 1. Speak response if voice is active
            speakText(accumulatedText);

            // 2. Scan text for location chips
            const actionChips = createNavigationChips(accumulatedText);
            if (actionChips.length > 0) {
                const chipsContainer = document.createElement('div');
                chipsContainer.style.display = 'flex';
                chipsContainer.style.flexWrap = 'wrap';
                chipsContainer.style.gap = '6px';
                chipsContainer.style.marginTop = '8px';
                
                actionChips.forEach(chip => {
                    chipsContainer.appendChild(chip);
                });
                contentDiv.appendChild(chipsContainer);
                scrollToBottom();
            }

            // 3. Update history
            chatHistory.push({ role: 'user', text: messageText });
            chatHistory.push({ role: 'model', text: accumulatedText });

            if (chatHistory.length > 20) {
                chatHistory = chatHistory.slice(-20);
            }

        } catch (error) {
            console.error("Chat error:", error);
            removeTypingIndicator(typingIndicator);
            appendMessageBubble('bot', "कनेक्शन एरर। कृपया सुनिश्चित करें कि आपका सर्वर चालू है और इंटरनेट कनेक्टेड है।");
        }
    }

    // --- UI Rendering Helpers ---
    function appendMessageBubble(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', sender);

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        
        // Parse markdown links & bold formatting simply on frontend
        let htmlText = parseSimpleMarkdown(text);
        contentDiv.innerHTML = htmlText;

        // Scan message for campus locations to create navigation shortcut buttons
        const actionChips = createNavigationChips(text);
        if (actionChips.length > 0) {
            const chipsContainer = document.createElement('div');
            chipsContainer.style.display = 'flex';
            chipsContainer.style.flexWrap = 'wrap';
            chipsContainer.style.gap = '6px';
            chipsContainer.style.marginTop = '8px';
            
            actionChips.forEach(chip => {
                chipsContainer.appendChild(chip);
            });
            contentDiv.appendChild(chipsContainer);
        }

        const timeDiv = document.createElement('div');
        timeDiv.classList.add('message-time');
        const now = new Date();
        timeDiv.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);

        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const indicatorDiv = document.createElement('div');
        indicatorDiv.classList.add('typing-indicator');
        indicatorDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        chatMessages.appendChild(indicatorDiv);
        scrollToBottom();
        return indicatorDiv;
    }

    function removeTypingIndicator(indicator) {
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Parse simple markdown: **bold**, \n to <br>
    function parseSimpleMarkdown(text) {
        // Convert URLs to actual links
        let parsed = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="chat-link">$1</a>');
        
        // Bold formatting
        parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Newlines to breaks
        parsed = parsed.replace(/\n/g, '<br>');

        return parsed;
    }

    // Bridge chatbot details to map inputs dynamically
    function createNavigationChips(text) {
        if (typeof locations === 'undefined') return [];

        const chips = [];
        const lowerText = text.toLowerCase();
        
        // Generic tags blocklist to avoid matching general words like "lab" or "building"
        const genericBlocklist = ['lab', 'room', 'gate', 'road', 'path', 'dept', 'department', 'block', 'hostel', 'campus', 'building', 'office', 'entrance', 'exit', 'sports', 'game', 'play', 'ground', 'court', 'auditorium', 'centre', 'stage', 'main'];

        // Scan for matching locations in locations list
        locations.forEach(loc => {
            if (loc.isRouting) return; // Ignore pure routing intersection points
            
            const matchName = loc.name.toLowerCase();
            const matchDisplay = (loc.displayName || "").toLowerCase();
            
            // Check if AI response mentions this location name or display name explicitly
            let isMatch = lowerText.includes(matchName) || (matchDisplay && lowerText.includes(matchDisplay));
            
            // Stricter Tag Matching: only match specific, long tag words not on the blocklist
            if (!isMatch && loc.tags) {
                for (let tag of loc.tags) {
                    const cleanTag = tag.toLowerCase().trim();
                    if (cleanTag.length <= 3 || genericBlocklist.includes(cleanTag)) {
                        continue; // Skip generic tags
                    }
                    if (lowerText.includes(cleanTag)) {
                        isMatch = true;
                        break;
                    }
                }
            }

            if (isMatch) {
                // Ensure duplicate chips aren't created
                if (chips.some(c => c.getAttribute('data-loc') === loc.name)) return;

                const button = document.createElement('button');
                button.className = 'question-chip'; // Reuse styling of question chips
                button.style.fontSize = '0.75em';
                button.style.padding = '4px 8px';
                button.style.margin = '2px 0';
                button.style.backgroundColor = 'rgba(99, 102, 241, 0.15)';
                button.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                button.style.color = '#e0e7ff';
                button.style.display = 'inline-flex';
                button.style.alignItems = 'center';
                button.style.gap = '4px';
                button.setAttribute('data-loc', loc.name);
                button.innerHTML = `${loc.icon || '📍'} Find Route to ${loc.displayName || loc.name}`;

                button.addEventListener('click', function() {
                    setDestinationOnMap(loc.displayName || loc.name);
                });
                
                chips.push(button);
            }
        });

        return chips.slice(0, 3); // Max 3 chips to prevent layout clutter
    }

    // Set destination inputs and trigger routes
    function setDestinationOnMap(locationName) {
        const destInput = document.getElementById('destInput');
        const sourceInput = document.getElementById('sourceInput');
        
        if (destInput) {
            destInput.value = locationName;
            
            // Dispatch input and change events to trigger map autocompletes
            destInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Highlight search matching and trigger route finding
            const searchBtn = document.getElementById('searchBtn');
            if (searchBtn) {
                // If source input is empty, default it to entrance (AITH Gate No. 1) to make it easy
                if (!sourceInput.value.trim()) {
                    sourceInput.value = "AITH Gate No. 1";
                    sourceInput.dispatchEvent(new Event('input', { bubbles: true }));
                }

                // Close chat drawer to let user focus on map
                closeChatDrawer();

                // Smoothly focus/scroll to search button and trigger path finding after a short delay
                setTimeout(() => {
                    searchBtn.click();
                }, 400);
            }
        }
    }
});
