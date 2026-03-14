const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// Textbee Setup (Using provided credentials)
const TEXTBEE_DEVICE_ID = process.env.TEXTBEE_DEVICE_ID || '69b04ce4317c82f2166e1692';
const TEXTBEE_API_KEY = process.env.TEXTBEE_API_KEY || '90eeea84-88a1-457e-9b9b-9fa5f7745bb6';

/**
 * Endpoint for Textbee.dev Webhook
 * Textbee sends: { "webhookEvent": "MESSAGE_RECEIVED", "message": "...", "sender": "..." }
 */
router.post('/', async (req, res) => {
    try {
        console.log('--- Textbee Webhook Received ---');
        console.log('Body:', JSON.stringify(req.body));

        const { message, sender, text, phone, body } = req.body;

        // Handle various field names (Textbee uses 'message' and 'sender')
        const incomingText = message || text || body;
        const incomingPhone = sender || phone;

        if (!incomingText || !incomingPhone) {
            console.log('Error: Missing text or sender number');
            return res.status(400).json({ status: 'error', message: 'Incomplete data' });
        }

        console.log(`Processing SMS from ${incomingPhone}: ${incomingText}`);

        // 1. Generate AI Response
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: `You are Maatri Shield AI, a medical assistant for pregnant women in rural India. 
            - Provide extremely concise health advice (max 140 characters).
            - Use simple English or common Hindi terms in English script if appropriate.
            - ALWAYS include a disclaimer to consult a doctor for emergencies.
            - Focus on maternal health: BP, sugar, symptoms, and nutrition.
            - If the query is not health-related, politely ask them to focus on health.`
        });

        const result = await model.generateContent(incomingText);
        const responseText = result.response.text();

        console.log(`AI Response for ${incomingPhone}: ${responseText}`);

        // 2. Send SMS back via Textbee API
        try {
            const textbeeUrl = `https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`;

            console.log(`Attempting to send SMS reply to ${incomingPhone}...`);
            const response = await axios.post(textbeeUrl, {
                recipients: [incomingPhone],
                message: responseText
            }, {
                headers: {
                    'x-api-key': TEXTBEE_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 8000 // 8 second timeout specifically for Textbee
            });

            console.log('Textbee API Response:', response.data);

            return res.json({
                status: 'success',
                message: 'Reply sent via Textbee',
                aiResponse: responseText
            });

        } catch (apiError) {
            console.error('Textbee API Error:', apiError.response?.data || apiError.message);
            // Even if SMS fails, we return the AI response so the system knows what it generated
            return res.status(502).json({ 
                status: 'error', 
                message: 'AI generated advice, but SMS delivery failed',
                aiResponse: responseText,
                details: apiError.message
            });
        }

    } catch (error) {
        console.error('General SMS Processing Error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

module.exports = router;
