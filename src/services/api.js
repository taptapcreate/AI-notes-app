// API Service for connecting to backend

// Update this to your backend URL
// For local development: use your computer's IP address
// For production: your deployed server URL (e.g., https://your-app.onrender.com)
const API_BASE_URL = 'http://192.168.29.62:3000/api';

/**
 * Generate notes from various input types
 * @param {string} type - 'text', 'image', 'voice', 'pdf'
 * @param {string} content - The content or base64 data
 * @param {object} options - { noteLength: 'brief' | 'standard' | 'detailed' }
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
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate notes');
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
 * @param {object} options - { tone, style, format }
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

export default {
    generateNotes,
    generateReply,
};
