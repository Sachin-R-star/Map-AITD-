const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
        const words = query.toLowerCase().split(/[\s,.\?\!]+/).filter(w => w.length > 2);
        
        for (const section of sections) {
            const cleanSection = section.trim();
            if (!cleanSection) continue;
            
            const lowerSection = cleanSection.toLowerCase();
            let score = 0;
            
            // Simple keyword match scoring
            for (const word of words) {
                if (lowerSection.includes(word)) {
                    score += 1;
                    // Boost score if keyword matches section header lines
                    if (lowerSection.split('\n')[0].includes(word)) {
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
    genAI = new GoogleGenerativeAI(apiKey);
} else {
    console.warn("WARNING: GEMINI_API_KEY is not defined. AI Chatbot will run in mock mode.");
}

// API endpoint for Chat
app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;
    console.log(`[Chat Endpoint] Incoming message: "${message}"`);
    
    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    if (!genAI) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.write("नमस्ते! मैं सारथी हूँ, AITD कैंपस का AI सहायक। सर्वर पर GEMINI_API_KEY कॉन्फ़िगर नहीं है, इसलिए मैं अभी डेमो मोड में हूँ। कृपया .env फ़ाइल में अपनी कुंजी जोड़ें।");
        return res.end();
    }

    // Set headers for Server-Sent Events (SSE) and disable buffering
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

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

#Execution Priority:
1. If the query is outside the AITD/Divyangjan scope, trigger the Guardrail Decline phrase immediately.
2. If the query is within scope, check the retrieved RAG context. If the answer is in the context, rely on it first.
3. If the query is within scope but not in the local RAG context, use your general knowledge about AITD Kanpur and educational guidelines to provide a helpful answer. Do NOT decline.

Keep responses direct and get straight to the point. Do not write long greeting headers in every reply.
`;

        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite",
            systemInstruction: systemInstruction
        });

        // Format history for Gemini API
        const formattedHistory = (history || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                maxOutputTokens: 2000,
            }
        });

        const resultStream = await chat.sendMessageStream(message);
        
        for await (const chunk of resultStream.stream) {
            const chunkText = chunk.text();
            // Send chunk formatted as SSE event data
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }
        
        // Signal stream completion using standard SSE [DONE] message
        res.write("event: end\ndata: [DONE]\n\n");
        res.end();

    } catch (error) {
        console.error("Gemini API Streaming Error:", error);
        // If headers weren't sent yet, we can send a 500 status. Otherwise end the stream.
        if (!res.headersSent) {
            res.status(500).write("Failed to communicate with AI model.");
        } else {
            res.write("\n[System Error: Connection disrupted]");
        }
        res.end();
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
