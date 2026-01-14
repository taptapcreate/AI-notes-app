import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useFocusEffect } from '@react-navigation/native';
import {
    getStreakStatus,
    performDailyCheckIn,
    STREAK_REWARDS
} from '../services/DailyRewardsService';
import PurchaseService, { PRODUCT_IDS, CREDITS_PER_PRODUCT } from '../services/PurchaseService';
import { RewardedAd, RewardedAdEventType, adUnitIDs, areAdsEnabled } from '../services/AdService';

const { width } = Dimensions.get('window');

// Subscription Plans (IDs match RevenueCat)
const SUBSCRIPTION_PLANS = [
    {
        id: PRODUCT_IDS.MONTHLY_SUBSCRIPTION,
        name: 'Monthly Plan',
        credits: 2500,
        price: '₹599',
        priceValue: 599,
        priceUSD: '$6.99',
        period: '/month',
        perWeek: '₹150',
        description: 'Best value for regular users',
        icon: 'infinite-outline',
        features: ['Extended AI usage', 'No ads', 'Priority processing'],
        recommended: true,
    },
    {
        id: PRODUCT_IDS.WEEKLY_SUBSCRIPTION,
        name: 'Weekly Plan',
        credits: 500,
        price: '₹199',
        priceValue: 199,
        priceUSD: '$2.99',
        period: '/week',
        perWeek: '₹199',
        description: 'Try it out',
        icon: 'time-outline',
        features: ['Weekly AI credits', 'No ads', 'Priority processing'],
        recommended: false,
    },
];

// Credit Packs (IDs match RevenueCat)
const CREDIT_PACKS = [
    {
        id: PRODUCT_IDS.LITE_PACK,
        name: 'Lite Pack',
        credits: 100,
        price: '₹49',
        priceValue: 49,
        description: 'Great for small tasks',
        icon: 'flashlight-outline',
        bonus: null,
    },
    {
        id: PRODUCT_IDS.POWER_PACK,
        name: 'Power Pack',
        credits: 350,
        price: '₹99',
        priceValue: 99,
        description: 'Most popular choice',
        icon: 'flash-outline',
        popular: true,
        bonus: null,
    },
    {
        id: PRODUCT_IDS.PRO_PACK,
        name: 'Pro Pack',
        credits: 550,
        price: '₹179',
        priceValue: 179,
        description: 'Great value for regulars',
        icon: 'trending-up-outline',
        bonus: null,
    },
    {
        id: PRODUCT_IDS.ELITE_PACK,
        name: 'Elite Pack',
        credits: 900,
        price: '₹299',
        priceValue: 299,
        description: 'For power users',
        icon: 'rocket-outline',
        bonus: null,
    },
    {
        id: PRODUCT_IDS.ULTIMATE_PACK,
        name: 'Ultimate Pack',
        credits: 1800,
        price: '₹549',
        priceValue: 549,
        description: 'Maximum savings',
        icon: 'diamond-outline',
        bonus: null,
    },
    {
        id: PRODUCT_IDS.MEGA_PACK,
        name: 'Mega Pack',
        credits: 3500,
        price: '₹999',
        priceValue: 999,
        description: 'For professionals',
        icon: 'star-outline',
        bonus: null,
    },
    {
        id: PRODUCT_IDS.SUPREME_PACK,
        name: 'Supreme Pack',
        credits: 5000,
        price: '₹2999',
        priceValue: 2999,
        description: 'Unlimited power',
        icon: 'trophy-outline',
        bestValue: true,
        bonus: null,
    },
];

const LIMIT_INFO = [
    { label: 'Note Generation', cost: '1 Credit', icon: 'document-text-outline' },
    { label: 'Smart Reply', cost: '1 Credit', icon: 'chatbubbles-outline' },
    { label: 'AI Summarization', cost: '2 Credits', icon: 'list-outline' },
    { label: 'Priority Server', cost: 'Free', icon: 'speedometer-outline' },
];

// 🔧 DEV MODE - Set to false before production release!
const DEV_MODE = true;

