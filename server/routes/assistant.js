const express = require('express');
const axios = require('axios');
const router = express.Router();

const jwt = require('jsonwebtoken');

const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:latest';

const getOllamaRequestConfig = () => {
    const url = `${OLLAMA_BASE_URL}/api/chat`;
    const options = {
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (OLLAMA_API_KEY) {
        options.headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`;
    }
    
    return { url, options };
};
const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});
const JWT_SECRET = process.env.JWT_SECRET || "ifamous-super-secret-key-2026";

// The secret persona instruction that stays hidden on your server
const SYSTEM_PROMPT = `You are the I-FAMOUS AI Assistant, an intelligent system embedded within the Universiti Teknologi Malaysia (UTM) Final Year Project (FYP) management dashboard. Your role is to help students, coordinators, and examiners navigate schedules and understand FYP submission phases. Keep your answers concise, academic, and helpful. Do not hallucinate database records.

IMPORTANT AGENT TOOL FOR USER CREATION: If the user explicitly asks you to create a new user (or lecturer/staff/student), you must extract the details and output a JSON block at the very end of your message. 
The JSON must be exactly in this format: 
\`\`\`json
{"action": "CREATE_USER", "fullName": "<Name>", "email": "<Email>", "password": "<temp pass>", "phoneNumber": "<temp phone number>" , "affiliation": "<title>", "coOrgName": "<org>", "expertise": "<expertise>"}
\`\`\`
If you do not know a field, leave it as an empty string. You must provide a temporary password (e.g. "Temp1234!") if one is not specified.

IMPORTANT AGENT TOOL FOR SCHEDULING: If the user explicitly asks you to schedule, auto-assign, or arrange meetings, you must extract the date range, duration, and day-of-week constraints, and output a JSON block at the very end of your message.
The JSON must be exactly in this format:
\`\`\`json
{"action": "AUTO_SCHEDULE_MEETINGS", "startDate": "<YYYY-MM-DD>", "endDate": "<YYYY-MM-DD>", "duration": <Duration>, "allowedDays": [<Array of numbers 1-7, where 1 is Monday and 7 is Sunday. E.g. [2] for Tuesdays only. Default is [1,2,3,4,5] if not specified or restricted>]}
\`\`\`
If dates are not specified or are unclear, provide sensible defaults (e.g., startDate: "2026-06-28", endDate: "2026-06-30", duration: 10). Keep your responses concise.`;

router.post('/api/assistant/chat', async (req, res) => {
    try {
        // 1. Get the user's message history from the Vue frontend
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Invalid message format" });
        }

        // 1.5 Process OCR for any images in the chat history
        const Tesseract = require('tesseract.js');
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].images && messages[i].images.length > 0) {
                try {
                    const imgBuffer = Buffer.from(messages[i].images[0], 'base64');
                    const { data: { text } } = await Tesseract.recognize(imgBuffer, 'eng');

                    messages[i].content += `\n[Image OCR Text Extracted]:\n${text}\n`;
                    delete messages[i].images; // Remove image so Ollama doesn't crash
                } catch (ocrErr) {
                    console.error("OCR Error:", ocrErr);
                }
            }
        }

        // 2. Format the payload for Ollama (Injecting the System Prompt first)
        const ollamaPayload = {
            model: OLLAMA_MODEL,
            stream: false,       // We want the whole message at once, not streamed
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages      // Spread the chat history below the system prompt
            ]
        };

        // 3. Send request to cloud/local Ollama instance
        const { url, options } = getOllamaRequestConfig();
        const ollamaResponse = await axios.post(url, ollamaPayload, options);
        let replyContent = ollamaResponse.data.message.content;

        // 4. Check if the AI wants to create a user (Function Calling Simulation)
        if (replyContent.includes('"action": "CREATE_USER"')) {
            // VERIFY JWT FIRST
            const authHeader = req.headers['authorization'];
            if (!authHeader) {
                return res.status(200).json({ success: true, reply: { role: 'assistant', content: "Security Error: You are not logged in. Missing authentication token." } });
            }

            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, JWT_SECRET);

                // Security check in DB
                db.query("SELECT 1 FROM coordinator c JOIN users u ON c.user_id = u.user_id WHERE c.user_id = ? LIMIT 1", [decoded.user_id], (err, results) => {
                    if (err || results.length === 0) {
                        return res.status(200).json({ success: true, reply: { role: 'assistant', content: "Access Denied: You do not have coordinator privileges to create users." } });
                    }

                    // Extract JSON from LLM response
                    const jsonMatch = replyContent.match(/```json\s*(\{[\s\S]*?\})\s*```/);
                    if (jsonMatch) {
                        const parsedAction = JSON.parse(jsonMatch[1]);

                        // INSTEAD of creating right away, return it to the frontend for confirmation
                        return res.status(200).json({
                            success: true,
                            reply: {
                                role: 'assistant',
                                content: "I've extracted the user details. Please review and confirm below before I create the account.",
                                action: 'CONFIRM_CREATE_USER',
                                payload: parsedAction
                            }
                        });
                    } else {
                        res.status(200).json({ success: true, reply: { role: 'assistant', content: replyContent } });
                    }
                });
                return; // Wait for async DB query
            } catch (jwtErr) {
                return res.status(200).json({ success: true, reply: { role: 'assistant', content: "Security Error: Invalid or expired authentication token." } });
            }
        } else if (replyContent.includes('"action": "AUTO_SCHEDULE_MEETINGS"')) {
            // VERIFY JWT FIRST
            const authHeader = req.headers['authorization'];
            if (!authHeader) {
                return res.status(200).json({ success: true, reply: { role: 'assistant', content: "Security Error: You are not logged in. Missing authentication token." } });
            }

            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, JWT_SECRET);

                // Security check in DB
                db.query("SELECT 1 FROM coordinator c JOIN users u ON c.user_id = u.user_id WHERE c.user_id = ? LIMIT 1", [decoded.user_id], (err, results) => {
                    if (err || results.length === 0) {
                        return res.status(200).json({ success: true, reply: { role: 'assistant', content: "Access Denied: You do not have coordinator privileges to auto-schedule." } });
                    }

                    // Extract JSON from LLM response
                    const jsonMatch = replyContent.match(/```json\s*(\{[\s\S]*?\})\s*```/);
                    if (jsonMatch) {
                        const parsedAction = JSON.parse(jsonMatch[1]);

                        // Return a confirmation request to the frontend
                        return res.status(200).json({
                            success: true,
                            reply: {
                                role: 'assistant',
                                content: "I can help you auto-schedule all meetings. Please review and confirm the settings below.",
                                action: 'CONFIRM_AUTO_SCHEDULE',
                                payload: parsedAction
                            }
                        });
                    } else {
                        res.status(200).json({ success: true, reply: { role: 'assistant', content: replyContent } });
                    }
                });
                return; // Wait for async DB query
            } catch (jwtErr) {
                return res.status(200).json({ success: true, reply: { role: 'assistant', content: "Security Error: Invalid or expired authentication token." } });
            }
        } else {
            // Normal conversational reply
            res.status(200).json({
                success: true,
                reply: { role: 'assistant', content: ollamaResponse.data.message.content }
            });
        }

    } catch (error) {
        console.error("AI Backend Error:", error.message);
        res.status(500).json({ success: false, error: "AI Assistant is currently unavailable." });
    }
});

