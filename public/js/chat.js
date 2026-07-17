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
            
            // Seamless client-side local fallback
            try {
                const localFallbackText = getClientFallbackResponse(messageText);
                
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

                // Stream the response with micro-delays
                const chunkSize = 4;
                let currentText = "";
                for (let i = 0; i < localFallbackText.length; i += chunkSize) {
                    const chunkText = localFallbackText.substring(i, i + chunkSize);
                    currentText += chunkText;
                    contentDiv.innerHTML = parseSimpleMarkdown(currentText);
                    scrollToBottom();
                    await new Promise(resolve => setTimeout(resolve, 15));
                }

                // Speak and add chips
                speakText(localFallbackText);
                const actionChips = createNavigationChips(localFallbackText);
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

                // Update history
                chatHistory.push({ role: 'user', text: messageText });
                chatHistory.push({ role: 'model', text: localFallbackText });
                if (chatHistory.length > 20) {
                    chatHistory = chatHistory.slice(-20);
                }
            } catch (fallbackErr) {
                console.error("Client side fallback failed:", fallbackErr);
                const errMsg = "⚠️ AI से जुड़ने में समस्या हुई। कृपया पुनः प्रयास करें।";
                appendMessageBubble('bot', errMsg);
            }
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

    // --- Client-Side Fallback Engine for Offline / Unreachable Server Scenarios ---
    
    // Client-side facts database
    const localFacts = [
        {
            keywords: ['fee', 'fees', 'structure', 'charge', 'charges', 'hostel fee', 'mess', 'tuition', 'scholarship', 'scholarships', 'reimbursement', 'payment', 'paisa', 'rupay', 'rupee', 'rupees', 'kharch', 'kharcha', 'scholar', 'up scholarship', 'nsp'],
            english: `### AITD B.Tech Fee Structure:\n- **Tuition Fees**: ₹65,000 per year.\n- **Development Fees**: ₹10,000 per year.\n- **Library & Lab Charges**: ₹5,000 per year.\n- **Other Institutional Fees**: ₹7,800 per year.\n- **Total Institutional Fees**: ₹87,800 per year (excluding hostel and examination fees).\n- **Hostel Fees**: ₹15,000 per year (lodging, electricity, basic water).\n- **Mess Charges**: Approx. ₹3,000 per month (cooperative mess expenses).\n- **Examination Fees**: ₹7,500 per year.\n- **Scholarships**: Reserved category and Divyangjan students can apply for the UP State Scholarship and National Scholarship Portal (NSP) for full reimbursement of fees (family income ≤ ₹2,00,000 per year).`,
            hindi: `### AITD बी.टेक फीस संरचना:\n- **ट्यूशन फीस**: ₹65,000 प्रति वर्ष।\n- **विकास शुल्क**: ₹10,000 प्रति वर्ष।\n- **लाइब्रेरी और लैब शुल्क**: ₹5,000 प्रति वर्ष।\n- **अन्य संस्थागत शुल्क**: ₹7,800 प्रति वर्ष।\n- **कुल संस्थागत फीस**: ₹87,800 प्रति वर्ष (हॉस्टल और परीक्षा शुल्क को छोड़कर)।\n- **हॉस्टल फीस**: ₹15,000 प्रति वर्ष (आवास, बिजली, बुनियादी पानी)।\n- **मेस शुल्क**: लगभग ₹3,000 प्रति माह।\n- **परीक्षा शुल्क**: ₹7,500 प्रति वर्ष।\n- **छात्रवृत्ति (Scholarships)**: यूपी राज्य छात्रवृत्ति (UP Scholarship) और राष्ट्रीय छात्रवृत्ति पोर्टल (NSP) के तहत सभी पात्र दिव्यांग छात्रों को संस्थागत फीस की पूर्ण प्रतिपूर्ति (रिफंड) मिल सकती है (पारिवारिक वार्षिक आय ≤ ₹2,00,000 होनी चाहिए)।`
        },
        {
            keywords: ['department', 'departments', 'branch', 'branches', 'cse', 'it', 'computer science', 'electronics', 'chemical', 'biotech', 'biotechnology', 'paint', 'food', 'civil', 'mechanical', 'block', 'nba', 'accredited', 'accridited', 'seat', 'seats', 'resrvation'],
            english: `### AITD B.Tech Departments & Admissions:\n1. **Computer Science & Engineering (CSE)** - Located in F-Block.\n2. **Information Technology (IT)** - Located in F-Block.\n3. **Electronics Engineering** - NBA Accredited.\n4. **Chemical Engineering** - Located in the Chemical & Biotech block.\n5. **Biotechnology** - Located near the chemical department.\n6. **Paint Technology** - Specialized branch.\n7. **Food Technology** - Specialized branch.\n8. **Civil Engineering**\n9. **Mechanical Engineering**\n\n*Note*: 60% of B.Tech seats are reserved specifically for physically challenged (Divyangjan) candidates. There are also specialized Diploma courses designed for disabled students.`,
            hindi: `### AITD बी.टेक विभाग (Departments) और प्रवेश:\n1. **कंप्यूटर साइंस एंड इंजीनियरिंग (CSE)** - F-Block में स्थित है।\n2. **इन्फॉर्मेशन टेक्नोलॉजी (IT)** - F-Block में स्थित है।\n3. **इलेक्ट्रॉनिक्स इंजीनियरिंग** - NBA मान्यता प्राप्त।\n4. **केमिकल इंजीनियरिंग** - केमिकल और बायोटेक ब्लॉक में।\n5. **बायोटेक्नोलॉजी** - केमिकल विभाग के पास।\n6. **पेंट टेक्नोलॉजी** - विशिष्ट शाखा।\n7. **खाद्य प्रौद्योगिकी (Food Tech)** - विशिष्ट शाखा।\n8. **सिविल इंजीनियरिंग**\n9. **मैनेजमेंट/मैकेनिकल इंजीनियरिंग**\n\n*विशेष टिप्पणी*: बी.टेक की 60% सीटें विशेष रूप से दिव्यांग (physically challenged) उम्मीदवारों के लिए आरक्षित हैं। दिव्यांग छात्रों के लिए विशेष डिप्लोमा पाठ्यक्रम भी उपलब्ध हैं।`
        },
        {
            keywords: ['scribe', 'writer', 'reader', 'exam', 'exams', 'aktu', 'paper', 'helper', 'disability certificate', 'extra time', 'medical certificate', 'rules', 'rule', 'cmo'],
            english: `### AITD Scribe/Writer Rules for Exams:\n1. **Eligibility**: Students with >40% writing limb disability, visual impairment, or temporary arm injuries are eligible to avail a scribe/reader during AKTU exams.\n2. **Qualification**: Scribe must be one academic grade lower than the candidate and from a different department/branch (e.g., a 1st year CSE student cannot write for a 2nd year CSE student, but can write for a 2nd year IT student).\n3. **Extra Time**: Candidates using a scribe get an **extra 20 minutes per hour** (e.g., 60 minutes extra for a 3-hour exam).\n4. **Procedure**: Submit an application to the Controller of Examinations (COE) along with a valid CMO Medical Disability Certificate and Scribe ID proof at least 7 days before exams start.`,
            hindi: `### परीक्षाओं के लिए लेखक/स्क्राइब (Scribe) नियम:\n1. **पात्रता**: लिखने वाले अंगों में 40% से अधिक दिव्यांगता वाले छात्र, दृष्टिबाधित छात्र, या हाथ की अस्थायी चोट वाले छात्र परीक्षा में लेखक/स्क्राइब का लाभ ले सकते हैं।\n2. **योग्यता**: स्क्राइब उम्मीदवार से एक शैक्षणिक वर्ष नीचे होना चाहिए और एक ही विभाग/शाखा से नहीं होना चाहिए (जैसे, प्रथम वर्ष का छात्र द्वितीय वर्ष के छात्र के लिए लिख सकता है)।\n3. **अतिरिक्त समय**: स्क्राइब का उपयोग करने वाले उम्मीदवारों को परीक्षा अवधि के प्रति घंटे **20 मिनट का अतिरिक्त समय** मिलता है (जैसे, 3 घंटे की परीक्षा के लिए 60 मिनट अतिरिक्त)।\n4. **प्रक्रिया**: परीक्षा शुरू होने से कम से कम 7 दिन पहले मुख्य चिकित्सा अधिकारी (CMO) के दिव्यांगता प्रमाण पत्र और स्क्राइब के पहचान पत्र के साथ परीक्षा नियंत्रक (COE) को आवेदन जमा करें।`
        },
        {
            keywords: ['accessibility', 'amenity', 'amenities', 'ramp', 'ramps', 'lift', 'lifts', 'elevator', 'wheelchair', 'accessible', 'barrier-free', 'facility', 'toilet', 'washroom', 'grab rails', 'tactile flooring'],
            english: `### Accessibility & Amenities for Divyangjan:\n- **Ramps**: Installed at the entrance of all academic blocks, hostels, and libraries to ensure barrier-free movement.\n- **Lifts/Elevators**: Installed in the Main Academic Building to access upper floor classrooms and computer labs.\n- **Accessible Classrooms**: Wheelchair-friendly rooms with low-height writing desks.\n- **Divyangjan Hostel**: Specially designed rooms featuring wider doors, grab rails, and accessible washrooms.`,
            hindi: `### दिव्यांगजन सुविधाएं और सुलभता (Accessibility):\n- **रैंप**: सभी शैक्षणिक ब्लॉकों, हॉस्टलों और पुस्तकालयों के प्रवेश द्वार पर रैंप स्थापित किए गए हैं ताकि व्हीलचेयर का आवागमन आसान हो सके।\n- **लिफ्ट**: ऊपरी मंजिलों पर कक्षाओं और लैब तक पहुंचने के लिए मुख्य शैक्षणिक भवन में लिफ्ट लगाई गई है।\n- **अनुकूलित कक्षाएं**: व्हीलचेयर सुलभ कमरे जो कम ऊंचाई वाले लेखन डेस्क से सुसज्जित हैं।\n- **दिव्यांगजन हॉस्टल**: चौड़े दरवाजे, ग्रैब रेल्स (grab rails) और सुलभ शौचालय वाले विशेष अनुकूलित कमरे।`
        },
        {
            keywords: ['contact', 'phone', 'number', 'mobile', 'email', 'address', 'location', 'where', 'director', 'office', 'aith', 'aitd', 'call', 'website', 'director room', 'director\'s room', 'director office', 'director\'s office'],
            english: `### Contact & Office Details:\n- **Address**: Awadhpuri (Opposite Rama Dental College), Kanpur, Uttar Pradesh, 208024.\n- **Phone Number**: 0512-2583221.\n- **Email**: director@aith.ac.in, info@aith.ac.in.\n- **Website**: aitd.ac.in (or aith.ac.in).\n- **Director's Office**: Located in the Main Academic Building.\n- **CSE/IT Department HOD**: Dr. Shrinath Dwivedi (Office located in F-Block).`,
            hindi: `### संपर्क और कार्यालय विवरण:\n- **पता**: अवधपुरी (रामा डेंटल कॉलेज के सामने), कानपुर, उत्तर प्रदेश, 208024।\n- **फोन नंबर**: 0512-2583221।\n- **ईमेल**: director@aith.ac.in, info@aith.ac.in।\n- **वेबसाइट**: aitd.ac.in या aith.ac.in।\n- **निदेशक कार्यालय**: मुख्य शैक्षणिक भवन में स्थित है।\n- **CSE/IT विभाग के HOD**: डॉ. श्रीनाथ द्विवेदी (कार्यालय F-Block में स्थित है)।`
        }
    ];

    function isClientHindi(text) {
        const containsDevanagari = /[\u0900-\u097F]/.test(text);
        if (containsDevanagari) return true;
        
        const hindiKeywords = ['kaha', 'kahan', 'hai', 'he', 'kaise', 'kab', 'kis', 'kitna', 'kitni', 'kyun', 'kyon', 'ko', 'se', 'me', 'mein', 'bhai', 'batao', 'suno', 'naam', 'kamra', 'pata', 'bata', 'shi', 'kar', 'jldi', 'kra', 'kr'];
        const words = text.toLowerCase().split(/\s+/);
        return words.some(w => hindiKeywords.includes(w));
    }

    function getClientFallbackResponse(query) {
        const lowerQuery = query.toLowerCase().trim();
        const useHindi = isClientHindi(query);
        
        // 1. Greetings
        const greetings = ['hi', 'hello', 'hey', 'namaste', 'helo', 'hlo', 'नमस्ते', 'helo', 'hii', 'hiii', 'listen', 'bhai', 'listen bhai'];
        if (greetings.includes(lowerQuery) || lowerQuery === 'hi sarathi' || lowerQuery === 'hello sarathi' || lowerQuery.startsWith('hi ') || lowerQuery.startsWith('hello ')) {
            if (useHindi) {
                return `नमस्ते! मैं **सारथी (Sarathi)** हूँ, AITD कैंपस का AI सहायक। ♿ 🧭\n\nमैं आपको AITD कैंपस के रास्तों, हॉस्टल, लैब, दिव्यांग सुविधाओं, फीस संरचना और स्कॉलरशिप के बारे में जानकारी दे सकता हूँ।\n\nआप मुझसे कुछ भी पूछ सकते हैं, जैसे:\n- "Fees kitni hai?"\n- "Divyangjan hostel kaha hai?"\n- "CSE Department ka HOD kaun hai?"\n- "Scribe rules kya hai?"`;
            } else {
                return `Hello! I am **Sarathi**, the AI Assistant of AITD Campus. ♿ 🧭\n\nI can assist you with campus routes, hostels, labs, accessibility facilities, fee structure, and scholarships.\n\nFeel free to ask me anything, such as:\n- "What is the fee structure?"\n- "Where is the Divyangjan hostel?"\n- "Who is the HOD of CSE?"\n- "What are the scribe rules?"`;
            }
        }

        // 2. Keyword Fact Match
        for (const fact of localFacts) {
            const matches = fact.keywords.some(kw => lowerQuery.includes(kw));
            if (matches) {
                let response = useHindi 
                    ? `AITD लोकल डेटाबेस (सक्रिय ऑफ़लाइन सहायता) के अनुसार:\n\n${fact.hindi}\n\nयदि आप इस स्थान का मार्ग देखना चाहते हैं, तो नीचे दिए गए 'Find Route' बटन का उपयोग कर सकते हैं। 👇`
                    : `According to AITD local database (Offline Assistance active):\n\n${fact.english}\n\nIf you want to find the route to this place, use the navigation button below. 👇`;
                return response;
            }
        }

        // 3. Location Match using global locations array
        if (typeof locations !== 'undefined') {
            const matchedLocs = [];
            for (const loc of locations) {
                if (loc.isRouting) continue;
                const name = loc.name.toLowerCase();
                const disp = (loc.displayName || "").toLowerCase();
                if (lowerQuery.includes(name) || (disp && lowerQuery.includes(disp))) {
                    matchedLocs.push(loc);
                }
            }
            if (matchedLocs.length > 0) {
                const loc = matchedLocs[0];
                if (useHindi) {
                    return `AITD कैंपस में **${loc.displayName || loc.name}** उपलब्ध है। यह **${loc.category || 'सुविधा'}** श्रेणी में आता है।\n\nमैंने आपके लिए मार्ग खोजने हेतु नीचे बटन जोड़ दिया है। आप उस पर क्लिक करके सीधा नेविगेशन देख सकते हैं!`;
                } else {
                    return `**${loc.displayName || loc.name}** is located on AITD campus. It belongs to the **${loc.category || 'facility'}** category.\n\nI have added a button below for your navigation. Click it to view the route on the map!`;
                }
            }
        }

        // 4. Default Fallback
        if (useHindi) {
            return `नमस्ते! मैं AITD कैंपस और दिव्यांग सहायता के लिए उपलब्ध हूँ। आपके प्रश्न के बारे में मुझे विशिष्ट विवरण नहीं मिला, लेकिन आप इनसे संबंधित कुछ भी पूछ सकते हैं:\n\n1. **AITD B.Tech Fees**: फीस संरचना, हॉस्टल फ़ीस।\n2. **Departments**: CSE, IT, Electronics, Chemical, Paint Tech आदि।\n3. **Divyangjan Features**: Ramps, Lifts, Scribe Rules, Divyangjan Hostel.\n4. **Contacts**: फ़ोन नंबर, ईमेल और पता।\n\nआप नीचे दिए गए मैप पर भी किसी भी स्थान का मार्ग देख सकते हैं!`;
        } else {
            return `Hello! I am here to help with AITD campus details and accessibility support. I couldn't find specific information for your question, but feel free to ask about:\n\n1. **AITD B.Tech Fees**: fee structure, hostel fees.\n2. **Departments**: CSE, IT, Electronics, Chemical, Paint Tech, etc.\n3. **Divyangjan Features**: ramps, lifts, scribe rules, Divyangjan hostel.\n4. **Contacts**: phone numbers, email, and address.\n\nYou can also find the route to any place using the map below!`;
        }
    }
});