export default function CreditsScreen({ navigation }) {
    const { colors } = useTheme();
    const { getCreditData, addCredits, syncBalance, recoveryCode } = useUser();
    const styles = createStyles(colors);
    const credits = getCreditData();

    // Daily Gifts State
    const [streakStatus, setStreakStatus] = useState(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);

    // DEV: Test mode state
    const [devTestCredits, setDevTestCredits] = useState(100);

    // RevenueCat offerings/prices state
    const [rcPackages, setRcPackages] = useState({});
    const [pricesLoaded, setPricesLoaded] = useState(false);

    // Rewarded Ad State
    const [rewardedAd, setRewardedAd] = useState(null);
    const [adLoaded, setAdLoaded] = useState(false);
    const [isAdError, setIsAdError] = useState(false);

    // Initialize Rewarded Ad
    useEffect(() => {
        if (!areAdsEnabled) return;

        console.log('🎬 Initializing Rewarded Ad with ID:', adUnitIDs.rewarded);

        const ad = RewardedAd.createForAdRequest(adUnitIDs.rewarded, {
            requestNonPersonalizedAdsOnly: true,
        });

        const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
            console.log('✅ Rewarded Ad Loaded');
            setAdLoaded(true);
            setIsAdError(false);
        });

        const unsubscribeEarned = ad.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            (reward) => {
                console.log('🎁 User earned reward:', reward);
                // The actual credit adding logic is handled in handleDailyCheckIn
                // after the ad is shown and closed successfully
            }
        );

        const unsubscribeClosed = ad.addAdEventListener(RewardedAdEventType.CLOSED, () => {
            console.log('🚪 Rewarded Ad Closed');
            setAdLoaded(false);
            // Preload next ad
            ad.load();
        });

        const unsubscribeError = ad.addAdEventListener(RewardedAdEventType.ERROR, (error) => {
            console.error('❌ Rewarded Ad Error:', error);
            setIsAdError(true);
            setAdLoaded(false);
        });

        // Load the ad
        ad.load();
        setRewardedAd(ad);

        return () => {
            unsubscribeLoaded();
            unsubscribeEarned();
            unsubscribeClosed();
            unsubscribeError();
        };
    }, []);

    // Load streak status and init RevenueCat on mount and focus
    const loadStreakStatus = useCallback(async () => {
        const status = await getStreakStatus();
        setStreakStatus(status);
    }, []);

    // Initialize RevenueCat and sync balance on focus
    useFocusEffect(
        useCallback(() => {
            const init = async () => {
                // Initialize RevenueCat with recovery code as user ID
                await PurchaseService.initializePurchases(recoveryCode);
                await syncBalance();

                // Fetch offerings/prices from RevenueCat
                const offeringsResult = await PurchaseService.getOfferings();
                if (offeringsResult.success) {
                    const packages = {};

                    // Check current offering packages
                    if (offeringsResult.offerings?.availablePackages) {
                        offeringsResult.offerings.availablePackages.forEach(pkg => {
                            packages[pkg.product.identifier] = {
                                package: pkg,
                                price: pkg.product.priceString,
                                priceValue: pkg.product.price,
                            };
                        });
                    }

                    // Also check ALL offerings (credit packs might be in separate offerings)
                    if (offeringsResult.all) {
                        Object.values(offeringsResult.all).forEach(offering => {
                            if (offering.availablePackages) {
                                offering.availablePackages.forEach(pkg => {
                                    // Don't overwrite if already have it
                                    if (!packages[pkg.product.identifier]) {
                                        packages[pkg.product.identifier] = {
                                            package: pkg,
                                            price: pkg.product.priceString,
                                            priceValue: pkg.product.price,
                                        };
                                    }
                                });
                            }
                        });
                    }

                    setRcPackages(packages);
                    setPricesLoaded(true);
                    console.log('📦 RevenueCat packages loaded:', Object.keys(packages));
                }
            };
            init();
            loadStreakStatus();
        }, [loadStreakStatus, recoveryCode, syncBalance])
    );

    // Helper to get price from RevenueCat or fallback
    const getPrice = (productId, fallbackPrice) => {
        if (rcPackages[productId]) {
            return rcPackages[productId].price;
        }
        return fallbackPrice;
    };

    // Handle daily check-in with rewarded ad
    const handleDailyCheckIn = async () => {
        if (streakStatus?.todayCheckedIn) {
            Alert.alert('Already Claimed', 'You have already claimed your daily reward today. Come back tomorrow!');
            return;
        }

        // Check if ads are enabled and loaded
        if (areAdsEnabled && !adLoaded) {
            if (isAdError) {
                Alert.alert('Ad Error', 'Sorry, we couldn\'t load an ad right now. Please try again later.');
                // Try to reload
                rewardedAd?.load();
            } else {
                Alert.alert('Ad Loading', 'Please wait a moment while we load an ad for you...');
                rewardedAd?.load();
            }
            return;
        }

        setIsCheckingIn(true);

        const performCheckIn = async () => {
            try {
                const result = await performDailyCheckIn();

                if (result.success) {
                    addCredits(result.credits);

                    if (result.isStreakBonus) {
                        Alert.alert(
                            '🎉 Streak Bonus!',
                            `Congratulations! You completed a 5-day streak and earned ${result.credits} bonus credits!`,
                            [{ text: 'Awesome!' }]
                        );
                    } else {
                        Alert.alert(
                            '✨ Daily Reward',
                            `You earned ${result.credits} credit${result.credits > 1 ? 's' : ''}! Day ${result.newStreak} of 5.`,
                            [{ text: 'Great!' }]
                        );
                    }

                    // Refresh streak status
                    await loadStreakStatus();
                } else {
                    Alert.alert('Already Claimed', result.message);
                }
            } catch (error) {
                console.error('Check-in error:', error);
                Alert.alert('Error', 'Failed to complete check-in. Please try again.');
            }
        };

        if (areAdsEnabled && rewardedAd) {
            try {
                // Add one-time listener for the reward earned in this specific session
                let rewardEarned = false;
                const unsubscribe = rewardedAd.addAdEventListener(
                    RewardedAdEventType.EARNED_REWARD,
                    () => {
                        rewardEarned = true;
                    }
                );

                const unsubscribeClosed = rewardedAd.addAdEventListener(
                    RewardedAdEventType.CLOSED,
                    async () => {
                        unsubscribe();
                        unsubscribeClosed();
                        if (rewardEarned) {
                            await performCheckIn();
                        }
                        setIsCheckingIn(false);
                    }
                );

                await rewardedAd.show();
            } catch (error) {
                console.error('Error showingRewardedAd:', error);
                Alert.alert('Error', 'Failed to show ad. Please try again.');
                setIsCheckingIn(false);
            }
        } else {
            // If ads are disabled (e.g. Expo Go), allow check-in without ad
            await performCheckIn();
            setIsCheckingIn(false);
        }
    };

    // State for purchase loading
    const [isPurchasing, setIsPurchasing] = React.useState(false);

    const handlePurchase = async (pack) => {
        if (isPurchasing) return;

        setIsPurchasing(true);
        try {
            const result = await PurchaseService.purchaseProduct(pack.id);

            if (result.success) {
                // Sync balance from server after purchase
                await syncBalance();
                Alert.alert(
                    '🎉 Purchase Successful!',
                    `${result.credits} credits have been added to your account!`
                );
            } else if (result.cancelled) {
                // User cancelled - do nothing
            } else {
                Alert.alert('Purchase Failed', result.error || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Purchase error:', error);
            Alert.alert('Error', 'Purchase failed. Please try again.');
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleSubscription = async (plan) => {
        if (isPurchasing) return;

        setIsPurchasing(true);
        try {
            const result = await PurchaseService.purchaseProduct(plan.id);

            if (result.success) {
                // Sync balance from server after subscription
                await syncBalance();
                Alert.alert(
                    '🎉 Subscription Active!',
                    `You're now subscribed to ${plan.name}! ${result.credits} credits have been added.`
                );
            } else if (result.cancelled) {
                // User cancelled - do nothing
            } else {
                Alert.alert('Subscription Failed', result.error || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Subscription error:', error);
            Alert.alert('Error', 'Subscription failed. Please try again.');
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleRestorePurchases = async () => {
        if (isPurchasing) return;

        setIsPurchasing(true);
        try {
            const result = await PurchaseService.restorePurchases();

            if (result.success) {
                await syncBalance();
                if (result.totalCreditsRestored > 0) {
                    Alert.alert(
                        '✅ Purchases Restored!',
                        `${result.totalCreditsRestored} credits have been restored to your account.`
                    );
                } else {
                    Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
                }
            } else {
                Alert.alert('Restore Failed', result.error || 'Could not restore purchases. Please try again.');
            }
        } catch (error) {
            console.error('Restore error:', error);
            Alert.alert('Error', 'Failed to restore purchases. Please try again.');
        } finally {
            setIsPurchasing(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header / Credit Balance */}
                <LinearGradient
                    colors={colors.gradientPrimary}
                    style={styles.balanceCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.balanceMain}>
                        {credits.hasProSubscription ? (
                            // Subscriber view
                            <>
                                <View style={styles.proBadge}>
                                    <Ionicons name="star" size={14} color="#FFD700" />
                                    <Text style={styles.proBadgeText}>PRO SUBSCRIBER</Text>
                                </View>
                                <Text style={styles.balanceValue}>Unlimited Access</Text>
                                <View style={styles.creditBreakdown}>
                                    <View style={styles.creditType}>
                                        <View style={[styles.creditDot, { backgroundColor: '#6366F1' }]} />
                                        <Text style={styles.creditTypeText}>
                                            {credits.subscriptionType === 'monthly' ? 'Monthly Plan' : 'Weekly Plan'} Active
                                        </Text>
                                    </View>
                                    {credits.purchasedCredits > 0 && (
                                        <View style={styles.creditType}>
                                            <View style={[styles.creditDot, { backgroundColor: '#FFD700' }]} />
                                            <Text style={styles.creditTypeText}>
                                                {credits.purchasedCredits} Purchased (on hold)
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </>
                        ) : (
                            // Non-subscriber view
                            <>
                                <Text style={styles.balanceLabel}>Total Available</Text>
                                <Text style={styles.balanceValue}>{credits.totalAvailable} Credits</Text>
                                <View style={styles.creditBreakdown}>
                                    <View style={styles.creditType}>
                                        <View style={[styles.creditDot, { backgroundColor: '#4CAF50' }]} />
                                        <Text style={styles.creditTypeText}>
                                            {credits.remainingFree} Free (Daily)
                                        </Text>
                                    </View>
                                    <View style={styles.creditType}>
                                        <View style={[styles.creditDot, { backgroundColor: '#FFD700' }]} />
                                        <Text style={styles.creditTypeText}>
                                            {credits.purchasedCredits} Purchased
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                    <Ionicons name={credits.hasProSubscription ? "star" : "wallet-outline"} size={40} color="#fff" style={styles.walletIcon} />
                </LinearGradient>

                {/* Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How it works</Text>
                    <View style={styles.infoGrid}>
                        {LIMIT_INFO.map((info, index) => (
                            <View key={index} style={styles.infoCard}>
                                <Ionicons name={info.icon} size={24} color={colors.primary} />
                                <Text style={styles.infoLabel}>{info.label}</Text>
                                <Text style={styles.infoCost}>{info.cost}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Daily Gifts Section */}
                <View style={styles.section}>
                    <View style={styles.dailyGiftsCard}>
                        <View style={styles.dailyGiftsHeader}>
                            <Text style={styles.dailyGiftsTitle}>Daily Gifts</Text>
                            <Text style={styles.dailyGiftsSubtitle}>Check-in daily to get free Credits!</Text>
                        </View>

                        {streakStatus ? (
                            <>
                                <View style={styles.streakGrid}>
                                    {STREAK_REWARDS.map((reward, index) => {
                                        const dayNum = index + 1;
                                        const isCompleted = streakStatus.currentStreak >= dayNum && streakStatus.todayCheckedIn;
                                        const isToday = streakStatus.nextStreakDay === dayNum && !streakStatus.todayCheckedIn;
                                        const isPast = streakStatus.currentStreak >= dayNum;
                                        const isBonus = dayNum === 5;

                                        return (
                                            <View
                                                key={dayNum}
                                                style={[
                                                    styles.streakDay,
                                                    isBonus && styles.streakDayBonus,
                                                    isCompleted && styles.streakDayCompleted,
                                                    isToday && styles.streakDayToday,
                                                ]}
                                            >
                                                {isCompleted ? (
                                                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                                ) : (
                                                    <View style={styles.streakCreditsContainer}>
                                                        <Ionicons name="flash" size={14} color={isBonus ? '#FFD700' : colors.primary} />
                                                        <Text style={[
                                                            styles.streakCredits,
                                                            isBonus && styles.streakCreditsBonus
                                                        ]}>
                                                            {reward.credits}
                                                        </Text>
                                                    </View>
                                                )}
                                                <Text style={[
                                                    styles.streakDayLabel,
                                                    isCompleted && styles.streakDayLabelCompleted
                                                ]}>
                                                    Day {dayNum}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.checkInButton,
                                        streakStatus.todayCheckedIn && styles.checkInButtonDisabled
                                    ]}
                                    onPress={handleDailyCheckIn}
                                    activeOpacity={0.8}
                                    disabled={streakStatus.todayCheckedIn || isCheckingIn}
                                >
                                    <LinearGradient
                                        colors={streakStatus.todayCheckedIn ? ['#888', '#666'] : ['#4CAF50', '#2E7D32']}
                                        style={styles.checkInButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {isCheckingIn ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <>
                                                <Ionicons
                                                    name={streakStatus.todayCheckedIn ? "checkmark-circle" : "play-circle"}
                                                    size={20}
                                                    color="#fff"
                                                />
                                                <Text style={styles.checkInButtonText}>
                                                    {streakStatus.todayCheckedIn ? 'Claimed Today ✓' : 'Watch an Ad & Check-in'}
                                                </Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color={colors.primary} />
                            </View>
                        )}
                    </View>
                </View>

                {/* Recovery Code Section */}
                {credits.recoveryCode && (
                    <View style={styles.section}>
                        <View style={styles.recoveryCard}>
                            <View style={styles.recoveryHeader}>
                                <Ionicons name="key-outline" size={24} color={colors.primary} />
                                <Text style={styles.recoveryTitle}>Your Recovery Code</Text>
                            </View>
                            <Text style={styles.recoverySubtitle}>
                                Save this code to recover your credits on a new device
                            </Text>
                            <View style={styles.recoveryCodeContainer}>
                                <Text style={styles.recoveryCodeText}>{credits.recoveryCode}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.copyButton}
                                onPress={async () => {
                                    await Clipboard.setStringAsync(credits.recoveryCode);
                                    Alert.alert('Copied!', 'Recovery code copied to clipboard. Save it somewhere safe!');
                                }}
                            >
                                <Ionicons name="copy-outline" size={18} color="#fff" />
                                <Text style={styles.copyButtonText}>Copy Code</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Subscription Plans Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Subscription Plans</Text>
                        <Text style={styles.sectionSubtitle}>Unlimited AI power</Text>
                    </View>

                    {SUBSCRIPTION_PLANS.map((plan) => (
                        <TouchableOpacity
                            key={plan.id}
                            style={[
                                styles.subscriptionCard,
                                plan.recommended && styles.subscriptionCardRecommended
                            ]}
                            onPress={() => handleSubscription(plan)}
                            activeOpacity={0.8}
                        >
                            {plan.recommended && (
                                <View style={styles.subscriptionBadge}>
                                    <Text style={styles.subscriptionBadgeText}>BEST VALUE</Text>
                                </View>
                            )}

                            <View style={[
                                styles.subscriptionMain,
                                plan.recommended && { marginTop: 24 }
                            ]}>
                                <View style={styles.subscriptionInfo}>
                                    <Text style={styles.subscriptionName}>{plan.name}</Text>
                                    <Text style={styles.subscriptionPriceMain}>{getPrice(plan.id, plan.price)}</Text>
                                </View>

                                <View style={styles.subscriptionPriceContainer}>
                                    <Text style={styles.subscriptionPerWeek}>{plan.perWeek}</Text>
                                    <Text style={styles.subscriptionPeriod}>per week</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Credit Packs */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>One-Time Packs</Text>
                        <Text style={styles.sectionSubtitle}>Buy credits as you need</Text>
                    </View>

                    {CREDIT_PACKS.map((pack) => (
                        <TouchableOpacity
                            key={pack.id}
                            style={[
                                styles.packCard,
                                pack.popular && styles.packCardPopular,
                                pack.bestValue && styles.packCardBestValue,
                            ]}
                            onPress={() => handlePurchase(pack)}
                            activeOpacity={0.8}
                        >
                            {pack.popular && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>POPULAR</Text>
                                </View>
                            )}
                            {pack.bestValue && (
                                <View style={[styles.badge, styles.bestValueBadge]}>
                                    <Text style={styles.badgeText}>BEST VALUE</Text>
                                </View>
                            )}

                            <View style={styles.packMain}>
                                <View style={styles.packIconContainer}>
                                    <LinearGradient
                                        colors={colors.gradientPrimary}
                                        style={styles.packIconGradient}
                                    >
                                        <Ionicons name={pack.icon} size={24} color="#fff" />
                                    </LinearGradient>
                                </View>

                                <View style={styles.packInfo}>
                                    <Text style={styles.packName}>{pack.name}</Text>
                                    <View style={styles.creditRow}>
                                        <Text style={styles.packCredits}>{pack.credits} Credits</Text>
                                        {pack.bonus && (
                                            <Text style={styles.bonusText}>{pack.bonus}</Text>
                                        )}
                                    </View>
                                    <Text style={styles.packDescription}>{pack.description}</Text>
                                </View>

                                <View style={styles.packPriceContainer}>
                                    <Text style={styles.packPrice}>{getPrice(pack.id, pack.price)}</Text>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Restore Purchases */}
                <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={handleRestorePurchases}
                    disabled={isPurchasing}
                >
                    <Ionicons name="refresh-outline" size={18} color={colors.primary} />
                    <Text style={styles.restoreButtonText}>
                        {isPurchasing ? 'Processing...' : 'Restore Purchases'}
                    </Text>
                </TouchableOpacity>

                {/* Footer Info */}
                <View style={styles.footer}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
                    <Text style={styles.footerText}>
                        Credits never expire. Purchases are synced across devices.
                    </Text>
                </View>

                {/* DEV TEST MODE PANEL - Remove before production */}
                {DEV_MODE && (
                    <View style={styles.devPanel}>
                        <View style={styles.devPanelHeader}>
                            <Ionicons name="construct" size={20} color="#FF6B6B" />
                            <Text style={styles.devPanelTitle}>🔧 DEV TEST MODE</Text>
                        </View>
                        <Text style={styles.devPanelSubtitle}>
                            Recovery Code: {recoveryCode || 'Loading...'}
                        </Text>

                        <View style={styles.devButtonRow}>
                            <TouchableOpacity
                                style={styles.devButton}
                                onPress={() => {
                                    addCredits(100, `dev_test_${Date.now()}`);
                                    Alert.alert('✅ Dev Mode', '100 test credits added!');
                                }}
                            >
                                <Text style={styles.devButtonText}>+100 Credits</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.devButton}
                                onPress={() => {
                                    addCredits(500, `dev_test_${Date.now()}`);
                                    Alert.alert('✅ Dev Mode', '500 test credits added!');
                                }}
                            >
                                <Text style={styles.devButtonText}>+500 Credits</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.devButton}
                                onPress={() => {
                                    addCredits(1000, `dev_test_${Date.now()}`);
                                    Alert.alert('✅ Dev Mode', '1000 test credits added!');
                                }}
                            >
                                <Text style={styles.devButtonText}>+1000 Credits</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.devButton, { backgroundColor: '#4CAF50', marginTop: 8 }]}
                            onPress={async () => {
                                await syncBalance();
                                Alert.alert('✅ Synced', 'Credits synced from server!');
                            }}
                        >
                            <Text style={styles.devButtonText}>🔄 Sync from Server</Text>
                        </TouchableOpacity>

                        <Text style={[styles.devPanelSubtitle, { marginTop: 12, color: '#FF6B6B' }]}>
                            ⚠️ Remove DEV_MODE before production!
                        </Text>
                    </View>
                )}
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
    },
    balanceCard: {
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
        elevation: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        fontWeight: '600',
    },
    balanceValue: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '800',
        marginTop: 4,
    },
    balanceMain: {
        flex: 1,
    },
    creditBreakdown: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 16,
    },
    creditType: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    creditDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    creditTypeText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: '600',
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,215,0,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    proBadgeText: {
        color: '#FFD700',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    walletIcon: {
        opacity: 0.9,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    sectionSubtitle: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 12,
    },
    infoCard: {
        width: (width - 52) / 2,
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        alignItems: 'center',
    },
    infoLabel: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'center',
    },
    infoCost: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
    },
    packCard: {
        backgroundColor: colors.surface,
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: colors.glassBorder,
        position: 'relative',
        overflow: 'hidden',
    },
    packCardPopular: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    packCardBestValue: {
        borderColor: colors.success,
        borderWidth: 2,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderBottomLeftRadius: 12,
    },
    bestValueBadge: {
        backgroundColor: colors.success,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    packMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    packIconContainer: {
        marginRight: 16,
    },
    packIconGradient: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    packInfo: {
        flex: 1,
    },
    packName: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '700',
    },
    creditRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        gap: 8,
    },
    packCredits: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    bonusText: {
        color: colors.success,
        fontSize: 12,
        fontWeight: '700',
        backgroundColor: `${colors.success}15`,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    packDescription: {
        color: colors.textMuted,
        fontSize: 12,
        marginTop: 4,
    },
    packPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    packPrice: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '800',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingBottom: 40,
        opacity: 0.6,
    },
    footerText: {
        color: colors.textMuted,
        fontSize: 12,
        textAlign: 'center',
        maxWidth: '80%',
    },
    // Subscription Card Styles
    subscriptionCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
        borderColor: '#FFD700',
        position: 'relative',
        overflow: 'hidden',
    },
    subscriptionBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFD700',
        paddingVertical: 6,
        alignItems: 'center',
    },
    subscriptionBadgeText: {
        color: '#000',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    subscriptionMain: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 24,
    },
    subscriptionIconContainer: {
        marginRight: 16,
    },
    subscriptionIconGradient: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subscriptionInfo: {
        flex: 1,
    },
    subscriptionName: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '600',
        fontStyle: 'italic',
    },
    subscriptionPriceMain: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '700',
        marginTop: 2,
    },
    subscriptionCardRecommended: {
        borderColor: '#FFD700',
        borderWidth: 2,
    },
    subscriptionPriceContainer: {
        alignItems: 'flex-end',
    },
    subscriptionPerWeek: {
        color: colors.text,
        fontSize: 20,
        fontWeight: '800',
    },
    subscriptionPeriod: {
        color: colors.textMuted,
        fontSize: 12,
    },
    // Daily Gifts Styles
    dailyGiftsCard: {
        backgroundColor: '#E8F5E9',
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    dailyGiftsHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    dailyGiftsTitle: {
        color: '#2E7D32',
        fontSize: 22,
        fontWeight: '800',
    },
    dailyGiftsSubtitle: {
        color: '#4CAF50',
        fontSize: 13,
        marginTop: 4,
    },
    streakGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    streakDay: {
        width: (width - 80) / 5,
        aspectRatio: 0.9,
        backgroundColor: '#fff',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#C8E6C9',
    },
    streakDayBonus: {
        borderColor: '#FFD700',
        borderWidth: 2,
        backgroundColor: '#FFFDE7',
    },
    streakDayCompleted: {
        backgroundColor: '#C8E6C9',
        borderColor: '#4CAF50',
    },
    streakDayToday: {
        borderColor: '#4CAF50',
        borderWidth: 2,
    },
    streakCreditsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    streakCredits: {
        color: '#2E7D32',
        fontSize: 16,
        fontWeight: '700',
    },
    streakCreditsBonus: {
        color: '#F57C00',
        fontSize: 18,
    },
    streakDayLabel: {
        color: '#666',
        fontSize: 10,
        marginTop: 4,
        fontWeight: '600',
    },
    streakDayLabelCompleted: {
        color: '#4CAF50',
    },
    checkInButton: {
        marginTop: 4,
    },
    checkInButtonDisabled: {
        opacity: 0.7,
    },
    checkInButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    checkInButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    // Recovery Code Styles
    recoveryCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    recoveryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    recoveryTitle: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '700',
    },
    recoverySubtitle: {
        color: colors.textSecondary,
        fontSize: 13,
        marginBottom: 16,
    },
    recoveryCodeContainer: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    recoveryCodeText: {
        color: colors.text,
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: 3,
        fontFamily: 'monospace',
    },
    copyButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
    },
    copyButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    // Restore button styles
    restoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
        marginTop: 8,
    },
    restoreButtonText: {
        color: colors.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    // DEV Panel Styles
    devPanel: {
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 16,
        marginTop: 20,
        marginBottom: 30,
        borderWidth: 2,
        borderColor: '#FF6B6B',
    },
    devPanelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    devPanelTitle: {
        color: '#FF6B6B',
        fontSize: 16,
        fontWeight: '700',
    },
    devPanelSubtitle: {
        color: '#888',
        fontSize: 12,
        marginBottom: 12,
    },
    devButtonRow: {
        flexDirection: 'row',
        gap: 8,
    },
    devButton: {
        flex: 1,
        backgroundColor: '#FF6B6B',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    devButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});
