import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables for local testing
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize the server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// API Route: AI-powered Swedish Speaking and Correction Engine
app.post('/api/practice/chat', async (req, res) => {
  try {
    const { scenarioId, scenarioTitle, scenarioGreeting, messages } = req.body;

    if (!ai) {
      return res.status(500).json({
        error: 'Gemini API is not configured on the server. Please check your credentials in Secrets.',
      });
    }

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Message history is required' });
    }

    // Format chat history to send to Gemini
    const formattedHistory = messages.map((m: { role: string; content: string }) => {
      return `${m.role === 'user' ? 'User (Student)' : 'AI (Svenska Assistant)'}: ${m.content}`;
    }).join('\n');

    const systemInstruction = `You are a warm, supportive, and experienced Swedish language coach (Svenska lärare).
The user is practicing conversational Swedish in a simulated real-life scenario: "${scenarioTitle}".
Your task is twofold:
1. Review the user's latest message for spelling, Swedish grammar, verb forms, noun gender (en/ett), word ordering (V2 rule), or natural phrasing.
2. Formulate the next helpful, conversational response in natural Swedish to keep the simulation flowing. Keep your Swedish responses simple, clear, and age-and-level appropriate so the student can understand.

You MUST respond strictly with a JSON object matching the requested schema.`;

    const prompt = `Here is the current conversation history in Swedish:
${formattedHistory}

Analyze the user's last Swedish message: "${messages[messages.length - 1].content}".
Ensure you evaluate if any grammatical rules were violated (e.g. en vs ett, verb conjugations like "jag dricker", or wrong subordinate clause word order).

Generate a response containing:
- aiSwedishResponse: The next reply in Swedish in-character. Keep it under 3 sentences, conversational, and ending with an engaging question.
- aiEnglishTranslation: The English translation of your Swedish reply.
- userSwedishCorrection: If the user made errors, provide a grammatically correct version of their Swedish sentence. If perfect, return an empty string.
- userHasErrors: Boolean indicating if there was any notable error (grammar, bad choice of word, spelling).
- userFeedbackExplanation: A kind, brief constructive explanation in English explaining mistakes or suggestions. If perfect, praise them in Swedish.
- vocabTips: An array of 1-2 practical Swedish vocabulary items, verbs, or expressions related directly to the theme "${scenarioTitle}" that they can use. Include Swedish, English, and a one-sentence definition/example.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aiSwedishResponse: {
              type: Type.STRING,
              description: 'The assistant\'s next response in simple Swedish to keep the roleplay scenario engaging.',
            },
            aiEnglishTranslation: {
              type: Type.STRING,
              description: 'English translation of the assistant\'s Swedish response.',
            },
            userSwedishCorrection: {
              type: Type.STRING,
              description: 'The corrected Swedish version of the user\'s last message, or empty if it was perfect.',
            },
            userHasErrors: {
              type: Type.BOOLEAN,
              description: 'True if the user\'s last message had any grammar, spelling, or word order mistakes.',
            },
            userFeedbackExplanation: {
              type: Type.STRING,
              description: 'Constructive coaching feedback in English explaining the user\'s Swedish mistakes or praising their Swedish.',
            },
            vocabTips: {
              type: Type.ARRAY,
              description: '1 to 2 key Swedish vocabulary words or idioms relevant to the scenario.',
              items: {
                type: Type.OBJECT,
                properties: {
                  Swedish: { type: Type.STRING, description: 'The Swedish word or phrase, e.g. "bjuda"' },
                  English: { type: Type.STRING, description: 'English translation, e.g. "to treat/invite"' },
                  definition: { type: Type.STRING, description: 'Short usage example in Swedish with Swedish/English context.' },
                },
                required: ['Swedish', 'English', 'definition'],
              },
            },
          },
          required: [
            'aiSwedishResponse',
            'aiEnglishTranslation',
            'userSwedishCorrection',
            'userHasErrors',
            'userFeedbackExplanation',
            'vocabTips',
          ],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response received from Gemini API');
    }

    const jsonParsed = JSON.parse(resultText.trim());
    return res.json(jsonParsed);
  } catch (error: any) {
    console.error('Error in chat processing:', error);
    return res.status(500).json({
      error: 'Failed to process conversation helper',
      details: error.message || error,
    });
  }
});

// API Route: Generate extra grammar rules or general explanations via AI if requested
app.post('/api/grammar/explain', async (req, res) => {
  try {
    const { topic, context } = req.body;

    if (!ai) {
      return res.status(500).json({
        error: 'Gemini API not configured. Correct rules cannot be generated right now.',
      });
    }

    const prompt = `Give a short, friendly, and visual explanation of Swedish Grammar: "${topic}".
Extra context/sentence shown: "${context}".
Break it down with:
1. The Core Rule (explained simply in English in 2-3 sentences)
2. 3 Clear Swedish Examples with active highlight and English translations.
3. A "Quick Pro Tip" for English speaker learners.
Format using clean Markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    return res.json({ explanation: response.text });
  } catch (error: any) {
    console.error('Error generating grammar explanation:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Swedish Learning server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
