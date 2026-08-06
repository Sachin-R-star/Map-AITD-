const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Read and parse locations from client-side file for AI context
function getLocationsContext() {
    try {
        const filePath = path.join(__dirname, 'public', 'js', 'locations.js');
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const startIdx = content.indexOf('[');
            const endIdx = content.lastIndexOf(']');
            if (startIdx !== -1 && endIdx !== -1) {
                const jsonText = content.substring(startIdx, endIdx + 1);
                const locations = JSON.parse(jsonText);
                
                // Return simplified locations list for prompt token saving
                return locations
                    .filter(loc => !loc.isRouting) // Skip internal routing nodes
                    .map(loc => ({
                        name: loc.name,
                        displayName: loc.displayName || loc.name,
                        category: loc.category,
                        description: loc.tags ? loc.tags.join(', ') : ''
                    }));
            }
        }
    } catch (error) {
        console.error("Failed to parse locations context for AI:", error);
    }
    return [];
}

// Helper to check if a section contains a query word on word boundaries
function containsWord(text, word) {
    const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // Match word surrounded by non-alphanumeric (bilingual English + Devanagari) characters or string boundaries
    const regex = new RegExp('(?:^|[^a-zA-Z0-9\\u0900-\\u097F])' + escapedWord + '(?:$|[^a-zA-Z0-9\\u0900-\\u097F])', 'i');
    return regex.test(text);
}

// Read data files for local RAG knowledge base
function searchLocalKnowledge(query) {
    try {
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            return "";
        }
        
        const files = fs.readdirSync(dataDir);
        let allContent = "";
        
        for (const file of files) {
            if (file.endsWith('.txt')) {
                const filePath = path.join(dataDir, file);
                allContent += fs.readFileSync(filePath, 'utf8') + "\n\n";
            }
        }
        
        if (!allContent) return "";
        
        // Split content by sections or paragraphs
        const sections = allContent.split(/===|(?:\r?\n){2,}/);
        const matchingSections = [];
        
        // Define stop words to ignore in query keyword scoring
        const stopWords = ['hai', 'hain', 'he', 'ho', 'ka', 'ki', 'ke', 'ko', 'se', 'me', 'mein', 'bhai', 'batao', 'suno', 'naam', 'pata', 'bata', 'kar', 'kr', 'kra', 'kiya', 'tha', 'thi', 'the', 'kya', 'kise', 'kisne', 'kon', 'kaun', 'ab', 'gaya', 'gaye', 'gayi', 'aur', 'ya', 'toh', 'to', 'hi'];
        const words = query.toLowerCase()
            .split(/[\s,.\?\!]+/)
            .filter(w => w.length > 2 && !stopWords.includes(w));
        
        for (const section of sections) {
            const cleanSection = section.trim();
            if (!cleanSection) continue;
            
            const lowerSection = cleanSection.toLowerCase();
            let score = 0;
            
            // Simple keyword match scoring with exact word matching
            for (const word of words) {
                if (containsWord(lowerSection, word)) {
                    score += 1;
                    // Boost score if keyword matches section header lines
                    const firstLine = lowerSection.split('\n')[0];
                    if (containsWord(firstLine, word)) {
                        score += 2;
                    }
                }
            }
            
            if (score > 0) {
                matchingSections.push({ section: cleanSection, score });
            }
        }
        
        // Sort by relevance score descending
        matchingSections.sort((a, b) => b.score - a.score);
        
        // Take top 3 matches
        const topMatches = matchingSections.slice(0, 3).map(m => m.section);
        return topMatches.join("\n\n---\n\n");
    } catch (error) {
        console.error("RAG search failed:", error);
        return "";
    }
}

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey) {
    genAI = new GoogleGenAI({ apiKey });
} else {
    console.warn("WARNING: GEMINI_API_KEY is not defined. AI Chatbot will run in mock mode.");
}