router.post('/api/assistant/execute-user-creation', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: "Missing token" });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        db.query("SELECT 1 FROM coordinator c JOIN users u ON c.user_id = u.user_id WHERE c.user_id = ? LIMIT 1", [decoded.user_id], async (err, results) => {
            if (err || results.length === 0) {
                return res.status(403).json({ error: "Access Denied: Not a coordinator." });
            }

            const { email, password, fullName, phoneNumber, coOrgName, expertise, affiliation } = req.body;

            const pepper = process.env.SECRET_PEPPER || "";
            const hashedPassword = await bcrypt.hash(password + pepper, 10);

            db.query("CALL sp_signup_normal_user(?, ?, ?, ?, ?, ?, ?)",
                [email, hashedPassword, fullName, phoneNumber || null, coOrgName, expertise, affiliation],
                (err, spResults) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ success: true, message: "User created successfully!" });
                });
        });
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
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
- If it says "TIMETABLE FOR LECTURER : <NAME>" or contains a name/email, set "target_type" to "Lecturer" and "target_name" to the extracted <NAME> or email.
- If it says "TIMETABLE FOR STUDENT GROUP : <SECTION>", set "target_type" to "Section Class" and "target_name" to the extracted <SECTION>.
- If you cannot find this information, leave them as empty strings.

