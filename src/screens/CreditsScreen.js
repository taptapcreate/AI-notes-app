import React from 'react';
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
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get('window');

const CREDIT_PACKS = [
    {
        id: 'starter',
        name: 'Lite Pack',
        credits: 100,
        price: '₹49',
        priceValue: 49,
        description: 'Great for small tasks',
        icon: 'flashlight-outline',
        bonus: null,
    },
    {
        id: 'standard',
        name: 'Power Pack',
        credits: 300,
        price: '₹99',
        priceValue: 99,
        description: 'Most popular choice',
        icon: 'flash-outline',
        popular: true,
        bonus: '+50 Bonus',
    },
    {
        id: 'pro',
        name: 'Elite Pack',
        credits: 1000,
        price: '₹249',
        priceValue: 249,
        description: 'For power users',
        icon: 'rocket-outline',
        bonus: '+200 Bonus',
    },
];

const LIMIT_INFO = [
    { label: 'Note Generation', cost: '1 Credit', icon: 'document-text-outline' },
    { label: 'Smart Reply', cost: '1 Credit', icon: 'chatbubbles-outline' },
    { label: 'AI Summarization', cost: '2 Credits', icon: 'list-outline' },
    { label: 'Priority Server', cost: 'Free', icon: 'speedometer-outline' },
];

export default function CreditsScreen({ navigation }) {
    const { colors } = useTheme();
    const { getCreditData, addCredits } = useUser();
    const styles = createStyles(colors);
    const credits = getCreditData();

    const handlePurchase = (pack) => {
        Alert.alert(
            'Confirm Purchase',
            `Buy ${pack.credits} Credits for ${pack.price}?\n\nCredits will be added instantly to your account.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => {
                        addCredits(pack.credits);
                        Alert.alert('Success', `${pack.credits} credits have been added to your account!`);
                    }
                }
            ]
        );
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
                    <View>
                        <Text style={styles.balanceLabel}>Total Available</Text>
                        <Text style={styles.balanceValue}>{credits.totalAvailable} Credits</Text>
                        <Text style={styles.dailyInfo}>
                            Includes {credits.remainingFree} free daily credits
                        </Text>
                    </View>
                    <Ionicons name="wallet-outline" size={40} color="#fff" style={styles.walletIcon} />
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

                {/* Credit Packs */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Buy Credits</Text>
                        <Text style={styles.sectionSubtitle}>Top up your AI power</Text>
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
                                    <Text style={styles.packPrice}>{pack.price}</Text>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Footer Info */}
                <View style={styles.footer}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
                    <Text style={styles.footerText}>
                        Credits never expire. Frequent usage might require more credits.
                    </Text>
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
    dailyInfo: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
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
});
