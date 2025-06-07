# Health Compass

Health Compass is an innovative web application designed to enhance doctor-patient communication by providing real-time audio recording and transcription capabilities. This tool helps in maintaining accurate medical records and improving the quality of healthcare documentation.

## Features

- 🎙️ Real-time audio recording during doctor-patient consultations
- 📝 Live transcription of conversations using Web Speech API
- 🔄 Automatic text processing and formatting
- 💾 Secure storage of medical conversations
- 📱 Responsive design for various devices

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express.js
- **API Integration**: OpenAI API for enhanced transcription processing
- **Real-time Processing**: Web Speech API

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/chetan1209/health_compass.git
cd health_compass
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

4. Start the server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. Open the application in your web browser
2. Grant microphone permissions when prompted
3. Click the record button to start recording the consultation
4. The transcription will appear in real-time
5. Click stop when the consultation is complete
6. The transcription will be saved and can be downloaded

## Project Structure

```
health_compass/
├── public/
│   └── index.html
├── src/
│   └── server/
│       └── index.js
├── uploads/
├── package.json
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the API for enhanced transcription
- Web Speech API for real-time speech recognition
- All contributors who have helped shape this project

## Contact

For any queries or support, please open an issue in the GitHub repository. 