Format the extracted data into the following exact JSON schema:
{
  "target_type": "Lecturer" | "Section Class" | "",
  "target_name": "<Extracted name or email or section>",
  "specific_events": [],
  "weekly_recurring": [
    {
      "day_of_week": <Number 1-7, where 1 is Monday and 7 is Sunday>,
      "day_name": "<Day string>",
      "slots": [
        {
          "start_time": "<HH:MM in 24-hour format>",
          "end_time": "<HH:MM in 24-hour format>",
          "label": "<Combine class code, section, type, and location. Example: SECJ3553-01 (L) | N28-BK2>",
          "is_blocking": true
        }
      ]
    }
  ]
}

Rules:
1. Return ONLY the JSON object. Do not include markdown blocks (\`\`\`json), greetings, or explanations.
2. Group slots correctly by day_of_week.
3. Ensure times are parsed cleanly (e.g. 14:00, not 2 PM).
`;

        const ollamaPayload = {
            model: OLLAMA_MODEL,
            stream: false,
            messages: [
                {
                    role: "user",
                    content: PROMPT,
                    images: [base64Image]
                }
            ]
        };

        const { url, options } = getOllamaRequestConfig();
        const ollamaResponse = await axios.post(url, ollamaPayload, options);
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

const Tesseract = require('tesseract.js');

// Route: Extract User Profile from Image
router.post('/api/assistant/extract-user-profile', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image provided" });
        }

        // 1. Fast OCR using Tesseract.js
        const { data: { text } } = await Tesseract.recognize(req.file.buffer, 'eng');
        console.log("OCR Extracted Text:", text);

        // 2. Pass the extracted text to Gemma for lightning-fast JSON structuring
        const PROMPT = `You are an expert AI system designed to extract user profile information from raw OCR text (from CVs, business cards, or university profile cards) and output the result strictly in JSON.

Here is the raw extracted text from the profile image:
"""
${text}
"""

Extract the following information:
1. Full Name (e.g. "TS. DR. Ali bin Abu ")
2. Email Address
3. Affiliation/Title (e.g. "Senior Lecturer")
4. Organization/Department (e.g. "ESE" or "MJIIT", "Faculty of Computing")
5. Expertise (a list of comma-separated strings representing areas of expertise)

Format the extracted data into the following exact JSON schema:
{
  "fullName": "<Extracted full name, empty string if none>",
  "email": "<Extracted email address, empty string if none>",
  "affiliation": "<Extracted title/affiliation, empty string if none>",
  "coOrgName": "<Extracted organization, empty string if none>",
  "expertise": ["<Area 1>", "<Area 2>", "..."]
}

Rules:
1. Return ONLY the JSON object. Do not include markdown blocks (\`\`\`json), greetings, or explanations.
2. If the text does not contain profile details, do your best to extract any text that fits the fields.
`;

        const ollamaPayload = {
            model: OLLAMA_MODEL,
            stream: false,
            messages: [
                {
                    role: "user",
                    content: PROMPT
                }
            ]
        };

        const { url, options } = getOllamaRequestConfig();
        const ollamaResponse = await axios.post(url, ollamaPayload, options);
        let reply = ollamaResponse.data.message.content;

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

        res.status(200).json({
            success: true,
            data: parsedJson
        });

    } catch (error) {
        console.error("AI Backend Error (extract-user-profile):", error.message);
        res.status(500).json({ success: false, error: "AI Assistant is currently unavailable for image processing." });
    }
});

module.exports = router;