// Detect if query is in Hindi or Hinglish
function isHindi(text) {
    const containsDevanagari = /[\u0900-\u097F]/.test(text);
    if (containsDevanagari) return true;
    
    const hindiKeywords = ['kaha', 'kahan', 'hai', 'he', 'kaise', 'kab', 'kis', 'kitna', 'kitni', 'kyun', 'kyon', 'ko', 'se', 'me', 'mein', 'bhai', 'batao', 'suno', 'naam', 'kamra', 'pata', 'bata', 'shi', 'kar', 'jldi', 'kra', 'kr'];
    const words = text.toLowerCase().split(/\s+/);
    return words.some(w => hindiKeywords.includes(w));
}

// Local bilingual facts database for chatbot fallback
const localFacts = [
    {
        keywords: ['fee', 'fees', 'hostel fee', 'mess fee', 'tuition', 'scholarship', 'scholarships', 'reimbursement', 'up scholarship', 'nsp'],
        english: `### AITD B.Tech Fee Structure:\n- **Tuition Fees**: ₹65,000 per year.\n- **Development Fees**: ₹10,000 per year.\n- **Library & Lab Charges**: ₹5,000 per year.\n- **Other Institutional Fees**: ₹7,800 per year.\n- **Total Institutional Fees**: ₹87,800 per year (excluding hostel and examination fees).\n- **Hostel Fees**: ₹15,000 per year (lodging, electricity, basic water).\n- **Mess Charges**: Approx. ₹3,000 per month (cooperative mess expenses).\n- **Examination Fees**: ₹7,500 per year.\n- **Scholarships**: Reserved category and Divyangjan students can apply for the UP State Scholarship and National Scholarship Portal (NSP) for full reimbursement of fees (family income ≤ ₹2,00,000 per year).\n- **Enquiries**: For fee payments and receipts, visit the Accountant Section in the Main Academic Building.`,
        hindi: `### AITD बी.टेक फीस संरचना:\n- **ट्यूशन फीस**: ₹65,000 प्रति वर्ष।\n- **विकास शुल्क**: ₹10,000 प्रति वर्ष।\n- **लाइब्रेरी और लैब शुल्क**: ₹5,000 प्रति वर्ष।\n- **अन्य संस्थागत शुल्क**: ₹7,800 प्रति वर्ष।\n- **कुल संस्थागत फीस**: ₹87,800 प्रति वर्ष (हॉस्टल और परीक्षा शुल्क को छोड़कर)।\n- **हॉस्टल फीस**: ₹15,000 प्रति वर्ष (आवास, बिजली, बुनियादी पानी)।\n- **मेस शुल्क**: लगभग ₹3,000 प्रति माह।\n- **परीक्षा शुल्क**: ₹7,500 प्रति वर्ष।\n- **छात्रवृत्ति (Scholarships)**: यूपी राज्य छात्रवृत्ति (UP Scholarship) और राष्ट्रीय छात्रवृत्ति पोर्टल (NSP) के तहत सभी पात्र दिव्यांग छात्रों को संस्थागत फीस की पूर्ण प्रतिपूर्ति (रिफंड) मिल सकती है (पारिवारिक वार्षिक आय ≤ ₹2,00,000 होनी चाहिए)।\n- **पूछताछ**: फीस जमा करने या रसीद प्राप्त करने के लिए आप Main Academic Building में Accountant Section (लेखा विभाग) जा सकते हैं।`
    },
    {
        keywords: ['department', 'departments', 'branch', 'branches', 'cse', 'it', 'computer science', 'electronics', 'chemical', 'biotech', 'biotechnology', 'paint technology', 'food technology', 'civil engineering', 'mechanical engineering'],
        english: `### AITD B.Tech Departments & Admissions:\n1. **Computer Science & Engineering (CSE)** - HOD office located in F-Block (CSE & IT).\n2. **Information Technology (IT)** - HOD office located in F-Block (CSE & IT).\n3. **Electronics Engineering** - Located in the Electronics Dept (NBA Accredited).\n4. **Chemical Engineering** - Located in the Chemical & Biotech Dept block.\n5. **Biotechnology** - Located in the Chemical & Biotech Dept block.\n6. **Paint Technology** - Located in the Paint Technology Dept block.\n7. **Food Technology** - Located in the Food Technology Dept block.\n8. **Civil Engineering** - Located in the Civil Dept block.\n9. **Mechanical Engineering** - Workshops located in the Mechanical Lab and Central Workshop.\n\n*Note*: 60% of B.Tech seats are reserved specifically for physically challenged (Divyangjan) candidates in the Administrative Block admission cell. There are also specialized Diploma courses designed for disabled students.`,
        hindi: `### AITD बी.टेक विभाग (Departments) और प्रवेश:\n1. **कंप्यूटर साइंस एंड इंजीनियरिंग (CSE)** - HOD कार्यालय F-Block (CSE & IT) में स्थित है।\n2. **इन्फॉर्मेशन टेक्नोलॉजी (IT)** - HOD कार्यालय F-Block (CSE & IT) में स्थित है।\n3. **इलेक्ट्रॉनिक्स इंजीनियरिंग** - Electronics Dept (NBA Accredited) में स्थित है।\n4. **केमिकल इंजीनियरिंग** - Chemical & Biotech Dept ब्लॉक में स्थित है।\n5. **बायोटेक्नोलॉजी** - Chemical & Biotech Dept ब्लॉक में स्थित है।\n6. **पेंट टेक्नोलॉजी** - Paint Technology Dept ब्लॉक में स्थित है।\n7. **खाद्य प्रौद्योगिकी (Food Tech)** - Food Technology Dept ब्लॉक में स्थित है।\n8. **सिविल इंजीनियरिंग** - Civil Dept ब्लॉक में स्थित है।\n9. **मैकेनिक इंजीनियरिंग** - कार्यशालाएं Mechanical Lab और Central Workshop में हैं।\n\n*विशेष टिप्पणी*: Administrative Block प्रवेश सेल में बी.टेक की 60% सीटें विशेष रूप से दिव्यांग (physically challenged) उम्मीदवारों के लिए आरक्षित हैं। दिव्यांगों के लिए विशेष डिप्लोमा पाठ्यक्रम भी उपलब्ध हैं।`
    },
    {
        keywords: ['scribe', 'writer', 'reader', 'aktu exam', 'aktu exams', 'exam writer', 'exam scribe', 'extra time', 'disability certificate', 'medical certificate', 'cmo certificate'],
        english: `### AITD Scribe/Writer Rules for Exams:\n1. **Eligibility**: Students with >40% writing limb disability, visual impairment, or temporary arm injuries are eligible to avail a scribe/reader during AKTU exams.\n2. **Qualification**: Scribe must be one academic grade lower than the candidate and from a different department/branch (e.g., a 1st year CSE student cannot write for a 2nd year CSE student, but can write for a 2nd year IT student).\n3. **Extra Time**: Candidates using a scribe get an **extra 20 minutes per hour** (e.g., 60 minutes extra for a 3-hour exam).\n4. **Procedure**: Submit an application to the Controller of Examinations (COE) at the Administrative Block along with a valid CMO Medical Disability Certificate and Scribe ID proof at least 7 days before exams start.`,
        hindi: `### परीक्षाओं के लिए लेखक/स्क्राइब (Scribe) नियम:\n1. **पात्रता**: लिखने वाले अंगों में 40% से अधिक दिव्यांगता वाले छात्र, दृष्टिबाधित छात्र, या हाथ की अस्थायी चोट वाले छात्र परीक्षा में लेखक/स्क्राइब का लाभ ले सकते हैं।\n2. **योग्यता**: स्क्राइब उम्मीदवार से एक शैक्षणिक वर्ष नीचे होना चाहिए और एक ही विभाग/शाखा से नहीं होना चाहिए (जैसे, प्रथम वर्ष का छात्र द्वितीय वर्ष के छात्र के लिए लिख सकता है)।\n3. **अतिरिक्त समय**: स्क्राइब का उपयोग करने वाले उम्मीदवारों को परीक्षा अवधि के प्रति घंटे **20 मिनट का अतिरिक्त समय** मिलता है (जैसे, 3 घंटे की परीक्षा के लिए 60 मिनट अतिरिक्त)।\n4. **प्रक्रिया**: परीक्षा शुरू होने से कम से कम 7 दिन पहले मुख्य चिकित्सा अधिकारी (CMO) के दिव्यांगता प्रमाण पत्र और स्क्राइब के पहचान पत्र के साथ Administrative Block में परीक्षा नियंत्रक (COE) को आवेदन जमा करें।`
    },
    {
        keywords: ['accessibility', 'amenity', 'amenities', 'ramp', 'ramps', 'lift', 'lifts', 'elevator', 'wheelchair', 'accessible', 'barrier-free', 'toilet', 'washroom', 'grab rails', 'tactile flooring'],
        english: `### Accessibility & Amenities for Divyangjan:\n- **Ramps**: Installed at the entrance of all academic blocks, hostels (including Divyangjan Hostel), and libraries to ensure barrier-free movement.\n- **Lifts/Elevators**: Installed in the Main Academic Building to access upper floor classrooms (accessible via Main Building Lift).\n- **Accessible Classrooms**: Wheelchair-friendly rooms with low-height writing desks like the Divyangjan Classroom.\n- **Divyangjan Hostel**: Specially designed rooms featuring wider doors, grab rails, and accessible washrooms.`,
        hindi: `### दिव्यांगजन सुविधाएं और सुलभता (Accessibility):\n- **रैंप**: सभी शैक्षणिक ब्लॉकों, पुस्तकालयों और Divyangjan Hostel के प्रवेश द्वार पर रैंप स्थापित किए गए हैं ताकि व्हीलचेयर का आवागमन आसान हो सके।\n- **लिफ्ट**: ऊपरी मंजिलों पर कक्षाओं और लैब तक पहुंचने के लिए Main Academic Building में Main Building Lift लगाई गई है।\n- **अनुकूलित कक्षाएं**: व्हीलचेयर सुलभ कमरे जो कम ऊंचाई वाले लेखन डेस्क से सुसज्जित हैं जैसे कि Divyangjan Classroom।\n- **दिव्यांगजन हॉस्टल (Divyangjan Hostel)**: चौड़े दरवाजे, ग्रैब रेल्स (grab rails) और सुलभ शौचालय वाले विशेष अनुकूलित कमरे।`
    },
    {
        keywords: ['contact', 'phone number', 'mobile number', 'email id', 'email address', 'office address', 'director', 'aith', 'aitd', 'website', 'director room', 'director\'s room', 'director office', 'director\'s office'],
        english: `### Contact & Office Details:\n- **Address**: Awadhpuri (Opposite Rama Dental College), Kanpur, Uttar Pradesh, 208024.\n- **Phone Number**: 0512-2583221.\n- **Email**: director@aith.ac.in, info@aith.ac.in.\n- **Website**: aitd.ac.in (or aith.ac.in).\n- **Director's Office**: Located in the Main Academic Building (Director's Office room).\n- **Administrative Block HODs**: Administrative Block HOD and director offices are located here.\n- **CSE/IT Department HOD**: Dr. Shrinath Dwivedi (Office located in F-Block (CSE & IT)).`,
        hindi: `### संपर्क और कार्यालय विवरण:\n- **पता**: अवधपुरी (रामा डेंटल कॉलेज के सामने), कानपुर, उत्तर प्रदेश, 208024।\n- **फोन नंबर**: 0512-2583221।\n- **ईमेल**: director@aith.ac.in, info@aith.ac.in।\n- **वेबसाइट**: aitd.ac.in या aith.ac.in।\n- **निदेशक कार्यालय**: Main Academic Building में Director's Office (निदेशक कार्यालय) के रूप में स्थित है।\n- **प्रशासनिक कार्यालय**: Administrative Block में विभिन्न प्रशासनिक विभाग और डायरेक्टर ऑफिस हैं।\n- **CSE/IT विभाग HOD**: डॉ. श्रीनाथ द्विवेदी (कार्यालय F-Block (CSE & IT) में स्थित है)।`
    }
];

