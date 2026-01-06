import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Linking,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen({ navigation }) {
    const { colors, isDark, toggleTheme } = useTheme();
    const styles = createStyles(colors);

    const handleUpgrade = () => {
        navigation.navigate('Payment');
    };

    const handleRateApp = () => {
        Alert.alert('Rate App', 'This will open the app store (coming soon!)');
    };

    const handleShareApp = () => {
        Alert.alert('Share App', 'Share functionality coming soon!');
    };

    const handleContact = () => {
        Linking.openURL('mailto:support@example.com');
    };

    const handlePrivacy = () => {
        Alert.alert('Privacy Policy', 'Privacy policy coming soon!');
    };

    const SettingItem = ({ icon, iconColor, title, subtitle, onPress, rightComponent }) => (
        <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.settingIcon, { backgroundColor: `${iconColor}20` }]}>
                <Ionicons name={icon} size={22} color={iconColor} />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {rightComponent || (
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <LinearGradient colors={colors.gradientPrimary} style={styles.profileAvatar}>
                        <Ionicons name="person" size={40} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.profileName}>AI Assistant</Text>
                    <Text style={styles.profileSubtitle}>Smart Notes & Reply</Text>
                </View>

                {/* Appearance Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>APPEARANCE</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon={isDark ? "moon" : "sunny"}
                            iconColor={isDark ? "#6366F1" : "#F59E0B"}
                            title="Dark Mode"
                            subtitle={isDark ? "Currently using dark theme" : "Currently using light theme"}
                            rightComponent={
                                <Switch
                                    value={isDark}
                                    onValueChange={toggleTheme}
                                    trackColor={{ false: colors.surfaceLight, true: colors.primary }}
                                    thumbColor="#fff"
                                />
                            }
                        />
                    </View>
                </View>

                {/* General Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>GENERAL</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon="diamond"
                            iconColor="#8B5CF6"
                            title="Upgrade to Pro"
                            subtitle="Unlock unlimited features"
                            onPress={handleUpgrade}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="star"
                            iconColor="#F59E0B"
                            title="Rate App"
                            subtitle="Love the app? Rate us!"
                            onPress={handleRateApp}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="share-social"
                            iconColor="#10B981"
                            title="Share App"
                            subtitle="Share with friends"
                            onPress={handleShareApp}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="mail"
                            iconColor="#3B82F6"
                            title="Contact Us"
                            subtitle="Get help or send feedback"
                            onPress={handleContact}
                        />
                    </View>
                </View>

                {/* Legal Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>LEGAL</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon="shield-checkmark"
                            iconColor="#8B5CF6"
                            title="Privacy Policy"
                            onPress={handlePrivacy}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="document-text"
                            iconColor="#EC4899"
                            title="Terms of Service"
                            onPress={handlePrivacy}
                        />
                    </View>
                </View>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appVersion}>Version 1.0.0</Text>
                    <Text style={styles.appCopyright}>Made with ❤️</Text>
                </View>

            </ScrollView>
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 32,
        paddingTop: 10,
    },
    profileAvatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    profileName: {
        color: colors.text,
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    profileSubtitle: {
        color: colors.textSecondary,
        fontSize: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        color: colors.textMuted,
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    settingIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    settingSubtitle: {
        color: colors.textMuted,
        fontSize: 13,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: colors.glassBorder,
        marginLeft: 74,
    },
    appInfo: {
        alignItems: 'center',
        marginTop: 16,
        paddingVertical: 20,
    },
    appVersion: {
        color: colors.textMuted,
        fontSize: 14,
        marginBottom: 4,
    },
    appCopyright: {
        color: colors.textMuted,
        fontSize: 14,
    },
});
