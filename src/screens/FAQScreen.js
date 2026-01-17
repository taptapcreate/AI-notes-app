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
    // ============ GETTING STARTED ============
    {
        id: '1',
        category: 'Getting Started',
        question: 'What is AI Notes?',
        answer: 'AI Notes is a powerful AI-powered note-taking and reply generation app. It helps you transform any content (text, images, voice recordings, PDFs, and websites) into organized, professional notes. You can also generate smart replies for emails, messages, and more.'
    },
    {
        id: '2',
        category: 'Getting Started',
        question: 'How do I create my first note?',
        answer: 'Go to the "Notes" tab, select an input type (Text, Image, Voice, PDF, or Website), provide your content, choose your preferred note length/format/tone, and tap "Generate Notes". The AI will transform your content into organized notes instantly!'
    },

    // ============ SMART NOTES FEATURES ============
    {
        id: '3',
        category: 'Smart Notes',
        question: 'What input types are supported for note generation?',
        answer: '• Text: Type or paste any content directly\n• Image: Upload photos of documents, whiteboards, or handwritten notes - AI extracts and summarizes the text\n• Voice: Record audio memos and lectures - AI transcribes and creates notes\n• PDF: Upload PDF documents for automatic summarization\n• Website: Paste any article URL to generate notes from web content\n• Calendar: Import calendar events to generate meeting prep notes\n• Location: Get notes about your current location'
    },
    {
        id: '4',
        category: 'Smart Notes',
        question: 'What are note length options?',
        answer: '• Brief: Quick highlights and key points only (100-200 words)\n• Standard: Balanced coverage with main ideas (300-500 words)\n• Detailed: Comprehensive notes with examples (600-900 words)\n• Extended: In-depth analysis with full context (1000+ words)'
    },
    {
        id: '5',
        category: 'Smart Notes',
        question: 'What formats can I generate notes in?',
        answer: '• Bullet Points: Clean bullet list format\n• Narrative: Flowing prose paragraphs\n• Outline: Hierarchical structure with headings\n• Numbered: Numbered list format\n\nYou can also choose different tones: Professional, Casual, Academic, or Simple.'
    },
    {
        id: '6',
        category: 'Smart Notes',
        question: 'Can I regenerate notes with different settings?',
        answer: 'Yes! After generating notes, tap the "Regenerate" button to create new notes with different length, format, or tone settings. Each regeneration uses 1 credit.'
    },

    // ============ SMART REPLY ============
    {
        id: '7',
        category: 'Smart Reply',
        question: 'What is Smart Reply?',
        answer: 'Smart Reply helps you craft perfect responses to emails, messages, and texts. Paste the message you received, select your desired tone and style, and AI generates multiple reply options for you to choose from.'
    },
    {
        id: '8',
        category: 'Smart Reply',
        question: 'How many reply options do I get?',
        answer: 'Free users get 3 reply variations to choose from. Pro subscribers get 5-6 variations, giving you more options to find the perfect response.'
    },
    {
        id: '9',
        category: 'Smart Reply',
        question: 'What tones and styles are available?',
        answer: 'Tones: Friendly, Professional, Casual, Formal, Diplomatic, Empathetic, Assertive, Apologetic\n\nStyles: Reply (standard response), Politely Decline, Appreciate & Accept, Request More Info, Follow Up, Give Feedback'
    },

    // ============ CREDITS & PRICING ============
    {
        id: '10',
        category: 'Credits & Plans',
        question: 'How does the credit system work?',
        answer: '• Each note generation costs 1 credit\n• Each smart reply costs 1 credit\n• Free users get 3 free credits daily (resets at midnight)\n• Buy credit packs for more usage\n• Pro subscribers get unlimited usage'
    },
    {
        id: '11',
        category: 'Credits & Plans',
        question: 'Do my purchased credits expire?',
        answer: 'No! Purchased credits never expire. They remain in your account until you use them. Only the 3 free daily credits reset each day.'
    },
    {
        id: '12',
        category: 'Credits & Plans',
        question: 'What does the Pro Subscription include?',
        answer: '• Unlimited AI usage (no credit limits)\n• No ads anywhere in the app\n• More reply variations to choose from\n• Priority processing\n• All features unlocked\n\nAvailable as Weekly or Monthly plans. Cancel anytime from your device settings.'
    },
    {
        id: '13',
        category: 'Credits & Plans',
        question: 'How do I restore my purchases on a new device?',
        answer: 'Open the app, go to the Credits screen, and tap "Restore Purchases". Make sure you are signed in with the same Apple ID or Google account used for the original purchase. Your subscription and any unused purchased credits will be restored.'
    },
    {
        id: '14',
        category: 'Credits & Plans',
        question: 'What is the Recovery Code?',
        answer: 'Your Recovery Code is an 8-character code unique to your account. It allows you to recover your purchased credits if you switch devices or reinstall the app. Find it in Settings or the Credits screen. Keep it safe!'
    },

    // ============ LANGUAGES ============
    {
        id: '15',
        category: 'Languages',
        question: 'What languages are supported?',
        answer: 'AI Notes supports note generation in multiple languages: English, Spanish, French, German, Italian, Portuguese, Dutch, Russian, Japanese, Korean, Chinese, Hindi, Arabic, and more. Select your language before generating.'
    },

    // ============ PRIVACY & DATA ============
    {
        id: '16',
        category: 'Privacy',
        question: 'Is my data private and secure?',
        answer: 'Yes! Your notes are stored locally on your device. We do not sell or share your personal data. Content is only processed for AI generation and is not stored on our servers after processing.'
    },
    {
        id: '17',
        category: 'Privacy',
        question: 'How do I delete my notes and data?',
        answer: 'You can delete individual notes by swiping left in the History screen. To delete ALL data, go to Settings > Danger Zone > Delete All Data. This permanently removes all notes, replies, and settings.'
    },

    // ============ TROUBLESHOOTING ============
    {
        id: '18',
        category: 'Troubleshooting',
        question: 'Why did my note generation fail?',
        answer: 'Common reasons:\n• Weak internet connection\n• Content too short or too long\n• Website blocking automated access\n• Server temporarily busy\n\nTry again, or paste content directly using Text mode.'
    },
    {
        id: '19',
        category: 'Troubleshooting',
        question: 'Website summarization is not working?',
        answer: 'Some websites block automated content reading. If a website fails, manually copy the article text and use "Text" input mode instead. This always works!'
    },
    {
        id: '20',
        category: 'Troubleshooting',
        question: 'Can I use the app offline?',
        answer: 'You can view and read your existing notes and history offline. Generating new AI content requires an internet connection.'
    },
    {
        id: '21',
        category: 'Troubleshooting',
        question: 'My subscription is not recognized?',
        answer: 'Tap "Restore Purchases" in the Credits screen. If that doesn\'t work, try signing out and back into your Apple/Google account, then restore again. Contact support if issues persist.'
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