// Local rule-based fallback responder for AI Chat
function getLocalFallbackResponse(query) {
    const lowerQuery = query.toLowerCase().trim();
    const useHindi = isHindi(query);
    
    // 1. Handle Greetings
    const greetings = ['hi', 'hello', 'hey', 'namaste', 'helo', 'hlo', 'नमस्ते', 'helo', 'hii', 'hiii', 'listen', 'bhai', 'listen bhai'];
    if (greetings.includes(lowerQuery) || lowerQuery === 'hi sarathi' || lowerQuery === 'hello sarathi' || lowerQuery.startsWith('hi ') || lowerQuery.startsWith('hello ')) {
        if (useHindi) {
            return `नमस्ते! मैं **सारथी (Sarathi)** हूँ, AITD कैंपस का AI सहायक। ♿ 🧭\n\nमैं आपको AITD कैंपस के रास्तों, हॉस्टल, लैब, दिव्यांग सुविधाओं (accessibility), फीस संरचना और स्कॉलरशिप के बारे में जानकारी दे सकता हूँ।\n\nआप मुझसे कुछ भी पूछ सकते हैं, जैसे:\n- "Fees kitni hai?"\n- "Divyangjan hostel kaha hai?"\n- "CSE Department ka HOD kaun hai?"\n- "Scribe rules kya hai?"`;
        } else {
            return `Hello! I am **Sarathi**, the AI Assistant of AITD Campus. ♿ 🧭\n\nI can assist you with campus routes, hostels, labs, accessibility facilities, fee structure, and scholarships.\n\nFeel free to ask me anything, such as:\n- "What is the fee structure?"\n- "Where is the Divyangjan hostel?"\n- "Who is the HOD of CSE?"\n- "What are the scribe rules?"`;
        }
    }

    // 2. Try Predefined Facts Matching first (skip for HOD/faculty specific queries to let RAG handle it)
    const isFacultyQuery = containsWord(lowerQuery, 'hod') || 
                           containsWord(lowerQuery, 'head') || 
                           containsWord(lowerQuery, 'director') || 
                           containsWord(lowerQuery, 'dean') ||
                           containsWord(lowerQuery, 'coordinator') ||
                           containsWord(lowerQuery, 'faculty') ||
                           containsWord(lowerQuery, 'teacher') ||
                           containsWord(lowerQuery, 'professor');

    if (!isFacultyQuery) {
        for (const fact of localFacts) {
            const matched = fact.keywords.some(kw => containsWord(lowerQuery, kw));
            if (matched) {
                if (useHindi) {
                    return `AITD लोकल डेटाबेस के अनुसार:\n\n${fact.hindi}\n\nयदि आप ऊपर दी गई जानकारी से संबंधित किसी स्थान पर जाना चाहते हैं, तो नीचे दिए गए 'Find Route' बटन का उपयोग कर सकते हैं। 👇`;
                } else {
                    return `According to AITD local database:\n\n${fact.english}\n\nIf you want to view the route to any location mentioned above, please use the 'Find Route' button below. 👇`;
                }
            }
        }
    }

    // 3. RAG/Knowledge Search
    const retrievedKnowledge = searchLocalKnowledge(query);
    if (retrievedKnowledge) {
        let response = useHindi ? `AITD डेटाबेस के अनुसार:\n\n` : `According to the AITD database:\n\n`;
        
        const parts = retrievedKnowledge.split("\n\n---\n\n");
        parts.forEach(part => {
            const formattedPart = part.replace(/===\s*(.*?)\s*===/g, '### $1');
            response += formattedPart + "\n\n";
        });
        
        response += useHindi 
            ? `यदि आप ऊपर दी गई जानकारी से संबंधित किसी स्थान पर जाना चाहते हैं, तो नीचे दिए गए 'Find Route' बटन का उपयोग कर सकते हैं। 👇`
            : `If you want to view the route to any location mentioned above, please use the 'Find Route' button below. 👇`;
        return response;
    }

    // 4. Specific Location Match with tags support
    const locations = getLocationsContext();
    const matchedLocs = [];
    const genericBlocklist = ['lab', 'room', 'gate', 'road', 'path', 'dept', 'department', 'block', 'hostel', 'campus', 'building', 'office', 'entrance', 'exit', 'sports', 'game', 'play', 'ground', 'court', 'auditorium', 'centre', 'stage', 'main', 'landmark', 'milestone'];

    for (const loc of locations) {
        const name = loc.name.toLowerCase();
        const disp = (loc.displayName || "").toLowerCase();
        
        let isMatch = containsWord(lowerQuery, name) || (disp && containsWord(lowerQuery, disp));
        
        if (!isMatch && loc.description) {
            const tags = loc.description.split(',').map(t => t.trim().toLowerCase());
            for (const tag of tags) {
                if (tag.length > 3 && !genericBlocklist.includes(tag) && containsWord(lowerQuery, tag)) {
                    isMatch = true;
                    break;
                }
            }
        }
        
        if (isMatch) {
            matchedLocs.push(loc);
        }
    }
    
    if (matchedLocs.length > 0) {
        const loc = matchedLocs[0];
        if (useHindi) {
            let response = `AITD कैंपस में **${loc.displayName}** उपलब्ध है। `;
            if (loc.category) {
                response += `यह **${loc.category}** श्रेणी में आता है। `;
            }
            response += `\n\nमैंने आपके नेविगेशन के लिए नीचे बटन जोड़ दिया है। आप उस पर क्लिक करके सीधा मार्ग देख सकते हैं!`;
            return response;
        } else {
            let response = `**${loc.displayName}** is available on the AITD campus. `;
            if (loc.category) {
                response += `It belongs to the **${loc.category}** category. `;
            }
            response += `\n\nI have added a button below for your navigation. Click it to view the route!`;
            return response;
        }
    }

    // 5. Default Fallback response
    if (useHindi) {
        return `नमस्ते! मैं AITD कैंपस से जुड़ी जानकारी और दिव्यांग सहायता के लिए उपलब्ध हूँ। आपके प्रश्न के बारे में मुझे विशिष्ट विवरण नहीं मिला, लेकिन आप इनसे संबंधित कुछ भी पूछ सकते हैं:\n\n1. **AITD B.Tech Fees**: फीस संरचना, हॉस्टल फ़ीस।\n2. **Departments**: CSE, IT, Electronics, Chemical, Paint Tech आदि।\n3. **Divyangjan Features**: Ramps, Lifts, Scribe Rules, Divyangjan Hostel.\n4. **Contacts**: फ़ोन नंबर, ईमेल और पता।\n\nआप नीचे दिए गए मैप पर भी किसी भी स्थान का मार्ग देख सकते हैं!`;
    } else {
        return `Hello! I am here to help with AITD campus details and accessibility support. I couldn't find specific information for your question, but feel free to ask about:\n\n1. **AITD B.Tech Fees**: fee structure, hostel fees.\n2. **Departments**: CSE, IT, Electronics, Chemical, Paint Tech, etc.\n3. **Divyangjan Features**: ramps, lifts, scribe rules, Divyangjan hostel.\n4. **Contacts**: phone numbers, email, and address.\n\nYou can also find the route to any place using the map below!`;
    }
}

