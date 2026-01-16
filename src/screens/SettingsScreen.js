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
    Platform,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useHistory } from '../context/HistoryContext';
import { useStaggerAnimation, AnimatedSection } from '../hooks/useStaggerAnimation';

// App Version
const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '2024.1';

export default function SettingsScreen({ navigation }) {
    const { colors, isDark, toggleTheme } = useTheme();
    const { getCreditData, recoverAccount } = useUser();
    const credits = getCreditData();
    const styles = createStyles(colors);

    // Stagger animation
    const { fadeAnims, slideAnims } = useStaggerAnimation(6);

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
        const code = recoveryInput.trim();
        if (!code) {
            Alert.alert('Error', 'Please enter a recovery code');
            return;
        }

        const previousCode = credits.recoveryCode;

        const performRecovery = async () => {
            setIsRecovering(true);
            try {
                const result = await recoverAccount(code.toUpperCase());
                if (result.success) {
                    const title = result.message.includes('Already using') ? 'Info' : '✅ Success!';
                    // Show previous code in success message for safety
                    const safetyMessage = previousCode && previousCode !== result.recoveryCode
                        ? `\n\n📝 IMPORTANT: Your PREVIOUS code was:\n${previousCode}\n\nSave this if you need to switch back!`
                        : '';

                    Alert.alert(title, (result.message || 'Account restored!') + safetyMessage);
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

        // If user has credits, warn them before switching
        if (credits.purchasedCredits > 0) {
            Alert.alert(
                '⚠️ Warning: Account Switch',
                `You are about to switch accounts. Your current ${credits.purchasedCredits} credits will NOT be transferred.\n\nBut don't worry! You can switch back to this account anytime using your current code:\n\n${credits.recoveryCode}`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Switch Account',
                        style: 'destructive',
                        onPress: performRecovery
                    }
                ]
            );
        } else {
            // No credits to lose, switch immediately
            performRecovery();
        }
    };

    const handleCredits = () => {
        navigation.navigate('Credits');
    };

    const handleUpgrade = () => {
        navigation.navigate('Payment');
    };

    const handleRateApp = () => {
        if (credits.appConfig?.rateUrl) {
            Linking.openURL(credits.appConfig.rateUrl);
        } else {
            // Platform specific logic for rating would go here
            Alert.alert('Rate App', 'Thank you for your support!');
        }
    };

    const handleShareApp = () => {
        if (credits.appConfig?.shareUrl) {
            Linking.openURL(credits.appConfig.shareUrl);
        } else {
            Alert.alert('Share App', 'Share functionality coming soon!');
        }
    };

    const handleMoreApps = () => {
        if (credits.appConfig?.moreAppsUrl) {
            Linking.openURL(credits.appConfig.moreAppsUrl);
            return;
        }

        const url = Platform.select({
            ios: 'https://apps.apple.com/developer/pursharth-zutshi/id1856952308',
            android: 'https://play.google.com/store/apps/dev?id=6039030544696005344'
        });
        Linking.openURL(url);
    };

    const handleContact = () => {
        // Updated email
        Linking.openURL('mailto:taptapcreate43@gmail.com');
    };

    const handlePrivacy = () => {
        Linking.openURL('https://ai-notes-website.vercel.app/privacy');
    };

    const handleTerms = () => {
        Linking.openURL('https://ai-notes-website.vercel.app/terms');
    };

    const handleFAQ = () => {
        navigation.navigate('FAQ');
    };

    const handleWalkthrough = () => {
        navigation.navigate('Walkthrough', { fromSettings: true });
    };

    const { clearAllHistory } = useHistory();

    const handleResetApp = () => {
        // First Confirmation
        Alert.alert(
            'Delete All Data?',
            'This will permanently delete all your generated notes and reply history. Your credits and account balance will be preserved.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete All',
                    style: 'destructive',
                    onPress: () => {
                        // Second Confirmation
                        setTimeout(() => {
                            Alert.alert(
                                'Final Confirmation',
                                'Are you absolutely sure? This action cannot be undone.',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Yes, Delete Everything',
                                        style: 'destructive',
                                        onPress: async () => {
                                            await clearAllHistory();
                                            Alert.alert('Success', 'All history has been cleared.');
                                        }
                                    }
                                ]
                            );
                        }, 200);
                    }
                }
            ]
        );
    };

    const SettingItem = ({ icon, iconColor, title, subtitle, onPress, rightComponent }) => (
        <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7} disabled={!onPress && !rightComponent}>
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
                <AnimatedSection fadeAnim={fadeAnims[0]} slideAnim={slideAnims[0]} style={styles.profileSection}>
                    <LinearGradient colors={colors.gradientPrimary} style={styles.profileAvatar}>
                        <Ionicons name="person" size={40} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.profileName}>AI Notes</Text>
                    <Text style={styles.profileSubtitle}>Write & Reply</Text>
                </AnimatedSection>

                {/* Wallet / Status */}
                <AnimatedSection fadeAnim={fadeAnims[1]} slideAnim={slideAnims[1]} style={styles.section}>
                    <View style={styles.walletCard}>
                        <LinearGradient
                            colors={isDark ? ['#1E3A5F', '#2563EB'] : ['#DBEAFE', '#BFDBFE']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.walletBackground}
                        />

                        <View style={styles.walletHeader}>
                            <View>
                                <Text style={styles.walletLabel}>CURRENT PLAN</Text>
                                <Text style={styles.walletValue}>
                                    {credits.hasProSubscription ? 'PRO MEMBER' : 'FREE USER'}
                                </Text>
                            </View>
                            <View style={styles.creditBadge}>
                                <Ionicons name="flash" size={14} color="#F59E0B" />
                                <Text style={styles.creditText}>
                                    {credits.hasProSubscription ? '∞' : credits.purchasedCredits + credits.remainingFree}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.walletActions}>
                            <TouchableOpacity
                                style={[styles.walletButtonFull, { backgroundColor: colors.primary }]}
                                onPress={handleCredits}
                            >
                                <Ionicons name="cart-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={[styles.walletButtonText, { color: '#fff' }]}>Buy Subscription / Credits</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </AnimatedSection>

                {/* Appearance */}
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

                {/* Help & Support */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>HELP & SUPPORT</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon="help-buoy"
                            iconColor="#3B82F6"
                            title="FAQ & Help Center"
                            subtitle="Common questions answered"
                            onPress={handleFAQ}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="school"
                            iconColor="#8B5CF6"
                            title="App Walkthrough"
                            subtitle="See what you can do"
                            onPress={handleWalkthrough}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="mail"
                            iconColor="#EC4899"
                            title="Contact Us"
                            subtitle="taptapcreate43@gmail.com"
                            onPress={handleContact}
                        />
                    </View>
                </View>

                {/* Share & Rate */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>COMMUNITY</Text>
                    <View style={styles.card}>
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
                            icon="apps"
                            iconColor="#6366F1"
                            title="More Apps"
                            subtitle="Check out our other apps"
                            onPress={handleMoreApps}
                        />
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>ABOUT</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon="information-circle"
                            iconColor={colors.textMuted}
                            title="About AI Notes"
                            subtitle="Your AI-powered writing companion. Generate notes, craft replies, and boost productivity."
                            onPress={() => { }} // Could open a modal or website
                            rightComponent={<View />} // Hide chevron
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="shield-checkmark"
                            iconColor={colors.textMuted}
                            title="Privacy Policy"
                            onPress={handlePrivacy}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="document-text"
                            iconColor={colors.textMuted}
                            title="Terms of Service"
                            onPress={handleTerms}
                        />
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.error }]}>DANGER ZONE</Text>
                    <View style={[styles.card, { borderColor: `${colors.error}40` }]}>
                        <SettingItem
                            icon="trash"
                            iconColor={colors.error}
                            title="Delete All Data"
                            subtitle="Clear notes & reply history"
                            onPress={handleResetApp}
                        />
                    </View>
                </View>

                {/* Account Recovery - PROMINENT SECTION */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.primary }]}>💾 CREDIT RECOVERY</Text>
                    <View style={[styles.recoveryCard, { borderColor: colors.primary, borderWidth: 1.5 }]}>
                        <View style={styles.headerRow}>
                            <Ionicons name="key" size={24} color={colors.primary} />
                            <Text style={styles.cardTitle}>Your Recovery Code</Text>
                        </View>
                        <Text style={styles.cardDesc}>
                            Save this code to transfer credits to a new device. Enter it on your new device to restore your balance.
                        </Text>
                        {credits.recoveryCode ? (
                            <TouchableOpacity style={[styles.codeBox, { borderColor: colors.primary }]} onPress={handleCopyCode}>
                                <Text style={[styles.codeText, { fontSize: 20, letterSpacing: 2 }]}>{credits.recoveryCode}</Text>
                                <Ionicons name="copy-outline" size={20} color={colors.primary} style={{ marginLeft: 10 }} />
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.loadingText}>Loading...</Text>
                        )}
                    </View>

                    {/* Restore from Old Device - Prominent Card */}
                    <View style={[styles.restoreCard, { backgroundColor: `${colors.warning}10`, borderColor: colors.warning }]}>
                        <View style={styles.headerRow}>
                            <Ionicons name="swap-horizontal" size={24} color={colors.warning} />
                            <Text style={[styles.cardTitle, { color: colors.warning }]}>Switch Device?</Text>
                        </View>
                        <Text style={styles.cardDesc}>
                            Have credits on another device? Enter your old Recovery Code to transfer them here.
                        </Text>
                        <TouchableOpacity
                            style={[styles.restoreOldButton, { backgroundColor: colors.warning }]}
                            onPress={() => setShowRecoveryInput(!showRecoveryInput)}
                        >
                            <Ionicons name={showRecoveryInput ? "close" : "download-outline"} size={18} color="#fff" />
                            <Text style={styles.restoreOldButtonText}>
                                {showRecoveryInput ? 'Cancel' : 'Restore from Old ID'}
                            </Text>
                        </TouchableOpacity>

                        {showRecoveryInput && (
                            <View style={[styles.inputWrapper, { marginTop: 16 }]}>
                                <TextInput
                                    style={styles.recoverInput}
                                    placeholder="ENTER CODE"
                                    placeholderTextColor={colors.textMuted}
                                    value={recoveryInput}
                                    onChangeText={setRecoveryInput}
                                    autoCapitalize="characters"
                                    maxLength={10}
                                />
                                <TouchableOpacity
                                    style={[styles.recoverButton, (!recoveryInput || isRecovering) && { opacity: 0.5 }]}
                                    onPress={handleRecover}
                                    disabled={!recoveryInput || isRecovering}
                                >
                                    <Text style={styles.recoverButtonText}>
                                        {isRecovering ? '...' : 'Go'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* Version Footer */}
                <View style={styles.versionContainer}>
                    <View style={[styles.versionBox, { borderColor: colors.glassBorder, backgroundColor: colors.surface }]}>
                        <Text style={[styles.versionText, { color: colors.textMuted }]}>
                            Version {APP_VERSION}
                        </Text>
                        <Text style={[styles.copyrightText, { color: colors.textMuted }]}>
                            © Taptapcreate
                        </Text>
                    </View>
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
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: colors.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
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
    // Recovery
    recoveryCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    cardTitle: {
        color: colors.text,
        fontSize: 17,
        fontWeight: '700',
    },
    cardDesc: {
        color: colors.textMuted,
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    codeBox: {
        backgroundColor: colors.background,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    codeText: {
        color: colors.primary,
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 2,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    recoveryButton: {
        alignItems: 'center',
        padding: 10
    },
    recoveryButtonLabel: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 15
    },
    inputWrapper: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12
    },
    recoverInput: {
        flex: 1,
        backgroundColor: colors.surface,
        color: colors.text,
        fontSize: 16,
        fontWeight: '600',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        letterSpacing: 1,
    },
    recoverButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        justifyContent: 'center',
        borderRadius: 12,
    },
    recoverButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    loadingText: {
        color: colors.textMuted,
        fontSize: 16,
    },
    restoreCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        borderWidth: 1.5,
    },
    restoreOldButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
    },
    restoreOldButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    // Wallet
    walletCard: {
        backgroundColor: colors.surface,
        marginHorizontal: 4,
        borderRadius: 16,
        padding: 20,
        overflow: 'hidden',
        position: 'relative',
        height: 150,
        justifyContent: 'space-between',
        borderWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    walletBackground: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.8,
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    walletLabel: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 4,
        opacity: 0.8,
    },
    walletValue: {
        color: colors.text,
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    creditBadge: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    creditText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 14,
    },
    walletActions: {
        flexDirection: 'row',
        gap: 12,
    },
    walletButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    walletButtonFull: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    walletButtonText: {
        fontWeight: '700',
        fontSize: 14,
    },
    // Version Footer
    versionContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    versionBox: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 2,
    },
    copyrightText: {
        fontSize: 11,
    }
});
