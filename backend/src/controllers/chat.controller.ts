import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { localFacts } from '../config/localFacts';
import { RagService } from '../services/rag.service';
import { env } from '../config/env';

// Detect if query is in Hindi or Hinglish
function isHindi(text: string): boolean {
  const containsDevanagari = /[\u0900-\u097F]/.test(text);
  if (containsDevanagari) return true;

  const hindiKeywords = [
    'kaha', 'kahan', 'hai', 'he', 'kaise', 'kab', 'kis', 'kitna', 'kitni',
    'kyun', 'kyon', 'ko', 'se', 'me', 'mein', 'bhai', 'batao', 'suno', 'naam',
    'kamra', 'pata', 'bata', 'shi', 'kar', 'jldi', 'kra', 'kr'
  ];
  const words = text.toLowerCase().split(/\s+/);
  return words.some(w => hindiKeywords.includes(w));
}

// Helper to check if a section contains a query word on word boundaries
function containsWord(text: string, word: string): boolean {
  const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(
    '(?:^|[^a-zA-Z0-9\\u0900-\\u097F])' +
      escapedWord +
      '(?:$|[^a-zA-Z0-9\\u0900-\\u097F])',
    'i'
  );
  return regex.test(text);
}

// Local rule-based fallback responder for AI Chat
function getLocalFallbackResponse(query: string): string {
  const lowerQuery = query.toLowerCase().trim();
  const useHindi = isHindi(query);

  // 1. Handle Greetings
  const greetings = [
    'hi', 'hello', 'hey', 'namaste', 'helo', 'hlo', 'नमस्ते', 'hii', 'hiii',
    'listen', 'bhai', 'listen bhai'
  ];
  if (
    greetings.includes(lowerQuery) ||
    lowerQuery === 'hi sarathi' ||
    lowerQuery === 'hello sarathi' ||
    lowerQuery.startsWith('hi ') ||
    lowerQuery.startsWith('hello ')
  ) {
    if (useHindi) {
      return `नमस्ते! मैं **सारथी (Sarathi)** हूँ, AITD कैंपस का AI सहायक। ♿ 🧭\n\nमैं आपको AITD कैंपस के रास्तों, हॉस्टल, लैब, दिव्यांग सुविधाओं (accessibility), फीस संरचना और स्कॉलरशिप के बारे में जानकारी दे सकता हूँ।\n\nआप मुझसे कुछ भी पूछ सकते हैं, जैसे:\n- "Fees kitni hai?"\n- "Divyangjan hostel kaha hai?"\n- "CSE Department ka HOD kaun hai?"\n- "Scribe rules kya hai?"`;
    } else {
      return `Hello! I am **Sarathi**, the AI Assistant of AITD Campus. ♿ 🧭\n\nI can assist you with campus routes, hostels, labs, accessibility facilities, fee structure, and scholarships.\n\nFeel free to ask me anything, such as:\n- "What is the fee structure?"\n- "Where is the Divyangjan hostel?"\n- "Who is the HOD of CSE?"\n- "What are the scribe rules?"`;
    }
  }

  // 2. Try Predefined Facts Matching first
  const isFacultyQuery =
    (containsWord(lowerQuery, 'dean') ||
      containsWord(lowerQuery, 'coordinator') ||
      containsWord(lowerQuery, 'faculty') ||
      containsWord(lowerQuery, 'teacher') ||
      containsWord(lowerQuery, 'professor')) &&
    !containsWord(lowerQuery, 'director') &&
    !containsWord(lowerQuery, 'hod');

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
  const retrievedKnowledge = RagService.searchLocalKnowledge(query);
  if (retrievedKnowledge) {
    let response = useHindi
      ? `AITD डेटाबेस के अनुसार:\n\n`
      : `According to the AITD database:\n\n`;

    const parts = retrievedKnowledge.split('\n\n---\n\n');
    parts.forEach(part => {
      const formattedPart = part.replace(/===\s*(.*?)\s*===/g, '### $1');
      response += formattedPart + '\n\n';
    });

    response += useHindi
      ? `यदि आप ऊपर दी गई जानकारी से संबंधित किसी स्थान पर जाना चाहते हैं, तो नीचे दिए गए 'Find Route' बटन का उपयोग कर सकते हैं। 👇`
      : `If you want to view the route to any location mentioned above, please use the 'Find Route' button below. 👇`;
    return response;
  }

  // 4. Default Fallback response
  if (useHindi) {
    return `नमस्ते! मैं AITD कैंपस से जुड़ी जानकारी और दिव्यांग सहायता के लिए उपलब्ध हूँ। आपके प्रश्न के बारे में मुझे विशिष्ट विवरण नहीं मिला, लेकिन आप इनसे संबंधित कुछ भी पूछ सकते हैं:\n\n1. **AITD B.Tech Fees**: फीस संरचना, हॉस्टल फ़ीस।\n2. **Departments**: CSE, IT, Electronics, Chemical, Paint Tech आदि।\n3. **Divyangjan Features**: Ramps, Lifts, Scribe Rules, Divyangjan Hostel.\n4. **Contacts**: फ़ोन नंबर, ईमेल और पता।\n\nआप नीचे दिए गए मैप पर भी किसी भी स्थान का मार्ग देख सकते हैं!`;
  } else {
    return `Hello! I am here to help with AITD campus details and accessibility support. I couldn't find specific information for your question, but feel free to ask about:\n\n1. **AITD B.Tech Fees**: fee structure, hostel fees.\n2. **Departments**: CSE, IT, Electronics, Chemical, Paint Tech, etc.\n3. **Divyangjan Features**: ramps, lifts, scribe rules, Divyangjan hostel.\n4. **Contacts**: phone numbers, email, and address.\n\nYou can also find the route to any place using the map below!`;
  }
}

