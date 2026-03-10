const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Use the API Key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);

/**
 * Endpoint for Android SMS Gateway
 * Expected body: { "phone": "+91...", "text": "Message content" }
 */
router.post('/', async (req, res) => {
    try {
        console.log('--- SMS Webhook Received ---');
        console.log('Body:', JSON.stringify(req.body));

        const { phone, text, message, msg, body, content, sender, from } = req.body;
        const incomingText = text || message || msg || body || content;
        const incomingPhone = phone || sender || from || 'Unknown';

        if (!incomingText) {
            console.log('Error: No message content found in body');
            return res.status(400).json({ status: 'error', message: 'No text provided' });
        }

        console.log(`Processing SMS from ${incomingPhone}: ${incomingText}`);

        // Initialize Gemini model
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: `You are Maatri Shield AI, a medical assistant for pregnant women in rural India. 
            - Provide extremely concise health advice (max 140 characters).
            - Use simple English or common Hindi terms in English script if appropriate.
            - ALWAYS include a disclaimer to consult a doctor for emergencies.
            - Focus on maternal health: BP, sugar, symptoms, and nutrition.
            - If the query is not health-related, politely ask them to focus on health.`
        });

        // Generate response
        const result = await model.generateContent(incomingText);
        const responseText = result.response.text();

        console.log(`AI Response for ${incomingPhone}: ${responseText}`);

        // Return JSON for the Android app to send the SMS
        res.json({
            status: 'success',
            replies: [
                {
                    text: responseText
                }
            ]
        });

    } catch (error) {
        console.error('SMS Processing Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            replies: [
                { text: "Sorry, I am having trouble connecting. Please consult a doctor immediately if you have an emergency." }
            ]
        });
    }
});

module.exports = router;
