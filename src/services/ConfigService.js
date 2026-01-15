import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

// REPLACE THIS WITH YOUR ACTUAL GITHUB RAW URL
const VERSION_JSON_URL = 'https://raw.githubusercontent.com/taptapcreate/ai-notes-app-version/main/version.json';

const getAppVersion = () => {
    return Constants.expoConfig?.version || '1.0.0';
};

const parseVersion = (version) => {
    return version.split('.').map(Number);
};

const isUpdateNeeded = (currentVersion, latestVersion) => {
    const current = parseVersion(currentVersion);
    const latest = parseVersion(latestVersion);

    for (let i = 0; i < latest.length; i++) {
        if (latest[i] > (current[i] || 0)) return true;
        if (latest[i] < (current[i] || 0)) return false;
    }
    return false;
};

export const fetchAppConfig = async () => {
    try {
        const response = await fetch(VERSION_JSON_URL, {
            headers: {
                'Cache-Control': 'no-cache' // Prevent caching
            }
        });

        if (!response.ok) throw new Error('Failed to fetch config');

        const data = await response.json();
        const platformData = Platform.select({
            ios: data.ios,
            android: data.android
        });

        if (!platformData) return null;

        const currentVersion = getAppVersion();
        const updateAvailable = isUpdateNeeded(currentVersion, platformData.latestVersion);

        return {
            ...platformData,
            currentVersion,
            updateAvailable,
            storeName: Platform.select({ ios: 'App Store', android: 'Play Store' })
        };
    } catch (error) {
        console.warn('Config fetch error:', error);
        return null; // Fail silently, app continues to work with defaults
    }
};

export const openStore = (url) => {
    if (url) Linking.openURL(url);
};