// API endpoint for Chat
app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;
    console.log(`[Chat Endpoint] Incoming message: "${message}"`);
    
    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    // Helper function to stream fallback response to client
    const streamFallback = async (query) => {
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
        }
        const fallbackText = getLocalFallbackResponse(query);
        const chunkSize = 4;
        for (let i = 0; i < fallbackText.length; i += chunkSize) {
            const chunkText = fallbackText.substring(i, i + chunkSize);
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            await new Promise(resolve => setTimeout(resolve, 20));
        }
        res.write("event: end\ndata: [DONE]\n\n");
        res.end();
    };

    if (!genAI) {
        console.log("[Chat Endpoint] genAI not configured. Using streaming local fallback.");
        return await streamFallback(message);
    }

    try {
        const locations = getLocationsContext();
        
        // Run Local RAG Retrieval
        const retrievedKnowledge = searchLocalKnowledge(message);
        let ragContextInstruction = "";
        
        if (retrievedKnowledge) {
            ragContextInstruction = `
Use the following retrieved institutional guidelines and details to answer the user's questions accurately (especially about fees, rules, departments, or guidelines):
---
${retrievedKnowledge}
---
Always rely on the retrieved info above first before generating answers. If the information is not present in the text above, answer standardly.
`;
        }

        // Define system instructions with strict personality and guardrails
        const systemInstruction = `
You are "सारथी (Sarathi)", a sensitive, helpful, and resourceful AI assistant for Dr. Ambedkar Institute of Technology for Divyangjan (AITD), Kanpur.
You are specifically designed to address and solve issues for physically challenged (Divyangjan) students and visitors.

#Behavior Rule & Guardrails
You MUST ONLY answer questions that are related to:
- Assistance and support for disabled students (Divyangjan assistance)
- College life, facilities, and departments of AITD Kanpur
- Student welfare and scholarship schemes

If the user asks any question outside of these topics (for example: politics, entertainment, coding/programming, history, general math, science, or general QA not related to AITD/Divyangjan), you MUST politely refuse and reply EXACTLY:
“क्षमा करें 🙏, मैं केवल AITD Kanpur और दिव्यांग सहायता से जुड़ी जानकारी प्रदान करने के लिए प्रशिक्षित हूँ।”

Do not add any other explanations or words when declining.

#Tone
Always remain extremely polite, respectful, cooperative, and supportive. Ensure students feel reassured and guided correctly. Use appropriate emojis to make responses clean and accessible.

#Goal
Support AITD Kanpur's disabled students with guidance about education, accessibility amenities, navigation routes, and government support schemes.

#Knowledge & Context
- AITD Campus Locations: ${JSON.stringify(locations)}
${ragContextInstruction}

#Language Preference
You MUST detect the language of the user's query. If the user asks in Hindi or Hinglish, respond in Hindi (Devanagari script) or Hinglish as appropriate. If the user asks in English, respond in English. Always match the user's preferred language.

#Execution Priority:
1. If the query is outside the AITD/Divyangjan scope, trigger the Guardrail Decline phrase immediately.
2. If the query is within scope, check the retrieved RAG context. If the answer is in the context, rely on it first.
3. If the query is within scope but not in the local RAG context, use your general knowledge about AITD Kanpur and educational guidelines to provide a helpful answer. Do NOT decline.

Keep responses direct and get straight to the point. Do not write long greeting headers in every reply.
`;

        // Format history for new @google/genai SDK
        const formattedContents = [];

        // Add history messages
        for (const msg of (history || [])) {
            formattedContents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            });
        }

        // Add current user message
        formattedContents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        const resultStream = await genAI.models.generateContentStream({
            model: 'gemini-2.0-flash-lite',
            contents: formattedContents,
            config: {
                maxOutputTokens: 2000,
                systemInstruction: systemInstruction,
                tools: [{ googleSearch: {} }]
            }
        });

        for await (const chunk of resultStream) {
            const chunkText = chunk.text;
            if (chunkText) {
                // Send chunk formatted as SSE event data
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }

        // Signal stream completion using standard SSE [DONE] message
        res.write("event: end\ndata: [DONE]\n\n");
        res.end();

    } catch (error) {
        console.error("Gemini API Streaming Error:", error);
        console.log("Falling back to local fallback stream...");
        try {
            await streamFallback(message);
        } catch (fallbackErr) {
            console.error("Fallback streaming failed:", fallbackErr);
            if (!res.headersSent) {
                res.status(500).json({ error: "Failed to communicate with AI model and fallback failed." });
            }
            res.end();
        }
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
