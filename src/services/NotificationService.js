/**
 * Notification Service for AI Notes App
 * Handles push notification registration and listeners
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Backend API URL
const API_BASE_URL = 'https://ai-notes-app-backend-h9r0.onrender.com/api';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Register for push notifications
 * Returns the Expo push token or null if failed
 */
export async function registerForPushNotificationsAsync() {
    let token = null;

    // Must be a physical device
    if (!Device.isDevice) {
        console.log('⚠️ Push notifications require a physical device');
        return null;
    }

    try {
        // Check existing permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Request permission if not granted
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('❌ Push notification permission denied');
            return null;
        }

        // Get Expo push token
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('✅ Expo push token:', token);

        // Android-specific channel setup
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#7C3AED',
            });
        }
    } catch (error) {
        console.error('Error getting push token:', error);
        return null;
    }

    return token;
}

/**
 * Send token to backend
 */
export async function registerTokenWithServer(token, recoveryCode = null) {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token,
                platform: Platform.OS,
                recoveryCode,
                appVersion: Constants.expoConfig?.version || '1.0.0',
            }),
        });

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error registering token with server:', error);
        return false;
    }
}

/**
 * Unregister token from backend
 */
export async function unregisterToken(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/unregister`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error unregistering token:', error);
        return false;
    }
}

/**
 * Add notification listeners
 * Returns cleanup function
 */
export function addNotificationListeners(onNotificationReceived, onNotificationResponse) {
    // Listener for notifications received while app is foregrounded
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('📬 Notification received:', notification);
        if (onNotificationReceived) {
            onNotificationReceived(notification);
        }
    });

    // Listener for when user taps on notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('👆 Notification tapped:', response);
        if (onNotificationResponse) {
            onNotificationResponse(response);
        }
    });

    // Return cleanup function
    return () => {
        receivedSubscription.remove();
        responseSubscription.remove();
    };
}

export default {
    registerForPushNotificationsAsync,
    registerTokenWithServer,
    unregisterToken,
    addNotificationListeners,
};
