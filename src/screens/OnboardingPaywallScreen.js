import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
    ActivityIndicator,
    SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import PurchaseService, { PRODUCT_IDS } from '../services/PurchaseService';

const AUTO_RESTORE_SHOWN_KEY = '@auto_restore_popup_shown';

// Exact match from CreditsScreen
const SUBSCRIPTION_PLANS = [
    {
        id: PRODUCT_IDS.MONTHLY_SUBSCRIPTION,
        name: 'Monthly Plan',
        price: '₹599', // Fallback
        priceUSD: '$6.99',
        period: '/month',
        perWeek: '₹150',
        description: 'Best value for regular users',
        features: [
            { icon: 'infinite-outline', text: 'Unlimited AI Usage' },
            { icon: 'ban-outline', text: 'No Ads' },
            { icon: 'chatbubbles-outline', text: 'Smart Reply' },
            { icon: 'document-text-outline', text: 'Note Generation' },
            { icon: 'globe-outline', text: 'Web & YouTube Summarizer' },
        ],
        recommended: true,
    },
    {
        id: PRODUCT_IDS.WEEKLY_SUBSCRIPTION,
        name: 'Weekly Plan',
        price: '₹199', // Fallback
        priceUSD: '$2.99',
        period: '/week',
        perWeek: '₹199',
        description: 'Try it out',
        features: [
            { icon: 'infinite-outline', text: 'Unlimited AI Usage' },
            { icon: 'ban-outline', text: 'No Ads' },
            { icon: 'chatbubbles-outline', text: 'Smart Reply' },
            { icon: 'document-text-outline', text: 'Note Generation' },
            { icon: 'globe-outline', text: 'Web & YouTube Summarizer' },
        ],
        recommended: false,
    },
];

