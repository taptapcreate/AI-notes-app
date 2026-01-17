import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useHistory } from '../context/HistoryContext';
import { useUser } from '../context/UserContext';
import Markdown from 'react-native-markdown-display';
import { BannerAd, BannerAdSize, adUnitIDs, areAdsEnabled } from '../services/AdService';
import { lightTap } from '../utils/haptics';

const { width } = Dimensions.get('window');

// Calculate estimated time saved based on usage
// Assumption: Each AI note saves ~5 min, each reply saves ~3 min of manual work
const getTimeSaved = (stats) => {
    const notesTime = stats.totalNotes * 5; // 5 min per note
    const repliesTime = stats.totalReplies * 3; // 3 min per reply
    const totalMinutes = notesTime + repliesTime;

    if (totalMinutes < 60) {
        return { value: totalMinutes, unit: 'min', display: `${totalMinutes} min` };
    } else {
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        if (mins === 0) {
            return { value: hours, unit: 'hr', display: `${hours} hr` };
        }
        return { value: hours, unit: 'hr', display: `${hours}hr ${mins}min` };
    }
};

const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
};

export default function HomeScreen({ navigation }) {
    const { colors } = useTheme();
    const { notes, replies, getStats } = useHistory();
    const { getCreditData } = useUser();
    const stats = getStats();
    const timeSaved = getTimeSaved(stats);
    const styles = createStyles(colors);
    const credits = getCreditData();

    // Stagger animation values for each section
    const fadeAnims = React.useRef([
        new Animated.Value(0), // Greeting
        new Animated.Value(0), // Credits
        new Animated.Value(0), // Quick Actions
        new Animated.Value(0), // Quick Start
        new Animated.Value(0), // Stats
        new Animated.Value(0), // Recent Activity
        new Animated.Value(0), // Tip
    ]).current;

    const slideAnims = React.useRef([
        new Animated.Value(30),
        new Animated.Value(30),
        new Animated.Value(30),
        new Animated.Value(30),
        new Animated.Value(30),
        new Animated.Value(30),
        new Animated.Value(30),
    ]).current;

    // Run stagger animation on mount
    React.useEffect(() => {
        const animations = fadeAnims.map((fadeAnim, index) =>
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    delay: index * 100,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnims[index], {
                    toValue: 0,
                    duration: 400,
                    delay: index * 100,
                    useNativeDriver: true,
                }),
            ])
        );
        Animated.stagger(100, animations).start();
    }, []);

    // Helper component for animated sections
    const AnimatedSection = ({ index, children, style }) => (
        <Animated.View style={[
            style,
            {
                opacity: fadeAnims[index],
                transform: [{ translateY: slideAnims[index] }],
            }
        ]}>
            {children}
        </Animated.View>
    );

    // Get recent items (last 3)
    const recentNotes = notes.slice(0, 3);
    const recentReplies = replies.slice(0, 3);

    // Markdown styles
    const markdownStyles = {
        body: { color: colors.text, fontSize: 13, lineHeight: 20 },
        paragraph: { marginBottom: 4 },
        strong: { color: colors.primary, fontWeight: '600' },
        heading1: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4, marginTop: 0 },
        heading2: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4, marginTop: 0 },
        heading3: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 4, marginTop: 0 },
        bullet_list: { marginBottom: 0 },
    };

    const QuickAction = ({ icon, label, gradient, onPress }) => {
        const scaleAnim = React.useRef(new Animated.Value(1)).current;

        const handlePressIn = () => {
            Animated.spring(scaleAnim, {
                toValue: 0.88,
                useNativeDriver: true,
                speed: 50,
            }).start();
        };

        const handlePressOut = () => {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                speed: 15,
                bounciness: 12,
            }).start();
        };

        const handlePress = () => {
            lightTap();
            onPress();
        };

        return (
            <Animated.View style={[styles.quickAction, { transform: [{ scale: scaleAnim }] }]}>
                <TouchableOpacity
                    onPress={handlePress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={0.9}
                    style={{ alignItems: 'center' }}
                >
                    <LinearGradient colors={gradient} style={styles.quickActionIcon}>
                        <Ionicons name={icon} size={24} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.quickActionLabel}>{label}</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const StatCard = ({ icon, value, label, color }) => (
        <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon} size={18} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    const RecentCard = ({ item, type }) => {
        const handlePress = () => {
            navigation.navigate('NoteDetail', { item, type });
        };

        const isNote = type === 'note';

        return (
            <TouchableOpacity style={styles.recentCard} activeOpacity={0.7} onPress={handlePress}>
                <LinearGradient
                    colors={isNote ? [`${colors.primary}15`, `${colors.primary}05`] : [`${colors.secondary}15`, `${colors.secondary}05`]}
                    style={styles.recentCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                >
                    <View style={styles.recentCardHeader}>
                        <View style={[styles.recentIcon, { backgroundColor: isNote ? colors.primary : colors.secondary }]}>
                            <Ionicons
                                name={isNote ? 'document-text' : 'chatbubble'}
                                size={12}
                                color="#fff"
                            />
                        </View>
                        <Text style={styles.recentDate}>{formatDate(item.createdAt).split(',')[0]}</Text>
                    </View>

                    <Text style={styles.recentContent} numberOfLines={4}>
                        {item.content}
                    </Text>

                    <View style={styles.recentFooter}>
                        <Text style={[styles.recentType, { color: isNote ? colors.primary : colors.secondary }]}>
                            {isNote ? 'Smart Note' : 'AI Reply'}
                        </Text>
                        <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Top Banner Ad - Hidden for Pro subscribers */}
            {areAdsEnabled && !credits.hasProSubscription && (
                <View style={{ alignItems: 'center', paddingVertical: 8, backgroundColor: colors.background }}>
                    <BannerAd
                        unitId={adUnitIDs.banner}
                        size={BannerAdSize.BANNER}
                        requestOptions={{
                            requestNonPersonalizedAdsOnly: true,
                        }}
                    />
                </View>
            )}

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Usage Insights */}
                <AnimatedSection index={0} style={styles.insightsSection}>
                    <View style={styles.insightsHeader}>
                        <Ionicons name="sparkles" size={24} color={colors.primary} />
                        <Text style={styles.insightsTitle}>Your AI Impact</Text>
                    </View>
                    <View style={styles.insightsCard}>
                        <LinearGradient
                            colors={[`${colors.primary}15`, `${colors.secondary}10`]}
                            style={styles.insightsGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.timeSavedContainer}>
                                <Ionicons name="time-outline" size={32} color={colors.primary} />
                                <View style={styles.timeSavedText}>
                                    <Text style={styles.timeSavedValue}>{timeSaved.display}</Text>
                                    <Text style={styles.timeSavedLabel}>saved using AI</Text>
                                </View>
                            </View>
                            <View style={styles.insightsStats}>
                                <View style={styles.insightsStat}>
                                    <Text style={styles.insightsStatValue}>{stats.totalNotes}</Text>
                                    <Text style={styles.insightsStatLabel}>Notes</Text>
                                </View>
                                <View style={[styles.insightsDivider, { backgroundColor: colors.glassBorder }]} />
                                <View style={styles.insightsStat}>
                                    <Text style={styles.insightsStatValue}>{stats.totalReplies}</Text>
                                    <Text style={styles.insightsStatLabel}>Replies</Text>
                                </View>
                                <View style={[styles.insightsDivider, { backgroundColor: colors.glassBorder }]} />
                                <View style={styles.insightsStat}>
                                    <Text style={styles.insightsStatValue}>{stats.notesToday + stats.repliesToday}</Text>
                                    <Text style={styles.insightsStatLabel}>Today</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>
                </AnimatedSection>

                {/* Credits Summary */}
                <AnimatedSection index={1}>
                    <TouchableOpacity
                        style={styles.creditsSummary}
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate('Credits')}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            style={styles.creditsGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <View style={{ flex: 1 }}>
                                {credits.hasProSubscription ? (
                                    <View>
                                        <View style={styles.creditDisplayRow}>
                                            <Ionicons name="infinite" size={20} color="#fff" style={{ opacity: 0.9 }} />
                                            <Text style={[styles.creditValueMain, { fontSize: 20 }]}>Unlimited Access</Text>
                                        </View>
                                        {(credits.purchasedCredits > 0) && (
                                            <View style={[styles.creditDisplayRow, { marginTop: 4 }]}>
                                                <Ionicons name="wallet" size={16} color="#fff" style={{ opacity: 0.9 }} />
                                                <Text style={styles.creditLabelText}>Purchased:</Text>
                                                <Text style={styles.creditValueSub}>{credits.purchasedCredits}</Text>
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <>
                                        <View style={styles.creditDisplayRow}>
                                            <Ionicons name="flash" size={16} color="#fff" style={{ opacity: 0.9 }} />
                                            <Text style={styles.creditLabelText}>Daily Free:</Text>
                                            <Text style={styles.creditValueMain}>{credits.remainingFree}</Text>
                                        </View>
                                        {(credits.purchasedCredits > 0) && (
                                            <View style={[styles.creditDisplayRow, { marginTop: 4 }]}>
                                                <Ionicons name="wallet" size={16} color="#fff" style={{ opacity: 0.9 }} />
                                                <Text style={styles.creditLabelText}>Purchased:</Text>
                                                <Text style={styles.creditValueSub}>{credits.purchasedCredits}</Text>
                                            </View>
                                        )}
                                    </>
                                )}
                            </View>
                            <View style={styles.creditsAction}>
                                <Ionicons name="add-circle" size={32} color="#fff" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </AnimatedSection>

                {/* Quick Actions */}
                <AnimatedSection index={2} style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActions}>
                        <QuickAction
                            icon="text"
                            label="New Note"
                            gradient={colors.gradientPrimary}
                            onPress={() => navigation.navigate('Notes')}
                        />
                        <QuickAction
                            icon="camera"
                            label="Scan"
                            gradient={colors.gradientAccent}
                            onPress={() => navigation.navigate('Notes')}
                        />
                        <QuickAction
                            icon="chatbubble"
                            label="Reply"
                            gradient={colors.gradientSecondary}
                            onPress={() => navigation.navigate('Reply')}
                        />
                    </View>
                </AnimatedSection>

                {/* Quick Start Templates */}
                <AnimatedSection index={3} style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Start</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                        style={{ marginHorizontal: -16 }}
                    >
                        {[
                            { id: 'email', icon: 'mail', label: 'Email', color: '#3B82F6' },
                            { id: 'blog', icon: 'newspaper', label: 'Blog', color: '#10B981' },
                            { id: 'grammar', icon: 'hammer', label: 'Fix', color: '#F59E0B' },
                            { id: 'social', icon: 'share-social', label: 'Social', color: '#8B5CF6' },
                            { id: 'summary', icon: 'list', label: 'Summary', color: '#EC4899' },
                        ].map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.quickStartChip, { backgroundColor: `${item.color}15`, borderColor: `${item.color}30` }]}
                                onPress={() => navigation.navigate('Notes')}
                            >
                                <Ionicons name={item.icon} size={16} color={item.color} />
                                <Text style={[styles.quickStartLabel, { color: item.color }]}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </AnimatedSection>

                {/* Stats */}
                <AnimatedSection index={4} style={styles.section}>
                    <Text style={styles.sectionTitle}>Today's Activity</Text>
                    <View style={styles.statsRow}>
                        <StatCard icon="document-text" value={stats.notesToday} label="Notes" color={colors.primary} />
                        <StatCard icon="chatbubble" value={stats.repliesToday} label="Replies" color={colors.secondary} />
                        <StatCard icon="layers" value={stats.totalNotes + stats.totalReplies} label="Total" color={colors.accent} />
                    </View>
                </AnimatedSection>

                {/* Recent Activity */}
                {(recentNotes.length > 0 || recentReplies.length > 0) && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Activity</Text>
                            {/* Always show See All when there are items */}
                            <TouchableOpacity onPress={() => navigation.navigate('History')}>
                                <Text style={styles.seeAll}>See All</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Combine and sort by date */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 16, gap: 16, paddingBottom: 20 }}
                            style={{ marginHorizontal: -16 }}
                        >
                            {[...recentNotes.map(n => ({ ...n, itemType: 'note' })), ...recentReplies.map(r => ({ ...r, itemType: 'reply' }))]
                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                .slice(0, 5)
                                .map((item) => (
                                    <RecentCard key={item.id} item={item} type={item.itemType} />
                                ))
                            }
                            {/* View All Card - always show when there are items */}
                            <TouchableOpacity
                                style={styles.viewAllCard}
                                onPress={() => navigation.navigate('History')}
                                activeOpacity={0.8}
                            >
                                <View style={styles.viewAllIcon}>
                                    <Ionicons name="grid-outline" size={24} color={colors.primary} />
                                </View>
                                <Text style={styles.viewAllText}>View All</Text>
                                <Text style={styles.viewAllCount}>{notes.length + replies.length} items</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                )}

                {/* Empty State */}
                {recentNotes.length === 0 && recentReplies.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="sparkles" size={48} color={colors.primary} />
                        <Text style={styles.emptyTitle}>No activity yet</Text>
                        <Text style={styles.emptySubtext}>Create your first note or reply to get started!</Text>
                    </View>
                )}

                {/* Tips */}
                <View style={styles.tipCard}>
                    <LinearGradient
                        colors={[`${colors.primary}15`, `${colors.secondary}10`]}
                        style={styles.tipGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="bulb-outline" size={24} color={colors.warning} />
                        <View style={styles.tipContent}>
                            <Text style={styles.tipTitle}>Pro Tip</Text>
                            <Text style={styles.tipText}>
                                Use the Image input to extract text from photos of documents or whiteboards!
                            </Text>
                        </View>
                    </LinearGradient>
                </View>

            </ScrollView>

            {/* Bottom Banner Ad - Fixed at bottom, hidden for Pro subscribers */}
            {areAdsEnabled && !credits.hasProSubscription && (
                <View style={{ alignItems: 'center', paddingVertical: 8, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.glassBorder }}>
                    <BannerAd
                        unitId={adUnitIDs.banner}
                        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                        requestOptions={{
                            requestNonPersonalizedAdsOnly: true,
                        }}
                    />
                </View>
            )}
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: 16,
        paddingBottom: 32,
    },
    creditsSummary: {
        marginBottom: 24,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    creditsGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    creditDisplayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    creditLabelText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 15,
        fontWeight: '500',
    },
    creditValueMain: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    creditValueSub: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 16,
        fontWeight: '700',
    },
    creditsAction: {
        marginLeft: 16,
    },
    // Usage Insights Styles
    insightsSection: {
        marginBottom: 16,
    },
    insightsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    insightsTitle: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '700',
    },
    insightsCard: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    insightsGradient: {
        padding: 20,
    },
    timeSavedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
    },
    timeSavedText: {
        flex: 1,
    },
    timeSavedValue: {
        color: colors.primary,
        fontSize: 32,
        fontWeight: '800',
    },
    timeSavedLabel: {
        color: colors.textMuted,
        fontSize: 14,
        fontWeight: '500',
    },
    insightsStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: `${colors.surface}80`,
        borderRadius: 12,
        padding: 16,
    },
    insightsStat: {
        alignItems: 'center',
        flex: 1,
    },
    insightsStatValue: {
        color: colors.text,
        fontSize: 20,
        fontWeight: '700',
    },
    insightsStatLabel: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
    },
    insightsDivider: {
        width: 1,
        height: 30,
        opacity: 0.5,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    seeAll: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    quickAction: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingVertical: 20,
        borderRadius: 16,
    },
    quickActionIcon: {
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    quickActionLabel: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        color: colors.text,
        fontSize: 24,
        fontWeight: '700',
    },
    statLabel: {
        color: colors.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    historyItem: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    historyType: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    historyTypeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    historyTime: {
        color: colors.textMuted,
        fontSize: 12,
    },
    historyContent: {
        maxHeight: 60,
        overflow: 'hidden',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    // Recent Cards
    recentCard: {
        width: 160,
        height: 150,
        backgroundColor: colors.surface,
        borderRadius: 20,
        marginRight: 0,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    recentCardGradient: {
        flex: 1,
        padding: 14,
        justifyContent: 'space-between',
    },
    recentCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    recentIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recentDate: {
        fontSize: 11,
        fontWeight: '500',
        color: colors.textMuted,
        marginTop: 4,
    },
    recentContent: {
        fontSize: 12,
        color: colors.textSecondary,
        lineHeight: 18,
        flex: 1,
    },
    recentFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    recentType: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    emptyTitle: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        color: colors.textMuted,
        fontSize: 14,
        marginTop: 4,
        textAlign: 'center',
    },
    tipCard: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 8,
    },
    tipGradient: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'flex-start',
        gap: 12,
    },
    tipContent: {
        flex: 1,
    },
    tipTitle: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    tipText: {
        color: colors.textSecondary,
        fontSize: 13,
        lineHeight: 18,
    },
    // Quick Start
    quickStartChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
        gap: 6,
    },
    quickStartLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    // View All Card
    viewAllCard: {
        width: 120,
        height: 160,
        backgroundColor: colors.surface,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderStyle: 'dashed',
    },
    viewAllIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: `${colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    viewAllCount: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 4,
    },
});
