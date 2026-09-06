const { GoogleGenAI, Type } = require('@google/genai');
const path = require('path');

// Dynamically look one folder level up to read your active .env file
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Initialize the client using your working key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_AI_API_KEY });

const classifyTicketWithAI = async (title, description) => {
    // 1. Establish robust fallback defaults if the API rate limits or times out
    const safeFallback = {
        category: 'General',
        priority: 'MEDIUM',
        summary: 'Automatic summary generation skipped due to operational thresholds.',
        confidence: 0.50
    };

    if (!process.env.GEMINI_AI_API_KEY) {
        console.log("⚠️ Missing GEMINI_API_KEY. Activating default fallback properties.");
        return safeFallback;
    }

    try {
        const prompt = `You are an automated customer support classification routing hub.
        Analyze the incoming ticket Title and Description. Classify the issues using these exact guidelines:
        
        SLA Escalation Rules:
        - URGENT: security loops, data exposure, server down, hacker threats.
        - HIGH: duplicate transaction billing, checkout failures, refund disputes.
        - MEDIUM: interface glitch, feature bugs, slow page rendering.
        - LOW: general questions, onboarding requests, info tracking.

        Ticket Title: "${title}"
        Ticket Description: "${description}"`;

        // 2. Request a structured JSON generation using your working 3.6-flash model
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash", // 🟢 Linked your working model target here!
            contents: prompt,
            config: {
                temperature: 0.1, // Forces strict predictability
                responseMimeType: 'application/json',
                
                // Enforce strict schema constraints so it maps perfectly to our Mongoose fields
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING, enum: ['Technical', 'Billing', 'Account', 'General'] },
                        priority: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
                        summary: { type: Type.STRING, description: 'A short sentence summarizing the issue under 15 words.' },
                        confidence: { type: Type.NUMBER }
                    },
                    required: ['category', 'priority', 'summary', 'confidence'],
                },
            },
        });

        // 3. Extract and parse the clean output brackets
        return JSON.parse(response.text.trim());

    } catch (error) {
        console.error("❌ Gemini API Pipeline encountered an anomaly. Applying fallback recovery data:", error.message);
        return safeFallback;
    }
};

module.exports = { classifyTicketWithAI };
