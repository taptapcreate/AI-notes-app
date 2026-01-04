import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useHistory } from '../context/HistoryContext';
import Markdown from 'react-native-markdown-display';

const { width } = Dimensions.get('window');

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: 'sunny-outline' };
    if (hour < 17) return { text: 'Good Afternoon', icon: 'sunny' };
    if (hour < 21) return { text: 'Good Evening', icon: 'moon-outline' };
    return { text: 'Good Night', icon: 'moon' };
};

// ... (formatDate and imports remain same)

export default function HomeScreen({ navigation }) {
    const { colors } = useTheme();
    const { notes, replies, getStats } = useHistory();
    const greeting = getGreeting();
    const stats = getStats();
    const styles = createStyles(colors);

    // Get recent items (last 3)
    const recentNotes = notes.slice(0, 3);
    const recentReplies = replies.slice(0, 3);

    // Markdown styles
    const markdownStyles = {
        body: { color: colors.text, fontSize: 13, lineHeight: 18 },
        paragraph: { marginBottom: 0 },
        strong: { color: colors.primary, fontWeight: '600' },
    };

    const QuickAction = ({ icon, label, gradient, onPress }) => (
        <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8}>
            <LinearGradient colors={gradient} style={styles.quickActionIcon}>
                <Ionicons name={icon} size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.quickActionLabel}>{label}</Text>
        </TouchableOpacity>
    );

    const StatCard = ({ icon, value, label, color }) => (
        <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon} size={18} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    const HistoryItem = ({ item, type }) => (
        <TouchableOpacity style={styles.historyItem} activeOpacity={0.7}>
            <View style={styles.historyHeader}>
                <View style={[styles.historyType, { backgroundColor: type === 'note' ? `${colors.primary}20` : `${colors.secondary}20` }]}>
                    <Ionicons
                        name={type === 'note' ? 'document-text' : 'chatbubble'}
                        size={12}
                        color={type === 'note' ? colors.primary : colors.secondary}
                    />
                    <Text style={[styles.historyTypeText, { color: type === 'note' ? colors.primary : colors.secondary }]}>
                        {type === 'note' ? 'Note' : 'Reply'}
                    </Text>
                </View>
                <Text style={styles.historyTime}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={styles.historyContent}>
                <Markdown style={markdownStyles}>
                    {item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content}
                </Markdown>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Greeting */}
                <View style={styles.greetingSection}>
                    <Ionicons name={greeting.icon} size={40} color={colors.primary} style={{ marginBottom: 12 }} />
                    <Text style={styles.greetingText}>{greeting.text}!</Text>
                    <Text style={styles.greetingSubtext}>What would you like to create today?</Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
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
                </View>

                {/* Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Today's Activity</Text>
                    <View style={styles.statsRow}>
                        <StatCard icon="document-text" value={stats.notesToday} label="Notes" color={colors.primary} />
                        <StatCard icon="chatbubble" value={stats.repliesToday} label="Replies" color={colors.secondary} />
                        <StatCard icon="layers" value={stats.totalNotes + stats.totalReplies} label="Total" color={colors.accent} />
                    </View>
                </View>

                {/* Recent Activity */}
                {(recentNotes.length > 0 || recentReplies.length > 0) && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Activity</Text>
                            {(notes.length > 3 || replies.length > 3) && (
                                <TouchableOpacity>
                                    <Text style={styles.seeAll}>See All</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Combine and sort by date */}
                        {[...recentNotes.map(n => ({ ...n, itemType: 'note' })), ...recentReplies.map(r => ({ ...r, itemType: 'reply' }))]
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .slice(0, 5)
                            .map((item) => (
                                <HistoryItem key={item.id} item={item} type={item.itemType} />
                            ))
                        }
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
    greetingSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    greetingEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    greetingText: {
        color: colors.text,
        fontSize: 28,
        fontWeight: '700',
    },
    greetingSubtext: {
        color: colors.textSecondary,
        fontSize: 16,
        marginTop: 4,
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
});
