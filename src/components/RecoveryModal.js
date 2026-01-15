/**
 * Recovery Modal Component
 * Shows on first launch to let users restore purchases or recover credit code
 * Includes warnings about account switching
 */

import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const RecoveryModal = ({
    visible,
    onClose,
    onRestorePurchases,
    onRecoverCode,
    colors,
    isRestoring = false,
    currentCredits = 0,  // Pass current credits to show warning
    currentRecoveryCode = null // Pass current code to show to user
}) => {
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [code, setCode] = useState('');
    const [isRecovering, setIsRecovering] = useState(false);

    const handleRecoverCode = async () => {
        if (!code.trim()) {
            Alert.alert('Error', 'Please enter your recovery code');
            return;
        }

        // DOUBLE WARNING if user has purchased credits
        if (currentCredits > 0) {
            // First warning
            Alert.alert(
                '⚠️ Warning: Account Switch',
                `You currently have ${currentCredits} credits on this device.\n\nRecovering with a different code will switch to a DIFFERENT account. Your current ${currentCredits} credits will NOT be transferred.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'I Understand',
                        style: 'destructive',
                        onPress: () => {
                            // Second warning
                            Alert.alert(
                                '🚨 Final Confirmation',
                                `Are you ABSOLUTELY SURE?\n\nYou will lose access to your current ${currentCredits} credits unless you remember your current recovery code.`,
                                [
                                    { text: 'Go Back', style: 'cancel' },
                                    {
                                        text: 'Yes, Switch Account',
                                        style: 'destructive',
                                        onPress: performRecovery
                                    }
                                ]
                            );
                        }
                    }
                ]
            );
        } else {
            // No credits, proceed directly
            performRecovery();
        }
    };

    const performRecovery = async () => {
        setIsRecovering(true);
        try {
            const result = await onRecoverCode(code.trim().toUpperCase());
            if (result.success) {
                const title = result.message.includes('Already using') ? 'Info' : 'Success! 🎉';
                Alert.alert(title, result.message || 'Your credits have been restored!', [
                    { text: 'OK', onPress: onClose }
                ]);
            } else {
                Alert.alert('Error', result.error || 'Invalid recovery code. Please try again.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setIsRecovering(false);
        }
    };

    const handleRestorePurchases = async () => {
        try {
            const result = await onRestorePurchases();
            if (result?.success) {
                Alert.alert('Success! 🎉', 'Your purchases have been restored!', [
                    { text: 'OK', onPress: onClose }
                ]);
            }
        } catch (error) {
            Alert.alert('No Purchases Found', 'No previous purchases found for this account.');
        }
    };

    const styles = createStyles(colors);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.container}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Ionicons name="refresh-circle" size={48} color={colors.primary} />
                            <Text style={styles.title}>Welcome Back!</Text>
                            <Text style={styles.subtitle}>
                                Restore your previous purchases or recover your credit balance
                            </Text>
                        </View>

                        {!showCodeInput ? (
                            <>
                                {/* Info Box */}
                                <View style={styles.infoBox}>
                                    <Ionicons name="information-circle" size={20} color={colors.warning || '#F59E0B'} />
                                    <Text style={styles.infoText}>
                                        <Text style={styles.infoBold}>Restore Purchases:</Text> For App Store subscriptions{'\n'}
                                        <Text style={styles.infoBold}>Recover Credits:</Text> For one-time credit purchases (requires your 8-character code)
                                    </Text>
                                </View>

                                {/* Restore Purchases Button */}
                                <TouchableOpacity
                                    style={styles.optionButton}
                                    onPress={handleRestorePurchases}
                                    disabled={isRestoring}
                                >
                                    <LinearGradient
                                        colors={[colors.primary, colors.secondary]}
                                        style={styles.optionGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {isRestoring ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <>
                                                <Ionicons name="card" size={24} color="#fff" />
                                                <View style={styles.optionText}>
                                                    <Text style={styles.optionTitle}>Restore Purchases</Text>
                                                    <Text style={styles.optionSubtitle}>Subscriptions from App Store</Text>
                                                </View>
                                                <Ionicons name="chevron-forward" size={20} color="#fff" />
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Recover Code Button */}
                                <TouchableOpacity
                                    style={styles.optionButton}
                                    onPress={() => setShowCodeInput(true)}
                                >
                                    <View style={styles.optionOutline}>
                                        <Ionicons name="key" size={24} color={colors.primary} />
                                        <View style={styles.optionText}>
                                            <Text style={[styles.optionTitle, { color: colors.text }]}>
                                                Recover Credits
                                            </Text>
                                            <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>
                                                Enter your recovery code
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                                    </View>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                {/* Warning Box for Code Recovery */}
                                <View style={styles.warningBox}>
                                    <Ionicons name="warning" size={24} color="#EF4444" />
                                    <Text style={styles.warningText}>
                                        <Text style={styles.warningBold}>⚠️ Important:</Text> Entering a recovery code will switch your account. Credits from your current device will NOT be merged with the recovered account.{'\n\n'}
                                        You can switch back to this account using its recovery code later.
                                    </Text>
                                </View>

                                {/* Current Code Display */}
                                {currentRecoveryCode && (
                                    <View style={styles.currentCodeContainer}>
                                        <Text style={styles.currentCodeLabel}>Current Account Code:</Text>
                                        <Text style={styles.currentCodeValue}>{currentRecoveryCode}</Text>
                                    </View>
                                )}

                                {/* Code Input */}
                                <View style={styles.codeInputContainer}>
                                    <Text style={styles.codeLabel}>Enter new recovery code:</Text>
                                    <TextInput
                                        style={styles.codeInput}
                                        value={code}
                                        onChangeText={setCode}
                                        placeholder="XXXXXXXX"
                                        placeholderTextColor={colors.textMuted}
                                        autoCapitalize="characters"
                                        maxLength={8}
                                        autoFocus
                                    />
                                </View>

                                <TouchableOpacity
                                    style={styles.optionButton}
                                    onPress={handleRecoverCode}
                                    disabled={isRecovering}
                                >
                                    <LinearGradient
                                        colors={[colors.primary, colors.secondary]}
                                        style={styles.optionGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {isRecovering ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <>
                                                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                                <Text style={[styles.optionTitle, { flex: 1, marginLeft: 12 }]}>
                                                    Recover My Credits
                                                </Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={() => setShowCodeInput(false)}
                                >
                                    <Text style={styles.backText}>← Back to options</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Skip Button */}
                        <TouchableOpacity style={styles.skipButton} onPress={onClose}>
                            <Text style={styles.skipText}>
                                {showCodeInput ? 'Cancel' : 'Skip for now'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const createStyles = (colors) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        color: colors.text,
        fontSize: 24,
        fontWeight: '700',
        marginTop: 12,
    },
    subtitle: {
        color: colors.textMuted,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: `${colors.warning || '#F59E0B'}15`,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: `${colors.warning || '#F59E0B'}30`,
    },
    infoText: {
        flex: 1,
        marginLeft: 10,
        color: colors.textMuted,
        fontSize: 12,
        lineHeight: 18,
    },
    infoBold: {
        fontWeight: '600',
        color: colors.text,
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: '#EF444415',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#EF444430',
    },
    warningText: {
        flex: 1,
        marginLeft: 10,
        color: colors.textMuted,
        fontSize: 12,
        lineHeight: 18,
    },
    warningBold: {
        fontWeight: '700',
        color: '#EF4444',
    },
    optionButton: {
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
    },
    optionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    optionOutline: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: 16,
    },
    optionText: {
        flex: 1,
        marginLeft: 12,
    },
    optionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    optionSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 2,
    },
    codeInputContainer: {
        marginBottom: 16,
    },
    codeLabel: {
        color: colors.textMuted,
        fontSize: 14,
        marginBottom: 8,
    },
    codeInput: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 16,
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        letterSpacing: 4,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    backButton: {
        alignItems: 'center',
        padding: 8,
    },
    backText: {
        color: colors.primary,
        fontSize: 14,
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 8,
    },
    skipText: {
        color: colors.textMuted,
        fontSize: 14,
    },

    currentCodeContainer: {
        backgroundColor: colors.background,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        width: '100%',
        alignItems: 'center',
        marginBottom: 20
    },
    currentCodeLabel: {
        color: colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    currentCodeValue: {
        color: colors.primary,
        fontSize: 18,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        letterSpacing: 2
    }
});

export default RecoveryModal;
