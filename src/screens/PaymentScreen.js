import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
    ActivityIndicator,
    Linking,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import PurchaseService, { PRODUCT_IDS } from '../services/PurchaseService';

const { width } = Dimensions.get('window');

// Subscription Plans (Exact match from CreditsScreen)
const SUBSCRIPTION_PLANS = [
    {
        id: PRODUCT_IDS.MONTHLY_SUBSCRIPTION,
        name: 'Monthly Plan',
        price: '$6.99',
        period: '/month',
        description: 'Best value for regular users',
        save: 'Recommended',
        features: ['Extended AI usage', 'No ads', 'Priority processing'],
    },
    {
        id: PRODUCT_IDS.WEEKLY_SUBSCRIPTION,
        name: 'Weekly Plan',
        price: '$2.99',
        period: '/week',
        description: 'Flexible commitment',
        save: null,
        features: ['Weekly AI credits', 'No ads', 'Priority processing'],
    },
];

// Credit Packs (Exact match from CreditsScreen)
const CREDIT_PACKS = [
    {
        id: PRODUCT_IDS.LITE_PACK,
        name: 'Lite Pack',
        credits: 100,
        price: '₹49',
        description: 'Great for small tasks',
        save: null,
    },
    {
        id: PRODUCT_IDS.POWER_PACK,
        name: 'Power Pack',
        credits: 350,
        price: '₹99',
        description: 'Most popular choice',
        popular: true,
        save: 'Popular',
    },
    {
        id: PRODUCT_IDS.PRO_PACK,
        name: 'Pro Pack',
        credits: 550,
        price: '₹179',
        description: 'Great value for regulars',
        save: null,
    },
    {
        id: PRODUCT_IDS.ELITE_PACK,
        name: 'Elite Pack',
        credits: 900,
        price: '₹299',
        description: 'For power users',
        save: null,
    },
    {
        id: PRODUCT_IDS.ULTIMATE_PACK,
        name: 'Ultimate Pack',
        credits: 1800,
        price: '₹549',
        description: 'Maximum savings',
        save: null,
    },
    {
        id: PRODUCT_IDS.MEGA_PACK,
        name: 'Mega Pack',
        credits: 3500,
        price: '₹999',
        description: 'For professionals',
        save: null,
    },
    {
        id: PRODUCT_IDS.SUPREME_PACK,
        name: 'Supreme Pack',
        credits: 5000,
        price: '₹2999',
        description: 'Unlimited power',
        save: 'Best Value',
    },
];

const FEATURES = [
    { icon: 'infinite', title: 'Unlimited Notes', description: 'Create without limits' },
    { icon: 'flash', title: 'Smart AI Replies', description: 'Intelligent suggestions' },
    { icon: 'ban', title: 'Ad-Free', description: 'Zero distractions' },
];

