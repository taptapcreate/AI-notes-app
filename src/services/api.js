// API Service for connecting to backend

// Production backend URL
const API_BASE_URL = 'https://ai-notes-app-backend-h9r0.onrender.com/api';
// Local backend URL for development (use your computer's IP if testing on physical device)
// const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Generate notes from various input types
 * @param {string} type - 'text', 'image', 'voice', 'pdf'
 * @param {string} content - The content or base64 data
 * @param {object} options - { noteLength, format, tone, language, isPro }
 */
export const generateNotes = async (type, content, options = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type,
                content,
                noteLength: options.noteLength || 'standard',
                format: options.format || 'bullet',
                tone: options.tone || 'professional',
                language: options.language || 'English',
                isPro: options.isPro || false,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || errorData.error || 'Failed to generate notes');
        }

        const data = await response.json();
        return data.notes;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

/**
 * Generate reply options for a message
 * @param {string} message - The message to reply to
 * @param {object} options - { tone, style, format, mode, language, isPro }
 */
export const generateReply = async (message, options) => {
    try {
        const response = await fetch(`${API_BASE_URL}/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                ...options,
                isPro: options.isPro || false,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate reply');
        }

        const data = await response.json();
        return data.replies;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

/**
 * Generate follow-up response for notes or replies
 * @param {string} context - The original generated content
 * @param {string} question - The follow-up question
 * @param {string} type - 'note' or 'reply'
 */
export const generateFollowUp = async (context, question, type = 'note') => {
    try {
        const response = await fetch(`${API_BASE_URL}/followup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                context,
                question,
                type,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || errorData.error || 'Failed to generate follow-up');
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

/**
 * Analyze sentiment of a message
 * @param {string} message - The message to analyze
 */
export const analyzeSentiment = async (message) => {
    try {
        const response = await fetch(`${API_BASE_URL}/sentiment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            throw new Error('Failed to analyze sentiment');
        }

        const data = await response.json();
        return data.sentiment;
    } catch (error) {
        console.error('API Error:', error);
        // Return a default sentiment on error
        return { type: 'neutral', emoji: '😐', label: 'Neutral' };
    }
};

/**
 * Translate text to another language
 * @param {string} text - The text to translate
 * @param {string} targetLanguage - The target language
 */
export const translateText = async (text, targetLanguage) => {
    try {
        const response = await fetch(`${API_BASE_URL}/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, targetLanguage }),
        });

        if (!response.ok) {
            throw new Error('Failed to translate');
        }

        const data = await response.json();
        return data.translatedText;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};
/**
 * Polish/fix grammar and spelling in text
 * @param {string} text - The text to polish
 * @param {string} mode - 'grammar' | 'formal' | 'casual' | 'confident'
 */
export const polishText = async (text, mode = 'grammar') => {
    try {
        const response = await fetch(`${API_BASE_URL}/polish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, mode }),
        });

        if (!response.ok) {
            throw new Error('Failed to polish text');
        }

        const data = await response.json();
        return data.polishedText;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export default {
    generateNotes,
    generateReply,
    generateFollowUp,
    analyzeSentiment,
    translateText,
    polishText,
};
