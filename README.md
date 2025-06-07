# Health Compass

Health Compass is an innovative web application designed to enhance doctor-patient communication by providing robust audio recording, advanced transcription, and medical information extraction capabilities. This tool aims to maintain accurate medical records and improve the quality of healthcare documentation.

## Features

- 🎙️ **High-Accuracy Audio Recording**: Capture medical consultations with advanced audio processing.
- 📝 **Live & Post-Recording Transcription**: Get real-time transcription feedback, backed by highly accurate post-recording transcription using Google Cloud Speech-to-Text with specialized medical models for precise jargon recognition.
- ⏱️ **Support for Longer Consultations**: Handles audio recordings longer than 1 minute using asynchronous cloud processing.
- ⚙️ **Intelligent Text Processing**: Utilizes OpenAI to extract and structure key medical information from transcripts.
- 🔬 **Medical Terminology Validation**: Attempts to validate extracted medications (via RxNorm) and conditions (via SNOMED CT) against authoritative databases for accuracy and standardization.
- 💾 **Secure Cloud Storage**: Temporarily stores audio files in Google Cloud Storage during processing for enhanced reliability and scalability.
- 📱 Responsive design for various devices.

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express.js
- **Cloud Services**:
    - **Google Cloud Speech-to-Text (Medical)**: For highly accurate audio transcription.
    - **Google Cloud Storage**: For temporary storage of audio files for long-running transcription.
- **API Integration**: OpenAI API (GPT-3.5-turbo) for medical information extraction and structuring.
- **Medical Terminology APIs (Future Integration)**: RxNorm and SNOMED CT for medication and condition validation (requires separate API keys).
- **Real-time Live Transcription**: Web Speech API (browser-based, for immediate visual feedback).

## Prerequisites

Before you begin, ensure you have the following installed and configured:
- Node.js (v14 or higher)
- npm (Node Package Manager)
- A Google Cloud Project with:
    - **Cloud Speech-to-Text API** enabled.
    - **Google Cloud Storage API** enabled.
    - A **Google Cloud Storage bucket** for temporary audio uploads (e.g., `health_bucket1209`).
    - A **Service Account** with roles like `Cloud Speech-to-Text User` and `Storage Object Admin`.
- An OpenAI API Key.

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/chetan1209/health_compass.git
    cd health_compass
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```
    Also install Google Cloud specific libraries:
    ```bash
    npm install @google-cloud/speech @google-cloud/storage
    ```

3.  Create a `.env` file in the root directory and add your API keys and Google Cloud credentials path:
    ```
    OPENAI_API_KEY=your_openai_api_key_here
    # Path to your Google Cloud Service Account JSON key file
    GOOGLE_APPLICATION_CREDENTIALS=./health-compass-transcriber-b6e6957327e6.json 
    ```
    *(Remember to replace `health-compass-transcriber-b6e6957327e6.json` with the actual name of your downloaded JSON key file.)*

4.  Ensure your Google Cloud Storage bucket name is correctly set in `src/server/index.js` (currently `health_bucket1209`).

5.  Start the server:
    ```bash
    node src/server/index.js
    ```
    The application will be available at `http://localhost:3001`

## Usage

1.  Open the application in your web browser.
2.  Grant microphone permissions when prompted.
3.  Click the "Start Recording" button to begin the consultation. The live transcript will appear in real-time.
4.  Click "Stop Recording" when the consultation is complete.
5.  The server will process the audio, transcribe it using Google Cloud, extract information with OpenAI, and display the detailed processed information and validated terms on the page.

## Project Structure

```
health_compass/
├── public/
│   └── index.html
├── src/
│   └── server/
│       └── index.js
├── uploads/              # Temporary local storage for audio uploads
├── health-compass-transcriber-b6e6957327e6.json # Your Google Cloud Service Account Key (IGNORED by Git)
├── package.json
├── package-lock.json
├── .env                  # Environment variables (IGNORED by Git)
├── .gitignore
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

-   OpenAI for providing the API for intelligent text processing.
-   Google Cloud Platform (Speech-to-Text and Cloud Storage) for advanced audio transcription and storage.
-   Web Speech API for browser-based live speech recognition.
-   All contributors who have helped shape this project.

## Contact

For any queries or support, please open an issue in the GitHub repository. 