// Chat validation Schema
export const chatQuerySchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message is required'),
    history: z
      .array(
        z.object({
          role: z.enum(['user', 'model', 'assistant']),
          text: z.string()
        })
      )
      .optional()
  })
});

export const handleChatQuery = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { message, history } = req.body;

  // Setup Server-Sent Events headers for response streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const streamFallback = async (query: string): Promise<void> => {
    const fallbackText = getLocalFallbackResponse(query);
    const chunkSize = 4;
    for (let i = 0; i < fallbackText.length; i += chunkSize) {
      const chunkText = fallbackText.substring(i, i + chunkSize);
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    res.write('event: end\ndata: [DONE]\n\n');
    res.end();
  };

  const hasGroq = !!env.GROQ_API_KEY;
  const genAI = RagService.getGenAI();

  if (!genAI && !hasGroq) {
    console.log('[Chat Controller] Offline fallback triggered (no API keys)');
    return await streamFallback(message);
  }

  try {
    const retrievedKnowledge = await RagService.searchVectorKnowledge(message);
    let ragContextInstruction = '';

    if (retrievedKnowledge) {
      ragContextInstruction = `
Use the following retrieved institutional guidelines and details to answer the user's questions accurately (especially about fees, rules, departments, or guidelines):
---
${retrievedKnowledge}
---
Always rely on the retrieved info above first before generating answers. If the information is not present in the text above, answer standardly.
`;
    }

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
${ragContextInstruction}

#Language Preference
You MUST detect the language of the user's query. If the user asks in Hindi or Hinglish, respond in Hindi (Devanagari script) or Hinglish as appropriate. If the user asks in English, respond in English. Always match the user's preferred language.

#Execution Priority:
1. If the query is outside the AITD/Divyangjan scope, trigger the Guardrail Decline phrase immediately.
2. If the query is within scope, check the retrieved RAG context. If the answer is in the context, rely on it first.
3. If the query is within scope but not in the local RAG context, you MUST use the googleSearch tool (Google Search grounding) to search online for real-time, updated details about AITD Kanpur/AITH (placements, placement cell, admission schedules, canteen, library, timing, news, etc.) and provide a helpful, comprehensive, and accurate answer based on the search results. Do NOT decline or state that you know nothing about it.

Keep responses direct and get straight to the point. Do not write long greeting headers in every reply.
`;

    // 1. Try Groq API first if configured
    if (hasGroq) {
      console.log('[Chat Controller] Routing query to Groq Llama-3.3...');
      try {
        const groqHistory = [];
        for (const msg of history || []) {
          groqHistory.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.text
          });
        }
        groqHistory.push({
          role: 'user',
          content: message
        });

        const response = await fetch(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.GROQ_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [
                { role: 'system', content: systemInstruction },
                ...groqHistory
              ],
              max_tokens: 2000,
              stream: true
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Groq API Error: ${response.status}`);
        }

        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        if (response.body) {
          for await (const chunk of response.body as any) {
            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const cleanLine = line.trim();
              if (!cleanLine || cleanLine === 'data: [DONE]') continue;

              if (cleanLine.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(cleanLine.substring(6));
                  const chunkText = parsed.choices?.[0]?.delta?.content || '';
                  if (chunkText) {
                    res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
                  }
                } catch (e) {}
              }
            }
          }
        }

        res.write('event: end\ndata: [DONE]\n\n');
        res.end();
        return;
      } catch (err) {
        console.error('Groq call in controller failed:', err);
      }
    }

    // 2. Try Gemini API fallback
    if (genAI) {
      console.log('[Chat Controller] Routing query to Gemini API...');
      const formattedContents = [];
      for (const msg of history || []) {
        formattedContents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
      formattedContents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const resultStream = await genAI.models.generateContentStream({
        model: 'gemini-2.0-flash-lite',
        contents: formattedContents as any,
        config: {
          maxOutputTokens: 2000,
          systemInstruction: systemInstruction,
          tools: [{ googleSearch: {} }]
        }
      });

      for await (const chunk of resultStream) {
        const chunkText = chunk.text;
        if (chunkText) {
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }
      }

      res.write('event: end\ndata: [DONE]\n\n');
      res.end();
      return;
    }

    // 3. Last fallback (local offline)
    await streamFallback(message);
  } catch (error) {
    console.error('[Chat Controller] AI query failed, falling back:', error);
    await streamFallback(message);
  }
};
export default handleChatQuery;
