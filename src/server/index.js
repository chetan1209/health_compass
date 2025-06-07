const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Added for file system operations
const { OpenAI } = require('openai');
const axios = require('axios');
const { SpeechClient } = require('@google-cloud/speech'); // Google Cloud Speech-to-Text
const { Storage } = require('@google-cloud/storage'); // Google Cloud Storage
require('dotenv').config();

console.log('Server starting...');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Loaded' : 'Not Loaded');
console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'Loaded' : 'Not Loaded');

const app = express();
const port = process.env.PORT || 3001;

// Configure Google Cloud Storage
const storageClient = new Storage();
const GCS_BUCKET_NAME = 'health_bucket1209'; // Your GCS bucket name

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Configure multer for audio file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure the 'uploads/' directory exists
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
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

// Initialize Google Cloud Speech-to-Text client
const speechClient = new SpeechClient();

// Medical terminology validation functions
async function validateMedication(medicationName) {
    try {
        const response = await axios.get(`https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(medicationName)}`);
        return response.data.drugGroup?.conceptGroup?.[0]?.conceptProperties || [];
    } catch (error) {
        console.error('Error validating medication:', error);
        return [];
    }
}

async function validateMedicalTerm(term) {
    try {
        const response = await axios.get(`https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/SNOMEDCT-ES/descriptions?term=${encodeURIComponent(term)}&limit=10`, {
            headers: {
                'Accept': 'application/json',
                'Accept-Language': 'en'
            }
        });
        return response.data.items || [];
    } catch (error) {
        console.error('Error validating medical term:', error);
        return [];
    }
}

// Routes
app.post('/api/upload-audio', upload.single('audio'), async (req, res) => {
    try {
        console.log('Received /api/upload-audio request.');

        if (!req.file) {
            console.error('Error: No audio file uploaded (req.file is null or undefined).');
            return res.status(400).json({ error: 'No audio file uploaded' });
        }

        const audioFilePath = req.file.path; // Local path where multer saved the file
        const gcsFileName = `audio/${path.basename(audioFilePath)}`; // Path within the bucket
        const gcsUri = `gs://${GCS_BUCKET_NAME}/${gcsFileName}`;

        console.log(`Uploading ${audioFilePath} to GCS bucket ${GCS_BUCKET_NAME}/${gcsFileName}...`);
        // Upload the audio file to Google Cloud Storage
        await storageClient.bucket(GCS_BUCKET_NAME).upload(audioFilePath, {
            destination: gcsFileName,
        });
        console.log('Audio file uploaded to GCS.');

        // Clean up the local uploaded audio file immediately
        fs.unlinkSync(audioFilePath);
        console.log('Cleaned up local uploaded audio file.');

        const request = {
            audio: {
                uri: gcsUri,
            },
            config: {
                encoding: 'WEBM_OPUS', // Ensure this matches your frontend audio format
                sampleRateHertz: 48000, // Ensure this matches your frontend audio sample rate
                languageCode: 'en-US',
                model: 'medical_conversation',
                useEnhanced: true,
            },
        };

        console.log('Sending audio to Google Cloud Speech-to-Text for long-running recognition...');
        // Perform the long-running recognition
        const [operation] = await speechClient.longRunningRecognize(request);
        console.log('Long-running recognition operation started. Waiting for completion...');
        const [response] = await operation.promise(); // Wait for the operation to complete
        console.log('Long-running recognition completed.');

        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');
        console.log('Transcription:', transcription);

        // Delete the file from GCS after transcription
        await storageClient.bucket(GCS_BUCKET_NAME).file(gcsFileName).delete();
        console.log(`Cleaned up audio file from GCS: ${gcsFileName}`);

        // OpenAI processing starts here
        console.log('Sending transcription to OpenAI for initial extraction...');
        const initialPrompt = `Extract the following information from this medical consultation transcript:\n        1. Patient details\n        2. Whether it\'s a routine visit\n        3. Type of disease/condition\n        4. Current problems\n        5. Prescription details\n        \n        Transcript: ${transcription}`;

        const initialCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a medical documentation assistant. Extract and structure medical information from consultation transcripts."
                },
                {
                    role: "user",
                    content: initialPrompt
                }
            ]
        });

        const extractedInfo = initialCompletion.choices[0].message.content;
        console.log('Extracted Info from OpenAI:', extractedInfo);

        const validationPrompt = `From the following extracted information, identify all medications and medical conditions.\n**IMPORTANT**: You must return a JSON object with two arrays: 'medications' and 'conditions'. Do NOT include any other text, explanations, or formatting outside of the JSON object.\n\nExtracted Information: ${extractedInfo}`;

        console.log('Sending extracted info to OpenAI for validation...');
        const validationCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a medical terminology expert. Extract medications and conditions from the text and return ONLY a valid JSON object."
                },
                {
                    role: "user",
                    content: validationPrompt
                }
            ]
        });

        const rawMedicalTermsContent = validationCompletion.choices[0].message.content;
        console.log('Raw content from OpenAI (for medical terms): ', rawMedicalTermsContent);

        const cleanedMedicalTermsContent = rawMedicalTermsContent.replace(/^```json\n|\n```$/g, '').trim();
        console.log('Cleaned content for JSON parsing:', cleanedMedicalTermsContent);

        const medicalTerms = JSON.parse(cleanedMedicalTermsContent);
        console.log('Parsed medical terms:', medicalTerms);

        console.log('Validating medications...');
        const validatedMedications = await Promise.all(
            medicalTerms.medications.map(async (med) => ({
                original: med,
                validated: await validateMedication(med)
            }))
        );
        console.log('Validated medications:', validatedMedications);

        console.log('Validating conditions...');
        const validatedConditions = await Promise.all(
            medicalTerms.conditions.map(async (cond) => ({
                original: cond,
                validated: await validateMedicalTerm(cond)
            }))
        );
        console.log('Validated conditions:', validatedConditions);

        res.json({
            message: 'Audio transcribed and processed successfully',
            transcription: transcription,
            processedData: extractedInfo,
            validatedTerms: {
                medications: validatedMedications,
                conditions: validatedConditions
            }
        });
        console.log('Response sent to client successfully.');

    } catch (error) {
        console.error('Error in /api/upload-audio route:', error.message);
        // Log the full error stack for more details during development
        console.error(error.stack);
        res.status(500).json({ error: 'Error processing audio file for transcription or validation' });
    }
});

// General error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        console.error('Multer error:', err.message);
        return res.status(400).json({ error: `Multer error: ${err.message}` });
    } else if (err) {
        // An unknown error occurred.
        console.error('Unhandled server error:', err.message);
        console.error(err.stack);
        return res.status(500).json({ error: 'Something broke! Please try again later.' });
    }
    next();
});

// We can remove the /api/process-text route as its logic is now integrated into /api/upload-audio
// app.post('/api/process-text', async (req, res) => { /* ... existing logic ... */ });

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 