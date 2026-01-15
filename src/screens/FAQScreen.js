import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    LayoutAnimation,
    Platform,
    UIManager,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const FAQS = [
    {
        id: '1',
        category: 'Credits & Plans',
        question: 'How do I earn free credits?',
        answer: 'You can earn free credits by checking in daily. Simply open the app and go to the "Buy Credits" screen to find your daily rewards!'
    },
    {
        id: '2',
        category: 'Credits & Plans',
        question: 'Do my purchased credits expire?',
        answer: 'No, purchased credits never expire. They are added to your permanent balance and remain yours until you use them.'
    },
    {
        id: '3',
        category: 'Credits & Plans',
        question: 'How does the Pro Subscription work?',
        answer: 'The Pro Subscription gives you UNLIMITED AI access for the duration of your plan (Weekly or Monthly). You won\'t need to use credits for generation while your subscription is active. You also get priority processing and zero ads.'
    },
    {
        id: '4',
        category: 'Credits & Plans',
        question: 'How do I restore my purchases?',
        answer: 'Go to the "Premium Access" page (available from Settings or the Home screen) and scroll down to tap "Restore Purchases". Ensure you are logged in with the same Apple ID or Google Play account used to make the purchase.'
    },
    {
        id: '5',
        category: 'Privacy',
        question: 'Is my data private?',
        answer: 'Yes. Your notes are stored locally on your device. We prioritize your privacy and do not sell your personal data to third parties.'
    },
    {
        id: '6',
        category: 'Privacy',
        question: 'Do you store my voice recordings?',
        answer: 'Voice recordings are processed temporarily to generate the transcript and notes, but the audio files are not permanently stored on our servers after processing is complete.'
    },
    {
        id: '7',
        category: 'Features',
        question: 'Can I use the app offline?',
        answer: 'You can view and read your existing notes and history offline. However, generating new AI notes requires an active internet connection.'
    },
    {
        id: '8',
        category: 'Features',
        question: 'What languages are supported?',
        answer: 'AI Notes supports generation in multiple languages including English, Spanish, French, German, Italian, Hindi, and Japanese. You can select your preferred output language in the Note creation screen.'
    },
    {
        id: '9',
        category: 'Troubleshooting',
        question: 'Why did generation fail?',
        answer: 'Generation might fail due to a weak internet connection or if the content (e.g., a YouTube video) has restrictions. Please check your connection and try again. If the issue persists, try "Text" mode and paste the content manually.'
    },
    {
        id: '10',
        category: 'Troubleshooting',
        question: 'How do I delete my data?',
        answer: 'You can delete individual notes by swiping left on them in the History screen. To delete ALL data, go to Settings > Danger Zone > Delete All Data. This action is irreversible.'
    },
];

export default function FAQScreen({ navigation }) {
    const { colors } = useTheme();
    const [expandedIds, setExpandedIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const toggleItem = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (expandedIds.includes(id)) {
            setExpandedIds(expandedIds.filter(itemId => itemId !== id));
        } else {
            setExpandedIds([...expandedIds, id]);
        }
    };

    const filteredFAQs = FAQS.filter(item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const FAQItem = ({ item }) => {
        const isExpanded = expandedIds.includes(item.id);

        return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
                <TouchableOpacity
                    style={styles.questionHeader}
                    onPress={() => toggleItem(item.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.questionContent}>
                        <Text style={[styles.categoryText, { color: colors.primary }]}>{item.category.toUpperCase()}</Text>
                        <Text style={[styles.questionText, { color: colors.text }]}>{item.question}</Text>
                    </View>
                    <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={colors.textMuted}
                    />
                </TouchableOpacity>
                {isExpanded && (
                    <View style={styles.answerContainer}>
                        <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />
                        <Text style={[styles.answerText, { color: colors.textSecondary }]}>
                            {item.answer}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.headerContainer, { borderBottomColor: colors.glassBorder }]}>
                <View style={styles.titleRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Help Center</Text>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchBar, { backgroundColor: colors.surfaceLight }]}>
                    <Ionicons name="search" size={20} color={colors.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search for answers..."
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        clearButtonMode="while-editing"
                    />
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {filteredFAQs.length > 0 ? (
                    filteredFAQs.map(item => (
                        <FAQItem key={item.id} item={item} />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={48} color={colors.textMuted} style={{ opacity: 0.5 }} />
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                            No matching questions found
                        </Text>
                    </View>
                )}


                <View style={styles.footerSpacer} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    card: {
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        minHeight: 70,
    },
    questionContent: {
        flex: 1,
        paddingRight: 16,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 4,
        opacity: 0.8,
        letterSpacing: 0.5,
    },
    questionText: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 22,
    },
    answerContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    divider: {
        height: 1,
        marginBottom: 16,
        opacity: 0.5,
    },
    answerText: {
        fontSize: 15,
        lineHeight: 24,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    },
    contactCard: {
        marginTop: 20,
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
    },
    contactTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    contactDesc: {
        textAlign: 'center',
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    contactButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    contactButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    footerSpacer: {
        height: 40,
    },
});
