const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Configure multer for audio file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Routes
app.post('/api/upload-audio', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file uploaded' });
        }
        
        // Here we'll add the transcription logic
        // For now, just return success
        res.json({ 
            message: 'Audio file uploaded successfully',
            filePath: req.file.path
        });
    } catch (error) {
        console.error('Error uploading audio:', error);
        res.status(500).json({ error: 'Error processing audio file' });
    }
});

app.post('/api/process-text', async (req, res) => { //chatgpt prompt to extract medical information form the trancript
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'No text provided' });
        }

        // Process the text with OpenAI
        const prompt = `Extract the following information from this medical consultation transcript:
        1. Patient details
        2. Whether it's a routine visit
        3. Type of disease/condition
        4. Current problems
        5. Prescription details
        
        Transcript: ${text}`; 

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a medical documentation assistant. Extract and structure medical information from consultation transcripts."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        res.json({ 
            processedData: completion.choices[0].message.content
        });
    } catch (error) {
        console.error('Error processing text:', error);
        res.status(500).json({ error: 'Error processing text' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 