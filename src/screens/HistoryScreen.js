import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useHistory } from '../context/HistoryContext';
import { useStaggerAnimation, AnimatedSection } from '../hooks/useStaggerAnimation';

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'notes', label: 'Notes' },
    { id: 'replies', label: 'Replies' },
];

const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
};

const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export default function HistoryScreen({ navigation }) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { notes, replies } = useHistory();
    const styles = createStyles(colors, insets);
    const { fadeAnims, slideAnims } = useStaggerAnimation(3);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    // Combine and filter items
    const filteredItems = useMemo(() => {
        let items = [];

        if (activeFilter === 'all' || activeFilter === 'notes') {
            items = [...items, ...notes.map(n => ({ ...n, type: 'note' }))];
        }
        if (activeFilter === 'all' || activeFilter === 'replies') {
            items = [...items, ...replies.map(r => ({ ...r, type: 'reply' }))];
        }

        // Sort by date (newest first)
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.content?.toLowerCase().includes(query) ||
                item.input?.toLowerCase().includes(query)
            );
        }

        return items;
    }, [notes, replies, activeFilter, searchQuery]);

    // Group by date
    const groupedItems = useMemo(() => {
        const groups = {};
        filteredItems.forEach(item => {
            const dateKey = formatDate(item.createdAt);
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(item);
        });
        return Object.entries(groups).map(([date, items]) => ({ date, items }));
    }, [filteredItems]);

    const renderItem = ({ item: group }) => (
        <View style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{group.date}</Text>
            {group.items.map((item, index) => (
                <TouchableOpacity
                    key={item.id}
                    style={styles.itemCard}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('NoteDetail', { item, type: item.type })}
                >
                    <View style={[styles.itemIcon, { backgroundColor: item.type === 'note' ? `${colors.primary}20` : `${colors.secondary}20` }]}>
                        <Ionicons
                            name={item.type === 'note' ? 'document-text' : 'chatbubble'}
                            size={18}
                            color={item.type === 'note' ? colors.primary : colors.secondary}
                        />
                    </View>
                    <View style={styles.itemContent}>
                        <Text style={styles.itemText} numberOfLines={2}>
                            {item.content?.substring(0, 100)}
                        </Text>
                        <Text style={styles.itemTime}>
                            {formatTime(item.createdAt)} • {item.type === 'note' ? 'Note' : 'Reply'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>History</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <AnimatedSection fadeAnim={fadeAnims[0]} slideAnim={slideAnims[0]} style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search notes and replies..."
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </AnimatedSection>

            {/* Filter Tabs */}
            <AnimatedSection fadeAnim={fadeAnims[1]} slideAnim={slideAnims[1]} style={styles.filterContainer}>
                {FILTERS.map((filter) => (
                    <TouchableOpacity
                        key={filter.id}
                        style={[
                            styles.filterTab,
                            activeFilter === filter.id && styles.filterTabActive
                        ]}
                        onPress={() => setActiveFilter(filter.id)}
                    >
                        <Text style={[
                            styles.filterText,
                            activeFilter === filter.id && styles.filterTextActive
                        ]}>
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </AnimatedSection>

            {/* Results Count */}
            <AnimatedSection fadeAnim={fadeAnims[2]} slideAnim={slideAnims[2]} style={styles.resultsContainer}>
                <Text style={styles.resultsText}>
                    {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                </Text>
            </AnimatedSection>

            {/* List */}
            {filteredItems.length > 0 ? (
                <FlatList
                    data={groupedItems}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.date}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="file-tray-outline" size={60} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>No items found</Text>
                    <Text style={styles.emptySubtitle}>
                        {searchQuery ? 'Try a different search term' : 'Create your first note or reply!'}
                    </Text>
                </View>
            )}
        </View>
    );
}

const createStyles = (colors, insets) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: insets.top + 10,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    searchContainer: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 10,
        marginBottom: 12,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.surface,
    },
    filterTabActive: {
        backgroundColor: colors.primary,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMuted,
    },
    filterTextActive: {
        color: '#fff',
    },
    resultsContainer: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    resultsText: {
        fontSize: 13,
        color: colors.textMuted,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: insets.bottom + 20,
    },
    dateGroup: {
        marginBottom: 20,
    },
    dateHeader: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textMuted,
        marginBottom: 10,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        gap: 12,
    },
    itemIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContent: {
        flex: 1,
    },
    itemText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
        lineHeight: 20,
    },
    itemTime: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: 8,
    },
});
