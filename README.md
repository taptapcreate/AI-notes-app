# AI Assistant App

An AI-powered app with two main features:
- **Smart Notes**: Extract and format notes from PDF, Image, Voice, or Text
- **Smart Reply**: Generate message replies with customizable tone, style, and format

## Setup

### Frontend (React Native / Expo)

```bash
# Install dependencies
npm install

# Start the app
npx expo start
```

### Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file with your Gemini API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start the server
npm start
```

## Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add it to `backend/.env` file

## Project Structure

```
├── App.js                 # Main app with tab navigation
├── src/
│   ├── screens/
│   │   ├── NotesScreen.js  # Smart Notes feature
│   │   └── ReplyScreen.js  # Smart Reply feature
│   ├── services/
│   │   └── api.js          # API service
│   └── constants/
│       └── Colors.js       # Theme colors
└── backend/
    ├── server.js           # Express server with Gemini
    ├── package.json
    └── .env.example        # Environment template
```
