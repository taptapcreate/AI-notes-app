import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FoldersContext = createContext();

const FOLDERS_STORAGE_KEY = '@saved_folders';

// Default folders
const DEFAULT_FOLDERS = [
    { id: 'general', name: 'General', icon: 'folder-outline', color: '#6366F1' },
    { id: 'work', name: 'Work', icon: 'briefcase-outline', color: '#F59E0B' },
    { id: 'personal', name: 'Personal', icon: 'person-outline', color: '#10B981' },
    { id: 'study', name: 'Study', icon: 'school-outline', color: '#EC4899' },
];

export const FoldersProvider = ({ children }) => {
    const [folders, setFolders] = useState(DEFAULT_FOLDERS);
    const [isLoading, setIsLoading] = useState(true);

    // Load folders on mount
    useEffect(() => {
        loadFolders();
    }, []);

    const loadFolders = async () => {
        try {
            const savedFolders = await AsyncStorage.getItem(FOLDERS_STORAGE_KEY);
            if (savedFolders) {
                setFolders(JSON.parse(savedFolders));
            } else {
                // Initialize with default folders
                await AsyncStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(DEFAULT_FOLDERS));
            }
        } catch (error) {
            console.error('Failed to load folders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addFolder = async (name, icon = 'folder-outline', color = '#6366F1') => {
        try {
            const newFolder = {
                id: `folder_${Date.now()}`,
                name,
                icon,
                color,
            };

            const updatedFolders = [...folders, newFolder];
            setFolders(updatedFolders);
            await AsyncStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(updatedFolders));
            return newFolder;
        } catch (error) {
            console.error('Failed to add folder:', error);
        }
    };

    const deleteFolder = async (id) => {
        try {
            // Don't delete default "general" folder
            if (id === 'general') return;

            const updatedFolders = folders.filter(folder => folder.id !== id);
            setFolders(updatedFolders);
            await AsyncStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(updatedFolders));
        } catch (error) {
            console.error('Failed to delete folder:', error);
        }
    };

    const getFolder = (id) => {
        return folders.find(folder => folder.id === id) || folders[0];
    };

    return (
        <FoldersContext.Provider value={{
            folders,
            isLoading,
            addFolder,
            deleteFolder,
            getFolder,
        }}>
            {children}
        </FoldersContext.Provider>
    );
};

export const useFolders = () => {
    const context = useContext(FoldersContext);
    if (!context) {
        throw new Error('useFolders must be used within a FoldersProvider');
    }
    return context;
};

export default FoldersContext;
