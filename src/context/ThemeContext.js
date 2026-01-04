import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, LightTheme } from '../constants/Colors';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = '@app_theme';

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [isDark, setIsDark] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved theme preference
    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme !== null) {
                setIsDark(savedTheme === 'dark');
            } else {
                // Use system preference by default
                setIsDark(systemColorScheme === 'dark');
            }
        } catch (error) {
            console.error('Failed to load theme preference:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTheme = async () => {
        try {
            const newTheme = !isDark;
            setIsDark(newTheme);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    const setTheme = async (dark) => {
        try {
            setIsDark(dark);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    const colors = isDark ? DarkTheme : LightTheme;

    return (
        <ThemeContext.Provider value={{ colors, isDark, toggleTheme, setTheme, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
