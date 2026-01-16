import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Light tap - for small interactions (button press, toggle)
export const lightTap = () => {
    if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
};

// Medium tap - for important actions (submit, save)
export const mediumTap = () => {
    if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
};

// Heavy tap - for significant events (delete, error)
export const heavyTap = () => {
    if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
};

// Success - for completed actions (saved, copied)
export const successTap = () => {
    if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
};

// Warning - for alerts
export const warningTap = () => {
    if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
};

// Error - for failures
export const errorTap = () => {
    if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
};

// Selection change - for pickers, toggles
export const selectionTap = () => {
    if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
    }
};
