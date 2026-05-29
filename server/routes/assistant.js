const express = require('express');
const axios = require('axios');
const router = express.Router();

// The secret persona instruction that stays hidden on your server
const SYSTEM_PROMPT = `You are the I-FAMOUS AI Assistant, an intelligent system embedded within the Universiti Teknologi Malaysia (UTM) Final Year Project (FYP) management dashboard. Your role is to help students, coordinators, and examiners navigate schedules and understand FYP submission phases. Keep your answers concise, academic, and helpful. Do not hallucinate database records.`;

router.post('/api/assistant/chat', async (req, res) => {
    try {
        // 1. Get the user's message history from the Vue frontend
        const { messages } = req.body; 

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Invalid message format" });
        }

        // 2. Format the payload for Ollama (Injecting the System Prompt first)
        const ollamaPayload = {
            model: "gemma4:latest", // Updated to match your installed model tag
            stream: false,       // We want the whole message at once, not streamed
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages      // Spread the chat history below the system prompt
            ]
        };

        // 3. Send request to local Ollama instance
        const ollamaResponse = await axios.post('http://localhost:11434/api/chat', ollamaPayload);

        // 4. Send Gemma's response back to the Vue frontend
        res.status(200).json({
            success: true,
            reply: ollamaResponse.data.message
        });

    } catch (error) {
        console.error("AI Backend Error:", error.message);
        res.status(500).json({ success: false, error: "AI Assistant is currently unavailable." });
    }
});

module.exports = router;
