import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const PLANS = [
    {
        id: 'weekly',
        name: 'Weekly',
        price: '$2.99',
        period: '/week',
        description: 'Perfect for trying out',
        features: ['Unlimited notes', 'Smart replies', 'Basic support'],
    },
    {
        id: 'monthly',
        name: 'Monthly',
        price: '$7.99',
        period: '/month',
        description: 'Most flexible option',
        features: ['Unlimited notes', 'Smart replies', 'Priority support', 'No ads'],
        popular: true,
    },
    {
        id: 'yearly',
        name: 'Yearly',
        price: '$49.99',
        period: '/year',
        description: 'Save 48%',
        features: ['Unlimited notes', 'Smart replies', 'Priority support', 'No ads', 'Early access features'],
        bestValue: true,
    },
    {
        id: 'lifetime',
        name: 'Lifetime',
        price: '$99.99',
        period: 'one-time',
        description: 'Pay once, use forever',
        features: ['All premium features', 'Lifetime updates', 'VIP support', 'No ads forever', 'All future features'],
    },
];

const FEATURES = [
    { icon: 'infinite-outline', title: 'Unlimited Notes', description: 'Create as many notes as you need' },
    { icon: 'flash-outline', title: 'Smart AI Replies', description: 'Get intelligent reply suggestions' },
    { icon: 'ban-outline', title: 'Ad-Free Experience', description: 'No interruptions, ever' },
    { icon: 'cloud-download-outline', title: 'Cloud Sync', description: 'Access notes on all devices' },
    { icon: 'headset-outline', title: 'Priority Support', description: '24/7 dedicated support' },
    { icon: 'rocket-outline', title: 'Early Access', description: 'Get new features first' },
];

export default function PaymentScreen({ navigation }) {
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const [selectedPlan, setSelectedPlan] = useState('monthly');

    const handlePurchase = () => {
        const plan = PLANS.find(p => p.id === selectedPlan);
        Alert.alert(
            'Purchase',
            `You selected the ${plan.name} plan for ${plan.price}${plan.period !== 'one-time' ? plan.period : ''}.\n\nPayment integration coming soon!`,
            [{ text: 'OK' }]
        );
    };

    const handleRestorePurchases = () => {
        Alert.alert('Restore Purchases', 'Looking for previous purchases...\n\nThis feature will be available once payment is integrated.', [{ text: 'OK' }]);
    };

    const PlanCard = ({ plan }) => {
        const isSelected = selectedPlan === plan.id;

        return (
            <TouchableOpacity
                style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected,
                    plan.popular && styles.planCardPopular,
                ]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.8}
            >
                {plan.popular && (
                    <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>MOST POPULAR</Text>
                    </View>
                )}
                {plan.bestValue && (
                    <View style={[styles.popularBadge, styles.bestValueBadge]}>
                        <Text style={styles.popularText}>BEST VALUE</Text>
                    </View>
                )}

                <View style={styles.planHeader}>
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.planInfo}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planDescription}>{plan.description}</Text>
                    </View>
                    <View style={styles.planPricing}>
                        <Text style={styles.planPrice}>{plan.price}</Text>
                        <Text style={styles.planPeriod}>{plan.period}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const FeatureItem = ({ feature }) => (
        <View style={styles.featureItem}>
            <LinearGradient colors={colors.gradientPrimary} style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={20} color="#fff" />
            </LinearGradient>
            <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <LinearGradient
                        colors={colors.gradientPrimary}
                        style={styles.crownContainer}
                    >
                        <Ionicons name="diamond" size={40} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.headerTitle}>Upgrade to Pro</Text>
                    <Text style={styles.headerSubtitle}>
                        Unlock unlimited potential with premium features
                    </Text>
                </View>

                {/* Plans */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Choose Your Plan</Text>
                    {PLANS.map((plan) => (
                        <PlanCard key={plan.id} plan={plan} />
                    ))}
                </View>

                {/* Features */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>What You'll Get</Text>
                    <View style={styles.featuresCard}>
                        {FEATURES.map((feature, index) => (
                            <React.Fragment key={feature.title}>
                                <FeatureItem feature={feature} />
                                {index < FEATURES.length - 1 && <View style={styles.featureDivider} />}
                            </React.Fragment>
                        ))}
                    </View>
                </View>

                {/* Guarantee */}
                <View style={styles.guaranteeCard}>
                    <Ionicons name="shield-checkmark" size={24} color={colors.success} />
                    <View style={styles.guaranteeContent}>
                        <Text style={styles.guaranteeTitle}>Money-Back Guarantee</Text>
                        <Text style={styles.guaranteeText}>
                            Try Pro risk-free. Full refund within 7 days if you're not satisfied.
                        </Text>
                    </View>
                </View>

                {/* Restore Purchases */}
                <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={handleRestorePurchases}
                    activeOpacity={0.7}
                >
                    <Text style={styles.restoreText}>Restore Purchases</Text>
                </TouchableOpacity>

                {/* Terms */}
                <Text style={styles.termsText}>
                    By subscribing, you agree to our Terms of Service and Privacy Policy.
                    Subscriptions auto-renew unless canceled at least 24 hours before the end of the current period.
                </Text>
            </ScrollView>

            {/* Purchase Button */}
            <View style={styles.purchaseContainer}>
                <TouchableOpacity onPress={handlePurchase} activeOpacity={0.9}>
                    <LinearGradient
                        colors={colors.gradientPrimary}
                        style={styles.purchaseButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.purchaseButtonText}>
                            Continue with {PLANS.find(p => p.id === selectedPlan)?.name}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
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
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 120,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        paddingTop: 10,
    },
    crownContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        color: colors.text,
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 8,
    },
    headerSubtitle: {
        color: colors.textSecondary,
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    planCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: colors.glassBorder,
    },
    planCardSelected: {
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}10`,
    },
    planCardPopular: {
        paddingTop: 32,
    },
    popularBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.primary,
        paddingVertical: 6,
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        alignItems: 'center',
    },
    bestValueBadge: {
        backgroundColor: colors.success,
    },
    popularText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.textMuted,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    radioOuterSelected: {
        borderColor: colors.primary,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.primary,
    },
    planInfo: {
        flex: 1,
    },
    planName: {
        color: colors.text,
        fontSize: 17,
        fontWeight: '700',
    },
    planDescription: {
        color: colors.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
    planPricing: {
        alignItems: 'flex-end',
    },
    planPrice: {
        color: colors.text,
        fontSize: 22,
        fontWeight: '800',
    },
    planPeriod: {
        color: colors.textMuted,
        fontSize: 12,
    },
    featuresCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 8,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '600',
    },
    featureDescription: {
        color: colors.textMuted,
        fontSize: 13,
        marginTop: 2,
    },
    featureDivider: {
        height: 1,
        backgroundColor: colors.glassBorder,
        marginLeft: 70,
    },
    guaranteeCard: {
        flexDirection: 'row',
        backgroundColor: `${colors.success}15`,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        alignItems: 'flex-start',
        gap: 14,
    },
    guaranteeContent: {
        flex: 1,
    },
    guaranteeTitle: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    guaranteeText: {
        color: colors.textSecondary,
        fontSize: 13,
        lineHeight: 18,
    },
    restoreButton: {
        alignItems: 'center',
        padding: 12,
        marginBottom: 12,
    },
    restoreText: {
        color: colors.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    termsText: {
        color: colors.textMuted,
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: 20,
    },
    purchaseContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 34,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.glassBorder,
    },
    purchaseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
        gap: 8,
    },
    purchaseButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
});