export default function OnboardingPaywallScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const { completeOnboarding, syncBalance, recoverAccount } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState(PRODUCT_IDS.MONTHLY_SUBSCRIPTION);
    const [rcPackages, setRcPackages] = useState({});

    useEffect(() => {
        const loadPrices = async () => {
            const offeringsResult = await PurchaseService.getOfferings();
            if (offeringsResult.success && offeringsResult.offerings?.availablePackages) {
                const packages = {};
                offeringsResult.offerings.availablePackages.forEach(pkg => {
                    packages[pkg.product.identifier] = {
                        price: pkg.product.priceString,
                        package: pkg,
                    };
                });
                setRcPackages(packages);
            }
        };
        loadPrices();
    }, []);

    // OPTIMIZATION: Check if already Pro (e.g. from previous install or restore)
    // Only shows ONCE per install (tracked via AsyncStorage)
    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                // Check if we've already shown this popup
                const alreadyShown = await AsyncStorage.getItem(AUTO_RESTORE_SHOWN_KEY);
                if (alreadyShown === 'true') {
                    console.log('⏭️ Auto-restore popup already shown this install');
                    return;
                }

                const proCheck = await PurchaseService.checkProAccess();
                if (proCheck.hasProAccess) {
                    console.log('✅ Auto-Restore: User has active subscription');
                    // Mark as shown BEFORE displaying popup
                    await AsyncStorage.setItem(AUTO_RESTORE_SHOWN_KEY, 'true');

                    Alert.alert(
                        'Welcome Back!',
                        'We detected an active subscription. Use this account?',
                        [
                            { text: 'No, Use Code', style: 'cancel', onPress: () => { /* Stay on screen */ } },
                            { text: 'Yes, Restore', onPress: () => finishOnboarding() }
                        ]
                    );
                } else {
                    // No subscription found, mark as shown so we don't check again
                    await AsyncStorage.setItem(AUTO_RESTORE_SHOWN_KEY, 'true');
                }
            } catch (e) {
                console.log('Auto-check failed', e);
            }
        }, 1000); // 1 second delay to let UI render first

        return () => clearTimeout(timer);
    }, []);

    const handleRedeem = () => {
        if (Platform.OS === 'ios') {
            Alert.prompt(
                'Enter Recovery Code',
                'Enter your unique recovery code to restore purchases/credits.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Redeem',
                        onPress: async (code) => {
                            if (!code) return;
                            setIsLoading(true);
                            const result = await recoverAccount(code);
                            setIsLoading(false);
                            if (result.success) {
                                Alert.alert('Success', 'Account recovered!', [{ text: 'OK', onPress: finishOnboarding }]);
                            } else {
                                Alert.alert('Error', 'Invalid code.');
                            }
                        }
                    }
                ],
                'plain-text'
            );
        } else {
            // Simple Android Fallback
            Alert.alert('Redeem Code', 'Please go to Settings > Credits to redeem codes on Android.');
        }
    };

    const getPrice = (productId, fallbackPrice) => {
        if (rcPackages[productId]) {
            return rcPackages[productId].price;
        }
        return fallbackPrice;
    };

    const handleContinue = async () => {
        if (!selectedPlanId) return;

        setIsLoading(true);
        try {
            let result;

            if (rcPackages[selectedPlanId]?.package) {
                console.log('⚡ Fast purchase using cached package');
                result = await PurchaseService.purchasePackage(rcPackages[selectedPlanId].package);
            } else {
                console.log('⚠️ Slow purchase using ID lookup');
                result = await PurchaseService.purchaseProduct(selectedPlanId);
            }

            if (result.success) {
                await PurchaseService.checkProAccess();
                await syncBalance();
                Alert.alert(
                    '🎉 Welcome to Pro!',
                    'Your subscription is active. Enjoy unlimited access!',
                    [{
                        text: "Let's Go!",
                        onPress: () => finishOnboarding()
                    }]
                );
            } else if (result.cancelled) {
                // Do nothing
            } else {
                Alert.alert('Purchase Failed', result.error || 'Please try again.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async () => {
        if (isLoading) return;

        setIsLoading(true);

        const restorePromise = PurchaseService.restorePurchases();
        let isDone = false;

        restorePromise.then(async (result) => {
            isDone = true;
            setIsLoading(false);

            if (result.success && (result.activeSubscriptions?.length > 0 || result.totalCreditsRestored > 0)) {
                await syncBalance();
                Alert.alert(
                    '🎉 Purchases Restored!',
                    'Your subscription/credits have been restored.',
                    [{
                        text: "Continue",
                        onPress: () => finishOnboarding()
                    }]
                );
            } else if (result.success) {
                Alert.alert('Info', 'No active subscriptions found to restore.');
            } else {
                Alert.alert('Error', 'Failed to restore purchases.');
            }
        }).catch(err => {
            isDone = true;
            setIsLoading(false);
            console.error('Restore error:', err);
            Alert.alert('Error', 'Restore failed. Please check your connection.');
        });

        setTimeout(() => {
            if (!isDone) {
                setIsLoading(false);
            }
        }, 2000);
    };

    const finishOnboarding = async () => {
        if (completeOnboarding) await completeOnboarding();
        navigation.replace('MainTabs');
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        safeArea: {
            flex: 1,
        },
        scrollContent: {
            padding: 24,
            paddingBottom: 40,
        },
        header: {
            alignItems: 'center',
            marginBottom: 32,
            marginTop: 20,
        },
        iconContainer: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
        },
        title: {
            fontSize: 28,
            fontWeight: '800',
            marginBottom: 8,
            textAlign: 'center',
            color: colors.text,
        },
        subtitle: {
            fontSize: 16,
            textAlign: 'center',
            lineHeight: 22,
            color: colors.textSecondary,
        },
        featuresContainer: {
            marginBottom: 32,
        },
        featureRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
        },
        featureIcon: {
            width: 24,
            height: 24,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
            backgroundColor: '#4CAF50',
        },
        featureText: {
            fontSize: 16,
            fontWeight: '500',
            color: colors.text,
        },
        plansContainer: {
            marginBottom: 24,
        },
        // Copied Subscription Card Styles from CreditsScreen
        subscriptionCard: {
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            backgroundColor: colors.surface,
            position: 'relative',
        },
        subscriptionCardSelected: {
            borderColor: colors.primary,
            backgroundColor: isDark ? 'rgba(79, 70, 229, 0.1)' : '#EEF2FF',
            borderWidth: 2,
        },
        subscriptionCardRecommended: {
            borderColor: colors.primary,
            borderWidth: 2,
        },
        badge: {
            position: 'absolute',
            top: -12,
            right: 20,
            backgroundColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
            zIndex: 10,
        },
        badgeText: {
            color: '#fff',
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 0.5,
        },
        subscriptionMain: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        subscriptionInfo: {
            flex: 1,
        },
        subscriptionName: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 4,
        },
        subscriptionPriceMain: {
            fontSize: 24,
            fontWeight: '800',
            color: colors.text,
        },
        subscriptionPriceContainer: {
            alignItems: 'flex-end',
        },
        subscriptionPerWeek: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textMuted,
        },
        subscriptionPeriod: {
            fontSize: 12,
            color: colors.textMuted,
        },
        planFeatures: {
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: colors.glassBorder,
        },
        planFeatureItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 6,
        },
        planFeatureText: {
            fontSize: 12,
            color: colors.textMuted,
            marginLeft: 8,
        },
        actions: {
            alignItems: 'center',
        },
        continueButton: {
            width: '100%',
            paddingVertical: 16,
            borderRadius: 30,
            alignItems: 'center',
            marginBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
            backgroundColor: colors.primary,
        },
        continueText: {
            color: '#fff',
            fontSize: 18,
            fontWeight: '700',
        },
        restoreButton: {
            marginBottom: 12,
        },
        restoreText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textMuted,
        },
        skipButton: {
            padding: 8,
        },
        skipText: {
            fontSize: 14,
            fontWeight: '500',
            color: colors.textSecondary,
        },
        disclaimer: {
            fontSize: 12,
            textAlign: 'center',
            marginTop: 24,
            opacity: 0.6,
            color: colors.textMuted,
        }
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={isDark ? ['#1a1a2e', '#0f0f1a'] : ['#f8f9ff', '#ffffff']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Image / Icon */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="sparkles" size={48} color="#FFD700" />
                        </View>
                        <Text style={styles.title}>Unlock Pro Access</Text>
                        <Text style={styles.subtitle}>
                            Get unlimited AI generations, smart replies, and advanced features.
                        </Text>
                    </View>

                    {/* Plans */}
                    <View style={styles.plansContainer}>
                        {SUBSCRIPTION_PLANS.map((plan) => {
                            const isSelected = selectedPlanId === plan.id;

                            return (
                                <TouchableOpacity
                                    key={plan.id}
                                    style={[
                                        styles.subscriptionCard,
                                        isSelected && styles.subscriptionCardSelected,
                                        plan.recommended && !isSelected && styles.subscriptionCardRecommended
                                    ]}
                                    onPress={() => setSelectedPlanId(plan.id)}
                                    activeOpacity={0.7}
                                >
                                    {plan.recommended && (
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>BEST VALUE</Text>
                                        </View>
                                    )}

                                    <View style={[
                                        styles.subscriptionMain,
                                        plan.recommended && { marginTop: 8 }
                                    ]}>
                                        <View style={styles.subscriptionInfo}>
                                            <Text style={[
                                                styles.subscriptionName,
                                                isSelected && { color: colors.primary }
                                            ]}>{plan.name}</Text>
                                            <Text style={styles.subscriptionPriceMain}>{getPrice(plan.id, plan.price)}</Text>
                                        </View>

                                        <View style={styles.subscriptionPriceContainer}>
                                            <Text style={styles.subscriptionPerWeek}>{plan.perWeek}</Text>
                                            <Text style={styles.subscriptionPeriod}>per week</Text>
                                        </View>
                                    </View>

                                    {/* Features List */}
                                    <View style={styles.planFeatures}>
                                        {plan.features.map((feature, idx) => (
                                            <View key={idx} style={styles.planFeatureItem}>
                                                <Ionicons name={feature.icon} size={16} color={colors.success || '#10B981'} />
                                                <Text style={styles.planFeatureText}>{feature.text}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={handleContinue}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.continueText}>Start Pro Access</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.restoreButton}
                            onPress={handleRestore}
                        // Don't disable button if loading is simply in background
                        >
                            <Text style={styles.restoreText}>
                                {isLoading ? 'Checking...' : 'Restore Purchases'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={finishOnboarding}
                        >
                            <Text style={styles.skipText}>Continue with Limited Version</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.disclaimer}>
                        Recurring billing, cancel anytime. By continuing you agree to our Terms of Service.
                    </Text>

                    <TouchableOpacity style={{ marginTop: 20, padding: 10, alignSelf: 'center' }} onPress={handleRedeem}>
                        <Text style={{ color: colors.primary, textAlign: 'center', fontSize: 13, fontWeight: '600' }}>
                            Have a Recovery Code?
                        </Text>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

// ... styles defined above
