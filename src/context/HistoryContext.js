import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HistoryContext = createContext();

const NOTES_STORAGE_KEY = '@saved_notes';
const REPLIES_STORAGE_KEY = '@saved_replies';
const TEMPLATE_STORAGE_KEY = '@saved_templates';
const MAX_HISTORY = 20;

export const HistoryProvider = ({ children }) => {
    const [notes, setNotes] = useState([]);
    const [replies, setReplies] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load history on mount
    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const [savedNotes, savedReplies, savedTemplates] = await Promise.all([
                AsyncStorage.getItem(NOTES_STORAGE_KEY),
                AsyncStorage.getItem(REPLIES_STORAGE_KEY),
                AsyncStorage.getItem(TEMPLATE_STORAGE_KEY),
            ]);

            if (savedNotes) setNotes(JSON.parse(savedNotes));
            if (savedReplies) setReplies(JSON.parse(savedReplies));
            if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addNote = async (note, folderId = 'general') => {
        try {
            const newNote = {
                id: Date.now().toString(),
                content: note,
                folderId: folderId,
                createdAt: new Date().toISOString(),
                type: 'note',
            };

            const updatedNotes = [newNote, ...notes].slice(0, MAX_HISTORY);
            setNotes(updatedNotes);
            await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
            return newNote;
        } catch (error) {
            console.error('Failed to save note:', error);
        }
    };

    const addReply = async (reply, options = {}) => {
        try {
            const newReply = {
                id: Date.now().toString(),
                content: reply,
                tone: options.tone || 'professional',
                style: options.style || 'short',
                format: options.format || 'email',
                createdAt: new Date().toISOString(),
                type: 'reply',
            };

            const updatedReplies = [newReply, ...replies].slice(0, MAX_HISTORY);
            setReplies(updatedReplies);
            await AsyncStorage.setItem(REPLIES_STORAGE_KEY, JSON.stringify(updatedReplies));
            return newReply;
        } catch (error) {
            console.error('Failed to save reply:', error);
        }
    };

    const addTemplate = async (content, title = 'Saved Template') => {
        try {
            const newTemplate = {
                id: Date.now().toString(),
                content,
                title,
                createdAt: new Date().toISOString(),
                type: 'template',
            };

            const updatedTemplates = [newTemplate, ...templates];
            setTemplates(updatedTemplates);
            await AsyncStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(updatedTemplates));
            return newTemplate;
        } catch (error) {
            console.error('Failed to save template:', error);
        }
    };

    const deleteNote = async (id) => {
        try {
            const updatedNotes = notes.filter(note => note.id !== id);
            setNotes(updatedNotes);
            await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
        } catch (error) {
            console.error('Failed to delete note:', error);
        }
    };

    const deleteReply = async (id) => {
        try {
            const updatedReplies = replies.filter(reply => reply.id !== id);
            setReplies(updatedReplies);
            await AsyncStorage.setItem(REPLIES_STORAGE_KEY, JSON.stringify(updatedReplies));
        } catch (error) {
            console.error('Failed to delete reply:', error);
        }
    };

    const deleteTemplate = async (id) => {
        try {
            const updatedTemplates = templates.filter(t => t.id !== id);
            setTemplates(updatedTemplates);
            await AsyncStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(updatedTemplates));
        } catch (error) {
            console.error('Failed to delete template:', error);
        }
    };

    const clearAllNotes = async () => {
        try {
            setNotes([]);
            await AsyncStorage.removeItem(NOTES_STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear notes:', error);
        }
    };

    const clearAllReplies = async () => {
        try {
            setReplies([]);
            await AsyncStorage.removeItem(REPLIES_STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear replies:', error);
        }
    };

    const clearAllHistory = async () => {
        try {
            setNotes([]);
            setReplies([]);
            setTemplates([]);
            await AsyncStorage.multiRemove([NOTES_STORAGE_KEY, REPLIES_STORAGE_KEY, TEMPLATE_STORAGE_KEY]);
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    };

    const getStats = () => {
        const today = new Date().toDateString();
        const notesToday = notes.filter(n => new Date(n.createdAt).toDateString() === today).length;
        const repliesToday = replies.filter(r => new Date(r.createdAt).toDateString() === today).length;

        return {
            totalNotes: notes.length,
            totalReplies: replies.length,
            notesToday,
            repliesToday,
        };
    };

    const getNotesByFolder = (folderId) => {
        if (!folderId) return notes;
        return notes.filter(note => note.folderId === folderId);
    };

    return (
        <HistoryContext.Provider value={{
            notes,
            replies,
            templates,
            isLoading,
            addNote,
            addReply,
            addTemplate,
            deleteNote,
            deleteReply,
            deleteTemplate,
            clearAllHistory,
            clearAllNotes,
            clearAllReplies,
            getStats,
            getNotesByFolder,
        }}>
            {children}
        </HistoryContext.Provider>
    );
};

export const useHistory = () => {
    const context = useContext(HistoryContext);
    if (!context) {
        throw new Error('useHistory must be used within a HistoryProvider');
    }
    return context;
};

export default HistoryContext;
