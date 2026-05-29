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

const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.post('/api/assistant/analyze-timetable', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image provided" });
        }

        const base64Image = req.file.buffer.toString('base64');

        const PROMPT = `You are an expert AI system designed to extract scheduling information from university timetable images and output the result strictly in JSON.

IMPORTANT: If the provided image is NOT a timetable or schedule, you must return EXACTLY this JSON:
{
  "error": "Not a timetable"
}

If it IS a timetable, extract all classes/events. The image is a grid where rows are days of the week and columns are time slots. Look for text in the cells. The text often contains the class name (e.g., SCSE1013, SMJM1023), section (e.g., SEC 15), type (e.g., Lecture, LAB), and location. Map each occupied cell to its corresponding day and time.

Also check for a header indicating who the timetable is for:
- If it says "TIMETABLE FOR LECTURER : <NAME>", set "target_type" to "Lecturer" and "target_name" to the extracted <NAME>.
- If it says "TIMETABLE FOR STUDENT GROUP : <SECTION>", set "target_type" to "Section Class" and "target_name" to the extracted <SECTION>.
- If you cannot find this information, leave them as empty strings.

Format the extracted data into the following exact JSON schema:
{
  "target_type": "Lecturer" | "Section Class" | "",
  "target_name": "<Extracted name or section>",
  "weekly_recurring": [
    {
      "day_of_week": <Number 1-7, where 1 is Monday and 7 is Sunday>,
      "day_name": "<Day string>",
      "slots": [
        {
          "start_time": "<HH:MM in 24-hour format>",
          "end_time": "<HH:MM in 24-hour format>",
          "label": "<Combine class code, section, type, and location. Example: SCSE1013 (L) SEC 15 PROG. LAB>",
          "is_blocking": true
        }
      ]
    }
  ],
  "specific_events": []
}

Rules:
1. Return ONLY the JSON object. Do not include markdown blocks (\`\`\`json), greetings, or explanations.
2. Group slots correctly by day_of_week.
3. Ensure times are parsed cleanly (e.g. 14:00, not 2 PM).
`;

        const ollamaPayload = {
            model: "gemma4:latest", // Will use gemma4 as requested, or replace with a vision model if needed
            stream: false,
            messages: [
                {
                    role: "user",
                    content: PROMPT,
                    images: [base64Image]
                }
            ]
        };

        const ollamaResponse = await axios.post('http://localhost:11434/api/chat', ollamaPayload);
        let reply = ollamaResponse.data.message.content;

        // Clean up possible markdown tags if the model still includes them
        if (reply.startsWith('\`\`\`json')) {
            reply = reply.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
        } else if (reply.startsWith('\`\`\`')) {
            reply = reply.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
        }

        let parsedJson;
        try {
            parsedJson = JSON.parse(reply);
        } catch (e) {
            console.error("Failed to parse JSON from AI response:", reply);
            return res.status(500).json({ success: false, error: "AI output was not valid JSON." });
        }

        if (parsedJson.error === "Not a timetable") {
            return res.status(400).json({ success: false, error: "The provided image does not appear to be a valid timetable." });
        }

        res.status(200).json({
            success: true,
            data: parsedJson
        });

    } catch (error) {
        console.error("AI Backend Error (analyze-timetable):", error.message);
        res.status(500).json({ success: false, error: "AI Assistant is currently unavailable for image processing." });
    }
});

module.exports = router;