export default function PaymentScreen({ navigation }) {
    const { colors } = useTheme();
    const { getCreditData } = useUser();
    const credits = getCreditData();
    const styles = createStyles(colors);
    const [activeTab, setActiveTab] = useState('subscriptions'); // 'subscriptions' | 'credits'
    const [selectedPlan, setSelectedPlan] = useState(PRODUCT_IDS.MONTHLY_SUBSCRIPTION);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [rcPackages, setRcPackages] = useState({});

    // Fetch RevenueCat offerings on mount
    useEffect(() => {
        const loadPrices = async () => {
            // Initialize RevenueCat first
            await PurchaseService.initializePurchases();

            const offeringsResult = await PurchaseService.getOfferings();
            if (offeringsResult.success) {
                const packages = {};
                if (offeringsResult.offerings?.availablePackages) {
                    offeringsResult.offerings.availablePackages.forEach(pkg => {
                        packages[pkg.product.identifier] = {
                            price: pkg.product.priceString,
                        };
                    });
                }
                if (offeringsResult.all) {
                    Object.values(offeringsResult.all).forEach(offering => {
                        if (offering.availablePackages) {
                            offering.availablePackages.forEach(pkg => {
                                if (!packages[pkg.product.identifier]) {
                                    packages[pkg.product.identifier] = {
                                        price: pkg.product.priceString,
                                    };
                                }
                            });
                        }
                    });
                }
                setRcPackages(packages);
            }
        };
        loadPrices();
    }, []);

    // Switch default selection when tab changes
    useEffect(() => {
        if (activeTab === 'subscriptions') {
            setSelectedPlan(PRODUCT_IDS.MONTHLY_SUBSCRIPTION);
        } else {
            setSelectedPlan(PRODUCT_IDS.POWER_PACK);
        }
    }, [activeTab]);

    // Helper to get price from RevenueCat or fallback
    const getPrice = (productId, fallbackPrice) => {
        if (rcPackages[productId]) {
            return rcPackages[productId].price;
        }
        return fallbackPrice;
    };

    const handleClose = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.replace('MainTabs');
        }
    };

    const handlePurchase = async () => {
        if (isPurchasing) return;
        setIsPurchasing(true);

        try {
            const result = await PurchaseService.purchaseProduct(selectedPlan);

            if (result.success) {
                Alert.alert('Success', 'Purchase successful!');
                handleClose();
            } else if (!result.cancelled) {
                Alert.alert('Error', result.error || 'Purchase failed');
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Something went wrong');
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleRestorePurchases = async () => {
        try {
            const result = await PurchaseService.restorePurchases();
            Alert.alert('Success', result.success ? 'Purchases restored' : 'No purchases found');
        } catch (e) {
            Alert.alert('Error', 'Failed to restore');
        }
    };

    const handleTerms = () => credits.appConfig?.termsUrl && Linking.openURL(credits.appConfig.termsUrl);
    const handlePrivacy = () => credits.appConfig?.privacyUrl && Linking.openURL(credits.appConfig.privacyUrl);

    const renderCardContent = (plan, isSelected, isCredit) => (
        <>
            <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                    <Text style={[styles.planName, isSelected && styles.textWhite]}>{plan.name}</Text>
                    {plan.save && (
                        <View style={[styles.saveBadge, isSelected ? styles.saveBadgeWhite : styles.saveBadgePrimary]}>
                            <Text style={[styles.saveText, isSelected ? styles.textPrimary : styles.textWhite]}>{plan.save}</Text>
                        </View>
                    )}
                </View>
                <View style={[styles.radio, isSelected ? styles.radioSelected : styles.radioUnselected]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                </View>
            </View>
            <View style={styles.priceContainer}>
                <Text style={[styles.priceAmount, isSelected && styles.textWhite]}>{getPrice(plan.id, plan.price)}</Text>
                {plan.period && <Text style={[styles.pricePeriod, isSelected && styles.textWhiteOpacity]}>{plan.period}</Text>}
            </View>
            <Text style={[styles.planDesc, isSelected && styles.textWhiteOpacity]}>{plan.description}</Text>
            {isCredit && <Text style={[styles.creditAmount, isSelected && styles.textWhite]}>{plan.credits} Credits</Text>}
        </>
    );

    const PlanCard = ({ plan, isCredit }) => {
        const isSelected = selectedPlan === plan.id;
        return (
            <TouchableOpacity
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.9}
                style={[styles.planCardContainer, isSelected && styles.planCardSelectedShadow]}
            >
                {isSelected ? (
                    <LinearGradient colors={colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.planCard}>
                        {renderCardContent(plan, true, isCredit)}
                    </LinearGradient>
                ) : (
                    <View style={[styles.planCard, styles.planCardUnselected]}>
                        {renderCardContent(plan, false, isCredit)}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.navBar}>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Premium Access</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <View style={styles.hero}>
                    <View style={styles.iconRing}>
                        <LinearGradient colors={colors.gradientPrimary} style={styles.iconCircle}>
                            <Ionicons name="diamond" size={42} color="#fff" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.heroTitle}>Unlock Full Potential</Text>
                    <Text style={styles.heroSubtitle}>Get unlimited power with AI Notes Pro</Text>
                </View>

                {/* Toggle Switch */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, activeTab === 'subscriptions' && styles.toggleBtnActive]}
                        onPress={() => setActiveTab('subscriptions')}
                    >
                        <Text style={[styles.toggleText, activeTab === 'subscriptions' && styles.toggleTextActive]}>Subscriptions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, activeTab === 'credits' && styles.toggleBtnActive]}
                        onPress={() => setActiveTab('credits')}
                    >
                        <Text style={[styles.toggleText, activeTab === 'credits' && styles.toggleTextActive]}>Buy Credits</Text>
                    </TouchableOpacity>
                </View>

                {/* Benefits Grid (Only for subscriptions) */}
                {activeTab === 'subscriptions' && (
                    <View style={styles.featuresGrid}>
                        {FEATURES.map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <View style={[styles.featureIconBox, { backgroundColor: `${colors.primary}15` }]}>
                                    <Ionicons name={feature.icon} size={22} color={colors.primary} />
                                </View>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDesc}>{feature.description}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Plans List */}
                <Text style={styles.sectionHeader}>
                    {activeTab === 'subscriptions' ? 'Choose a Plan' : 'Select Credit Pack'}
                </Text>

                <View style={styles.plansContainer}>
                    {activeTab === 'subscriptions' ? (
                        <>
                            {SUBSCRIPTION_PLANS.map(plan => (
                                <PlanCard key={plan.id} plan={plan} />
                            ))}

                            {/* Footer Links - Only for Subscriptions */}
                            <View style={styles.inlineFooterLinks}>
                                <View style={styles.footerLinksRow}>
                                    <TouchableOpacity onPress={handlePrivacy}>
                                        <Text style={styles.footerLinkText}>Privacy</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.footerLinkDivider}>•</Text>
                                    <TouchableOpacity onPress={handleTerms}>
                                        <Text style={styles.footerLinkText}>Terms</Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity onPress={handleRestorePurchases} style={styles.restoreButtonInline}>
                                    <Text style={styles.restoreLinkInline}>Restore Purchases</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        CREDIT_PACKS.map(pack => (
                            <PlanCard key={pack.id} plan={pack} isCredit={true} />
                        ))
                    )}
                </View>

                {/* Trust Badges */}
                <View style={styles.trustRow}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={colors.textMuted} />
                    <Text style={styles.trustText}>Cancel anytime • Secure payment</Text>
                </View>

                <View style={styles.spacer} />
            </ScrollView>

            {/* Sticky Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={handlePurchase}
                    activeOpacity={0.8}
                    disabled={isPurchasing}
                >
                    <LinearGradient
                        colors={colors.gradientPrimary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.checkoutButton}
                    >
                        {isPurchasing ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.checkoutText}>
                                    {activeTab === 'subscriptions' ? 'Start Subscription' : 'Buy Credits'}
                                </Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 10,
    },
    closeButton: {
        padding: 4,
    },
    navTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingBottom: 180,
    },
    hero: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconRing: {
        padding: 8,
        borderRadius: 50,
        backgroundColor: `${colors.primary}10`,
        marginBottom: 16,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    toggleBtnActive: {
        backgroundColor: colors.primary,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMuted,
    },
    toggleTextActive: {
        color: '#fff',
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 32,
    },
    featureItem: {
        width: '48%',
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    featureIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 12,
        color: colors.textMuted,
        lineHeight: 16,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
    },
    plansContainer: {
        gap: 12,
        marginBottom: 24,
    },
    planCardContainer: {
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    planCardSelectedShadow: {
        shadowColor: colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    planCard: {
        padding: 20,
        borderRadius: 20,
    },
    planCardUnselected: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardInfo: {
        flex: 1,
    },
    planName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 6,
    },
    saveBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    saveBadgePrimary: {
        backgroundColor: `${colors.primary}15`,
    },
    saveBadgeWhite: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    saveText: {
        fontSize: 11,
        fontWeight: '700',
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    radioUnselected: {
        borderColor: colors.textMuted,
        opacity: 0.3,
    },
    radioSelected: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        marginBottom: 4,
    },
    priceAmount: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
    },
    pricePeriod: {
        fontSize: 14,
        color: colors.textMuted,
        fontWeight: '600',
    },
    planDesc: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    creditAmount: {
        marginTop: 8,
        fontSize: 15,
        fontWeight: '700',
        color: colors.primary,
    },
    textWhite: {
        color: '#fff',
    },
    textWhiteOpacity: {
        color: 'rgba(255,255,255,0.8)',
    },
    textPrimary: {
        color: colors.primary,
    },
    trustRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginBottom: 20,
    },
    trustText: {
        color: colors.textMuted,
        fontSize: 13,
    },
    spacer: {
        height: 40,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.background,
        padding: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: colors.glassBorder,
    },
    checkoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 18,
        borderRadius: 18,
        gap: 8,
        marginBottom: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    checkoutText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    inlineFooterLinks: {
        marginTop: 24,
        alignItems: 'center',
        gap: 16,
    },
    restoreButtonInline: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: `${colors.primary}10`,
        borderRadius: 20,
    },
    restoreLinkInline: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    footerLinksRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    footerLinkText: {
        color: colors.textMuted,
        fontSize: 13,
    },
    footerLinkDivider: {
        color: colors.textMuted,
        fontSize: 13,
    },
});
