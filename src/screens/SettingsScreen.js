import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Linking,
    Alert,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

export default function SettingsScreen({ navigation }) {
    const { colors, isDark, toggleTheme } = useTheme();
    const { getCreditData, recoverAccount } = useUser();
    const credits = getCreditData();
    const styles = createStyles(colors);

    // Recovery code input state
    const [showRecoveryInput, setShowRecoveryInput] = useState(false);
    const [recoveryInput, setRecoveryInput] = useState('');
    const [isRecovering, setIsRecovering] = useState(false);

    // Copy recovery code
    const handleCopyCode = async () => {
        if (credits.recoveryCode) {
            await Clipboard.setStringAsync(credits.recoveryCode);
            Alert.alert('✅ Copied!', 'Recovery code copied to clipboard. Save it somewhere safe!');
        }
    };

    // Recover account with code
    const handleRecover = async () => {
        if (!recoveryInput.trim()) {
            Alert.alert('Error', 'Please enter a recovery code');
            return;
        }

        setIsRecovering(true);
        try {
            const result = await recoverAccount(recoveryInput.trim().toUpperCase());
            if (result.success) {
                Alert.alert('✅ Success!', 'Your purchased credits have been restored!');
                setShowRecoveryInput(false);
                setRecoveryInput('');
            } else {
                Alert.alert('❌ Invalid Code', result.error || 'Please check and try again.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to recover. Please try again.');
        } finally {
            setIsRecovering(false);
        }
    };

    const handleCredits = () => {
        navigation.navigate('Credits');
    };

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
                    <Text style={styles.profileName}>AI Notes</Text>
                    <Text style={styles.profileSubtitle}>Write & Reply</Text>
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
                            icon="flash"
                            iconColor="#10B981"
                            title="Buy Credits"
                            subtitle="Top up your AI power"
                            onPress={handleCredits}
                        />
                        <View style={styles.divider} />
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

                {/* Recovery Code Section - Prominent */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>ACCOUNT RECOVERY</Text>
                    <View style={styles.recoveryCard}>
                        <View style={styles.recoveryIconContainer}>
                            <Ionicons name="key" size={32} color={colors.primary} />
                        </View>
                        <Text style={styles.recoveryTitle}>Your Recovery Code</Text>
                        <Text style={styles.recoveryDescription}>
                            Save this code to recover your purchased credits if you switch devices or reinstall the app. Free daily credits are device-specific.
                        </Text>

                        {credits.recoveryCode ? (
                            <>
                                <View style={styles.codeBox}>
                                    <Text style={styles.codeText}>{credits.recoveryCode}</Text>
                                </View>
                                <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                                    <Ionicons name="copy-outline" size={18} color="#fff" />
                                    <Text style={styles.copyButtonText}>Copy Code</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <Text style={styles.loadingText}>Loading...</Text>
                        )}

                        <View style={styles.recoveryDivider} />

                        {!showRecoveryInput ? (
                            <TouchableOpacity
                                style={styles.recoverLink}
                                onPress={() => setShowRecoveryInput(true)}
                            >
                                <Ionicons name="download-outline" size={18} color={colors.primary} />
                                <Text style={styles.recoverLinkText}>Have a code? Recover account</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.recoverInputContainer}>
                                <TextInput
                                    style={styles.recoverInput}
                                    placeholder="Enter recovery code"
                                    placeholderTextColor={colors.textMuted}
                                    value={recoveryInput}
                                    onChangeText={setRecoveryInput}
                                    autoCapitalize="characters"
                                    maxLength={10}
                                />
                                <View style={styles.recoverButtonRow}>
                                    <TouchableOpacity
                                        style={styles.recoverCancelButton}
                                        onPress={() => {
                                            setShowRecoveryInput(false);
                                            setRecoveryInput('');
                                        }}
                                    >
                                        <Text style={styles.recoverCancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.recoverButton, isRecovering && { opacity: 0.6 }]}
                                        onPress={handleRecover}
                                        disabled={isRecovering}
                                    >
                                        <Text style={styles.recoverButtonText}>
                                            {isRecovering ? 'Recovering...' : 'Recover'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
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
    // Recovery Section Styles
    recoveryCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    recoveryIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: `${colors.primary}20`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    recoveryTitle: {
        color: colors.text,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    recoveryDescription: {
        color: colors.textMuted,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    codeBox: {
        backgroundColor: colors.background,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.primary,
        borderStyle: 'dashed',
        marginBottom: 16,
    },
    codeText: {
        color: colors.text,
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: 4,
        fontFamily: 'monospace',
    },
    copyButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    copyButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    loadingText: {
        color: colors.textMuted,
        fontSize: 16,
    },
    recoveryDivider: {
        height: 1,
        backgroundColor: colors.glassBorder,
        width: '100%',
        marginVertical: 20,
    },
    recoverLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    recoverLinkText: {
        color: colors.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    recoverInputContainer: {
        width: '100%',
    },
    recoverInput: {
        backgroundColor: colors.background,
        color: colors.text,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        marginBottom: 12,
        letterSpacing: 2,
    },
    recoverButtonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    recoverCancelButton: {
        flex: 1,
        backgroundColor: colors.background,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    recoverCancelText: {
        color: colors.textMuted,
        fontSize: 15,
        fontWeight: '600',
    },
    recoverButton: {
        flex: 1,
        backgroundColor: colors.primary,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    recoverButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});
