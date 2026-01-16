import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../context/ThemeContext';
import { useHistory } from '../context/HistoryContext';
import { useUser } from '../context/UserContext';
import { generateReply, generateFollowUp, analyzeSentiment, translateText, polishText } from '../services/api';
import { BannerAd, BannerAdSize, InterstitialAd, AdEventType, adUnitIDs, areAdsEnabled } from '../services/AdService';
import { useEffect } from 'react';

const REPLY_LENGTHS = ['Brief', 'Standard', 'Detailed'];

const TONES = [
    { id: 'friendly', label: 'Friendly', icon: 'happy-outline' },
    { id: 'professional', label: 'Professional', icon: 'briefcase-outline' },
    { id: 'casual', label: 'Casual', icon: 'cafe-outline' },
    { id: 'flirty', label: 'Flirty', icon: 'heart' },
    { id: 'witty', label: 'Witty', icon: 'bulb-outline' },
    { id: 'sarcastic', label: 'Sarcastic', icon: 'eye-outline' },
    { id: 'firm', label: 'Firm', icon: 'shield-outline' },
    { id: 'humorous', label: 'Humorous', icon: 'happy' },
    { id: 'empathetic', label: 'Empathetic', icon: 'heart-outline' },
    { id: 'supportive', label: 'Supportive', icon: 'hand-left-outline' },
    { id: 'dramatic', label: 'Dramatic', icon: 'flame-outline' },
    { id: 'enthusiastic', label: 'Enthusiastic', icon: 'flash-outline' },
    { id: 'apologetic', label: 'Apologetic', icon: 'alert-circle-outline' },
    { id: 'grateful', label: 'Grateful', icon: 'gift-outline' },
    { id: 'confident', label: 'Confident', icon: 'trophy-outline' },
];

const STYLES = [
    { id: 'short', label: 'Short' },
    { id: 'detailed', label: 'Detailed' },
    { id: 'polite', label: 'Polite' },
    { id: 'direct', label: 'Direct' },
    { id: 'questioning', label: 'Questioning' },
    { id: 'persuasive', label: 'Persuasive' },
    { id: 'philosophical', label: 'Philosophical' },
    { id: 'poetic', label: 'Poetic' },
    { id: 'diplomatic', label: 'Diplomatic' },
    { id: 'storytelling', label: 'Story' },
    { id: 'numbered', label: 'Numbered' },
];

const FORMATS = [
    { id: 'email', label: 'Email', icon: 'mail' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
    { id: 'sms', label: 'SMS', icon: 'chatbox' },
    { id: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
    { id: 'dating', label: 'Dating App', icon: 'heart-circle' },
    { id: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin' },
    { id: 'twitter', label: 'Twitter', icon: 'logo-twitter' },
    { id: 'discord', label: 'Discord', icon: 'game-controller' },
    { id: 'slack', label: 'Slack', icon: 'chatbubbles' },
    { id: 'tiktok', label: 'TikTok', icon: 'musical-notes' },
    { id: 'letter', label: 'Letter', icon: 'document-text' },
];

const TRANSLATE_LANGUAGES = [
    { id: 'hindi', label: 'हिंदी', name: 'Hindi' },
    { id: 'spanish', label: 'Español', name: 'Spanish' },
    { id: 'french', label: 'Français', name: 'French' },
    { id: 'german', label: 'Deutsch', name: 'German' },
    { id: 'japanese', label: '日本語', name: 'Japanese' },
    { id: 'chinese', label: '中文', name: 'Chinese' },
    { id: 'arabic', label: 'العربية', name: 'Arabic' },
    { id: 'portuguese', label: 'Português', name: 'Portuguese' },
];

const POLISH_MODES = [
    { id: 'grammar', label: 'Fix Grammar', icon: 'checkmark-circle-outline', desc: 'Fix spelling & grammar errors' },
    { id: 'formal', label: 'Make Formal', icon: 'briefcase-outline', desc: 'Professional business tone' },
    { id: 'casual', label: 'Make Casual', icon: 'cafe-outline', desc: 'Friendly, relaxed tone' },
    { id: 'confident', label: 'More Confident', icon: 'trophy-outline', desc: 'Assertive & confident tone' },
];

const OUTPUT_LANGUAGES = [
    { id: 'English', label: '🇬🇧 English' },
    { id: 'Spanish', label: '🇪🇸 Spanish' },
    { id: 'French', label: '🇫🇷 French' },
    { id: 'German', label: '🇩🇪 German' },
    { id: 'Hindi', label: '🇮🇳 Hindi' },
    { id: 'Mandarin', label: '🇨🇳 Mandarin' },
    { id: 'Portuguese', label: '🇵🇹 Portuguese' },
    { id: 'Russian', label: '🇷🇺 Russian' },
    { id: 'Japanese', label: '🇯🇵 Japanese' },
    { id: 'Italian', label: '🇮🇹 Italian' },
    { id: 'Korean', label: '🇰🇷 Korean' },
    { id: 'Arabic', label: '🇸🇦 Arabic' },
    { id: 'Dutch', label: '🇳🇱 Dutch' },
    { id: 'Turkish', label: '🇹🇷 Turkish' },
    { id: 'Polish', label: '🇵🇱 Polish' },
    { id: 'Swedish', label: '🇸🇪 Swedish' },
    { id: 'Indonesian', label: '🇮🇩 Indonesian' },
    { id: 'Vietnamese', label: '🇻🇳 Vietnamese' },
    { id: 'Thai', label: '🇹🇭 Thai' },
    { id: 'Greek', label: '🇬🇷 Greek' },
];

export default function ReplyScreen() {
    const { colors } = useTheme();
    // ... hooks ...

    // ... existing state ...

    const navigation = useNavigation();
    const {
        addReply,
        deleteReply,
        clearAllReplies,
        replies: savedReplies = [],
        addTemplate,
        deleteTemplate,
        templates = []
    } = useHistory();
    const { useCredits, checkAvailability } = useUser();
    const [message, setMessage] = useState('');
    const [customInstruction, setCustomInstruction] = useState('');
    const [selectedLength, setSelectedLength] = useState('Standard');
    const [selectedTone, setSelectedTone] = useState('casual');
    const [selectedStyle, setSelectedStyle] = useState('short');
    const [selectedFormat, setSelectedFormat] = useState('whatsapp');
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const [mode, setMode] = useState('reply'); // 'reply' | 'compose' | 'refine'
    const [replies, setReplies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);
    const [sentiment, setSentiment] = useState(null);
    const [isRefineLoading, setIsRefineLoading] = useState(false);
    const [refineQuestion, setRefineQuestion] = useState('');
    const [refinedReply, setRefinedReply] = useState(null);
    const [selectedReplyIndex, setSelectedReplyIndex] = useState(0);
    const [quickActionLoading, setQuickActionLoading] = useState(null); // e.g., 'expand-0', 'shorten-1'
    const [showTranslateModal, setShowTranslateModal] = useState(false);
    const [translateReplyIndex, setTranslateReplyIndex] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [polishReplyIndex, setPolishReplyIndex] = useState(null);
    const [isPolishing, setIsPolishing] = useState(false);
    const [polishMode, setPolishMode] = useState(null);
    const [showPolishModal, setShowPolishModal] = useState(false);
    const [interstitial, setInterstitial] = useState(null);
    const [interstitialLoaded, setInterstitialLoaded] = useState(false);
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);
    const { hasProSubscription } = useUser();
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [languageSearch, setLanguageSearch] = useState(''); // Search state for language modal
    const [translateToLanguage, setTranslateToLanguage] = useState('Spanish');

    // Collapsible State
    const [showLength, setShowLength] = useState(true);
    const [showTone, setShowTone] = useState(true);
    const [showStyle, setShowStyle] = useState(true);
    const [showFormat, setShowFormat] = useState(true);
    const [showLanguage, setShowLanguage] = useState(true);

    // Modal States
    const [showToneModal, setShowToneModal] = useState(false);
    const [showStyleModal, setShowStyleModal] = useState(false);
    const [showFormatModal, setShowFormatModal] = useState(false);

    useEffect(() => {
        if (areAdsEnabled && !hasProSubscription) {
            const interstitialAd = InterstitialAd.createForAdRequest(adUnitIDs.interstitial);
            const unsubscribe = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
                setInterstitialLoaded(true);
            });
            interstitialAd.load();
            setInterstitial(interstitialAd);
            return unsubscribe;
        }
    }, [hasProSubscription]);

    const getPlaceholder = () => {
        switch (mode) {
            case 'reply': return "Paste the message to reply to...";
            case 'compose': return "Briefly describe what you want written (e.g. 'Ask boss for a day off')...";
            case 'refine': return "Type your rough draft to polish...";
            default: return "Type or paste message...";
        }
    };

    const getLabel = () => {
        switch (mode) {
            case 'reply': return "Received Message";
            case 'compose': return "Topic / Instruction";
            case 'refine': return "Your Draft";
            default: return "Message";
        }
    };

    const handleGenerate = async () => {
        if (!message.trim()) {
            Alert.alert('Input Required', 'Please enter a message or instruction.');
            return;
        }

        if (!checkAvailability(1)) {
            Alert.alert('Credits Exhausted', 'Please buy more credits to generate replies.');
            return;
        }

        setIsLoading(true);
        setReplies([]); // Clear previous replies
        setRefinedReply(null); // Clear refined reply
        setSelectedReplyIndex(0); // Reset selected reply index

        try {
            // ... custom instruction logic ...
            let inputMessage = message;
            if (customInstruction.trim()) {
                inputMessage += `\n\n[User Intent/Context: ${customInstruction}]`;
            }

            const result = await generateReply(inputMessage, {
                tone: selectedTone,
                style: selectedStyle,
                format: selectedFormat,
                mode: mode,
                language: selectedLanguage,
                length: selectedLength,
                isPro: hasProSubscription,
            });

            await useCredits(1);

            // Limit replies for free users
            if (hasProSubscription) {
                setReplies(result);
            } else {
                setReplies(result.slice(0, 3));
            }

            // ... rest of function ...

            // Save first reply to history
            if (result && result.length > 0) {
                addReply(result[0], { tone: selectedTone, style: selectedStyle, format: selectedFormat });
            }

            // Show interstitial ad after generation for non-pro users
            if (areAdsEnabled && !hasProSubscription && interstitialLoaded && interstitial) {
                // Show ad with a small delay
                setTimeout(() => {
                    interstitial.show().catch(err => console.error('Error showing interstitial:', err));
                }, 800);
            }
        } catch (error) {
            console.error('Error generating reply:', error);
            Alert.alert('Error', 'Failed to generate content. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyReply = async (reply) => {
        await Clipboard.setStringAsync(reply);
        Alert.alert('Copied!', 'Reply copied to clipboard');
    };

    const handleRefineReply = async () => {
        if (!checkAvailability(1)) {
            Alert.alert('Credits Exhausted', 'Please buy more credits to refine replies.');
            return;
        }
        if (!refineQuestion.trim()) {
            Alert.alert('Error', 'Please enter a refinement request');
            return;
        }
        if (replies.length === 0) {
            Alert.alert('Error', 'Generate replies first before refining');
            return;
        }

        setIsRefineLoading(true);
        try {
            const response = await generateFollowUp(replies[selectedReplyIndex], refineQuestion, 'reply');
            await useCredits(1);
            setRefinedReply(response);
            setRefineQuestion('');
        } catch (error) {
            console.error('Error refining reply:', error);
            Alert.alert('Error', error.message || 'Failed to refine reply.');
        } finally {
            setIsRefineLoading(false);
        }
    };

    const pasteFromClipboard = async () => {
        const text = await Clipboard.getStringAsync();
        if (text) {
            setMessage(text);
            // Analyze sentiment when message is pasted
            analyzeMessageSentiment(text);
        }
    };

    // Analyze sentiment of the message
    const analyzeMessageSentiment = async (text) => {
        if (!text || text.trim().length < 10) {
            setSentiment(null);
            return;
        }

        setIsAnalyzingSentiment(true);
        try {
            const result = await analyzeSentiment(text);
            setSentiment(result);
        } catch (error) {
            console.error('Sentiment analysis error:', error);
            setSentiment(null);
        } finally {
            setIsAnalyzingSentiment(false);
        }
    };

    // Handle quick actions (expand/shorten)
    const handleQuickAction = async (action, replyIndex) => {
        if (!checkAvailability(1)) {
            Alert.alert('Credits Exhausted', 'Please buy more credits to modify replies.');
            return;
        }

        const currentReply = replies[replyIndex];
        if (!currentReply) return;

        setQuickActionLoading(`${action}-${replyIndex}`);
        try {
            const prompt = action === 'expand'
                ? 'Make this reply more detailed and comprehensive while keeping the same tone and meaning'
                : 'Make this reply shorter and more concise while keeping the key points';

            const response = await generateFollowUp(currentReply, prompt, 'reply');
            await useCredits(1);

            // Update the reply in the list
            const updatedReplies = [...replies];
            updatedReplies[replyIndex] = response;
            setReplies(updatedReplies);
        } catch (error) {
            console.error('Quick action error:', error);
            Alert.alert('Error', 'Failed to modify reply.');
        } finally {
            setQuickActionLoading(null);
        }
    };

    // Handle translate
    const handleTranslate = async (language) => {
        if (!checkAvailability(1)) {
            Alert.alert('Credits Exhausted', 'Please buy more credits to translate.');
            return;
        }

        const currentReply = replies[translateReplyIndex];
        if (!currentReply) return;

        setIsTranslating(true);
        setShowTranslateModal(false);

        try {
            const translated = await translateText(currentReply, language.name);
            await useCredits(1);

            // Update the reply in the list
            const updatedReplies = [...replies];
            updatedReplies[translateReplyIndex] = translated;
            setReplies(updatedReplies);
        } catch (error) {
            console.error('Translate error:', error);
            Alert.alert('Error', 'Failed to translate reply.');
        } finally {
            setIsTranslating(false);
            setTranslateReplyIndex(null);
        }
    };

    // Open translate modal
    const openTranslateModal = (index) => {
        setTranslateReplyIndex(index);
        setShowTranslateModal(true);
    };

    const handleTranslateReply = async () => {
        if (!checkAvailability(1)) {
            Alert.alert('Credits Exhausted', 'Please buy more credits to translate.');
            return;
        }

        const currentReply = replies[translateReplyIndex];
        if (!currentReply) return;

        setIsTranslating(true);

        try {
            const translated = await translateText(currentReply, translateToLanguage);
            await useCredits(1);

            const updatedReplies = [...replies];
            updatedReplies[translateReplyIndex] = translated;
            setReplies(updatedReplies);
        } catch (error) {
            console.error('Translate error:', error);
            Alert.alert('Error', 'Failed to translate reply.');
        } finally {
            setIsTranslating(false);
            setTranslateReplyIndex(null);
        }
    };

    // Handle polish/grammar fix
    const handlePolish = async (mode) => {
        if (!checkAvailability(1)) {
            Alert.alert('Credits Exhausted', 'Please buy more credits to polish.');
            return;
        }

        const currentReply = replies[polishReplyIndex];
        if (!currentReply) return;

        setIsPolishing(true);
        setShowPolishModal(false);

        try {
            const polished = await polishText(currentReply, mode.id);
            await useCredits(1);

            // Update the reply in the list
            const updatedReplies = [...replies];
            updatedReplies[polishReplyIndex] = polished;
            setReplies(updatedReplies);
        } catch (error) {
            console.error('Polish error:', error);
            Alert.alert('Error', 'Failed to polish text.');
        } finally {
            setIsPolishing(false);
            setPolishReplyIndex(null);
        }
    };

    // Open polish modal
    const openPolishModal = (index) => {
        setPolishReplyIndex(index);
        setShowPolishModal(true);
    };

    // Template Functions
    const handleSaveTemplate = async (reply) => {
        Alert.alert(
            'Save Template',
            'Save this reply as a template?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Save',
                    onPress: async () => {
                        const title = reply.substring(0, 30) + '...';
                        await addTemplate(reply, title);
                        Alert.alert('Success', 'Template saved!');
                    }
                }
            ]
        );
    };

    const handleDeleteTemplate = (id) => {
        Alert.alert(
            'Delete Template',
            'Are you sure you want to delete this template?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteTemplate(id) }
            ]
        );
    };

    const copyTemplate = async (content) => {
        await Clipboard.setStringAsync(content);
        Alert.alert('Copied!', 'Template copied to clipboard');
        setShowTemplatesModal(false);
    };

    // Trigger sentiment analysis when message changes (debounced)
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (message && message.trim().length >= 20) {
                analyzeMessageSentiment(message);
            } else {
                setSentiment(null);
            }
        }, 800);

        return () => clearTimeout(debounceTimer);
    }, [message]);

    const handleClearAllHistory = () => {
        Alert.alert(
            'Clear History',
            'Are you sure you want to delete all reply history?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete All', style: 'destructive', onPress: clearAllReplies }
            ]
        );
    };

    const handleDeleteReply = (id) => {
        Alert.alert(
            'Delete Reply',
            'Are you sure you want to delete this reply?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteReply(id) }
            ]
        );
    };

    // Helper function for sentiment colors
    const getSentimentColor = (type) => {
        const sentimentColors = {
            positive: '#10B98120',
            negative: '#EF444420',
            angry: '#DC262620',
            urgent: '#F5920020',
            neutral: `${colors.textMuted}20`,
            happy: '#10B98120',
            sad: '#3B82F620',
            confused: '#8B5CF620',
            frustrated: '#EF444420',
        };
        return sentimentColors[type] || sentimentColors.neutral;
    };

    const styles = createStyles(colors);

    // Markdown styles for reply output
    const markdownStyles = {
        body: {
            color: colors.text,
            fontSize: 14,
            lineHeight: 22,
        },
        paragraph: {
            color: colors.text,
            marginBottom: 10,
        },
        strong: {
            color: colors.primary,
            fontWeight: '700',
        },
        em: {
            fontStyle: 'italic',
            color: colors.textSecondary,
        },
        bullet_list: {
            marginLeft: 8,
        },
        list_item: {
            marginBottom: 6,
        },
        link: {
            color: colors.primary,
        },
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Message Input */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.label}>{getLabel()}</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity style={styles.pasteBtn} onPress={() => setShowTemplatesModal(true)}>
                                <Ionicons name="albums-outline" size={14} color={colors.primary} />
                                <Text style={styles.pasteBtnText}>Templates</Text>
                            </TouchableOpacity>
                            {/* <TouchableOpacity style={styles.pasteBtn} onPress={pasteFromClipboard}>
                                <Ionicons name="clipboard" size={14} color={colors.primary} />
                                <Text style={styles.pasteBtnText}>Paste</Text>
                            </TouchableOpacity> */}
                        </View>
                    </View>

                    {/* Mode Toggle */}
                    <View style={styles.modeToggleContainer}>
                        <TouchableOpacity
                            style={[styles.modeBtn, mode === 'reply' && styles.modeBtnActive]}
                            onPress={() => setMode('reply')}
                        >
                            <Ionicons name="chatbox-ellipses-outline" size={18} color={mode === 'reply' ? '#fff' : colors.textMuted} />
                            <Text style={[styles.modeBtnText, mode === 'reply' && styles.modeBtnTextActive]}>
                                Reply
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, mode === 'compose' && styles.modeBtnActive]}
                            onPress={() => setMode('compose')}
                        >
                            <Ionicons name="pencil-outline" size={18} color={mode === 'compose' ? '#fff' : colors.textMuted} />
                            <Text style={[styles.modeBtnText, mode === 'compose' && styles.modeBtnTextActive]}>
                                Compose
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, mode === 'refine' && styles.modeBtnActive]}
                            onPress={() => setMode('refine')}
                        >
                            <Ionicons name="create-outline" size={18} color={mode === 'refine' ? '#fff' : colors.textMuted} />
                            <Text style={[styles.modeBtnText, mode === 'refine' && styles.modeBtnTextActive]}>
                                Refine
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputCard}>
                        <TextInput
                            style={styles.messageInput}
                            placeholder={getPlaceholder()}
                            placeholderTextColor={colors.textMuted}
                            multiline
                            value={message}
                            onChangeText={setMessage}
                        />
                    </View>

                    {/* Custom Instruction (Optional) */}
                    <View style={{ marginTop: 12 }}>
                        <Text style={[styles.label, { fontSize: 13, marginBottom: 8 }]}>Your Intent / Custom Instruction (Optional)</Text>
                        <View style={[styles.inputCard, { height: 'auto', minHeight: 45, paddingVertical: 8 }]}>
                            <TextInput
                                style={[styles.messageInput, { height: 'auto', minHeight: 24, fontSize: 14, paddingTop: 0 }]}
                                placeholder="e.g. 'Say yes', 'Refuse politely', 'Roast them'..."
                                placeholderTextColor={colors.textMuted}
                                value={customInstruction}
                                onChangeText={setCustomInstruction}
                            />
                        </View>
                    </View>

                    {/* Sentiment Badge */}
                    {
                        (isAnalyzingSentiment || sentiment) && (
                            <View style={styles.sentimentContainer}>
                                {isAnalyzingSentiment ? (
                                    <View style={styles.sentimentBadge}>
                                        <ActivityIndicator size="small" color={colors.primary} />
                                        <Text style={styles.sentimentText}>Analyzing tone...</Text>
                                    </View>
                                ) : sentiment && (
                                    <View style={[styles.sentimentBadge, { backgroundColor: getSentimentColor(sentiment.type) }]}>
                                        <Text style={styles.sentimentEmoji}>{sentiment.emoji}</Text>
                                        <Text style={styles.sentimentLabel}>{sentiment.label}</Text>
                                    </View>
                                )}
                            </View>
                        )
                    }
                </View>

                {/* Reply Length */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: showLength ? 10 : 0 }}
                        onPress={() => setShowLength(!showLength)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.label}>Reply Length</Text>
                            <Ionicons name={showLength ? "chevron-up" : "chevron-down"} size={16} color={colors.textSecondary} />
                        </View>
                        {!showLength && <Text style={{ fontSize: 13, color: colors.primary }}>{selectedLength}</Text>}
                    </TouchableOpacity>

                    {showLength && (
                        <View style={styles.chipRow}>
                            {REPLY_LENGTHS.map((length) => (
                                <TouchableOpacity
                                    key={length}
                                    style={[styles.chip, selectedLength === length && styles.chipActive]}
                                    onPress={() => setSelectedLength(length)}
                                >
                                    <Text style={[styles.chipText, selectedLength === length && styles.chipTextActive]}>
                                        {length}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Tone */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: showTone ? 10 : 0 }}
                        onPress={() => setShowTone(!showTone)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.label}>Tone</Text>
                            <Ionicons name={showTone ? "chevron-up" : "chevron-down"} size={16} color={colors.textSecondary} />
                        </View>
                        <Text style={{ fontSize: 13, color: colors.primary }}>{TONES.find(t => t.id === selectedTone)?.label}</Text>
                    </TouchableOpacity>

                    {showTone && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
                            <View style={{ flexDirection: 'row', gap: 10, paddingBottom: 4 }}>
                                {TONES.slice(0, 5).map((tone) => (
                                    <TouchableOpacity
                                        key={tone.id}
                                        style={[styles.toneBtn, selectedTone === tone.id && styles.toneBtnActive]}
                                        onPress={() => setSelectedTone(tone.id)}
                                    >
                                        <Ionicons
                                            name={tone.icon}
                                            size={18}
                                            color={selectedTone === tone.id ? colors.primary : colors.textSecondary}
                                        />
                                        <Text style={[styles.toneText, selectedTone === tone.id && styles.toneTextActive]}>
                                            {tone.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={[styles.toneBtn]}
                                    onPress={() => setShowToneModal(true)}
                                >
                                    <Text style={[styles.toneText, { color: colors.primary }]}>More...</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    )}
                </View>

                {/* Style */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: showStyle ? 10 : 0 }}
                        onPress={() => setShowStyle(!showStyle)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.label}>Style</Text>
                            <Ionicons name={showStyle ? "chevron-up" : "chevron-down"} size={16} color={colors.textSecondary} />
                        </View>
                        <Text style={{ fontSize: 13, color: colors.primary }}>{STYLES.find(s => s.id === selectedStyle)?.label}</Text>
                    </TouchableOpacity>

                    {showStyle && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
                            <View style={{ flexDirection: 'row', gap: 10, paddingBottom: 4 }}>
                                {STYLES.slice(0, 5).map((style) => (
                                    <TouchableOpacity
                                        key={style.id}
                                        style={[styles.chip, selectedStyle === style.id && styles.chipActive]}
                                        onPress={() => setSelectedStyle(style.id)}
                                    >
                                        <Text style={[styles.chipText, selectedStyle === style.id && styles.chipTextActive]}>
                                            {style.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={[styles.chip]}
                                    onPress={() => setShowStyleModal(true)}
                                >
                                    <Text style={[styles.chipText, { color: colors.primary }]}>More...</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    )}
                </View >

                {/* Format */}
                <View style={styles.section} >
                    <TouchableOpacity
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: showFormat ? 10 : 0 }}
                        onPress={() => setShowFormat(!showFormat)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.label}>Format</Text>
                            <Ionicons name={showFormat ? "chevron-up" : "chevron-down"} size={16} color={colors.textSecondary} />
                        </View>
                        <Text style={{ fontSize: 13, color: colors.primary }}>{FORMATS.find(f => f.id === selectedFormat)?.label}</Text>
                    </TouchableOpacity>

                    {showFormat && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
                            <View style={{ flexDirection: 'row', gap: 10, paddingBottom: 4 }}>
                                {FORMATS.slice(0, 5).map((format) => (
                                    <TouchableOpacity
                                        key={format.id}
                                        style={[styles.formatBtn, selectedFormat === format.id && styles.formatBtnActive]}
                                        onPress={() => setSelectedFormat(format.id)}
                                    >
                                        <Ionicons
                                            name={format.icon}
                                            size={20}
                                            color={selectedFormat === format.id ? colors.primary : colors.textMuted}
                                        />
                                        <Text style={[styles.formatText, selectedFormat === format.id && styles.formatTextActive]}>
                                            {format.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={[styles.formatBtn]}
                                    onPress={() => setShowFormatModal(true)}
                                >
                                    <Text style={[styles.formatText, { color: colors.primary }]}>More...</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    )}
                </View>

                {/* Output Language */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: showLanguage ? 10 : 0 }}
                        onPress={() => setShowLanguage(!showLanguage)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.label}>Output Language</Text>
                            <Ionicons name={showLanguage ? "chevron-up" : "chevron-down"} size={16} color={colors.textSecondary} />
                        </View>
                        <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>
                            {OUTPUT_LANGUAGES.find(l => l.id === selectedLanguage)?.label}
                        </Text>
                    </TouchableOpacity>

                    {showLanguage && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
                            <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
                                {OUTPUT_LANGUAGES.slice(0, 5).map((lang) => (
                                    <TouchableOpacity
                                        key={lang.id}
                                        style={[styles.chip, selectedLanguage === lang.id && styles.chipActive]}
                                        onPress={() => setSelectedLanguage(lang.id)}
                                    >
                                        <Text style={[styles.chipText, selectedLanguage === lang.id && styles.chipTextActive]}>
                                            {lang.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={[styles.chip, OUTPUT_LANGUAGES.slice(5).some(l => l.id === selectedLanguage) && styles.chipActive]}
                                    onPress={() => setShowLanguageModal(true)}
                                >
                                    <Text style={[styles.chipText, OUTPUT_LANGUAGES.slice(5).some(l => l.id === selectedLanguage) && styles.chipTextActive]}>
                                        More...
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    )}
                </View>

                {/* Generate Button */}
                <TouchableOpacity
                    style={styles.generateBtn}
                    onPress={handleGenerate}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={colors.gradientPrimary}
                        style={styles.generateBtnInner}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isLoading ? (
                            <>
                                <ActivityIndicator color="#fff" size="small" />
                                <Text style={styles.generateBtnText}>Generating...</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="sparkles" size={20} color="#fff" />
                                <Text style={styles.generateBtnText}>Generate Replies</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity >


                {/* Tone, Style, Format Modals */}
                <GenericSelectionModal
                    visible={showToneModal}
                    onClose={() => setShowToneModal(false)}
                    title="Select Tone"
                    data={TONES}
                    onSelect={setSelectedTone}
                    selectedId={selectedTone}
                />
                <GenericSelectionModal
                    visible={showStyleModal}
                    onClose={() => setShowStyleModal(false)}
                    title="Select Style"
                    data={STYLES}
                    onSelect={setSelectedStyle}
                    selectedId={selectedStyle}
                />
                <GenericSelectionModal
                    visible={showFormatModal}
                    onClose={() => setShowFormatModal(false)}
                    title="Select Format"
                    data={FORMATS}
                    onSelect={setSelectedFormat}
                    selectedId={selectedFormat}
                />

                {/* Language Selection Modal */}
                <Modal
                    visible={showLanguageModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowLanguageModal(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowLanguageModal(false)}
                    >
                        <View style={[styles.modalContent, { height: '80%' }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Language</Text>
                                <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            {/* Search Bar */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: colors.surface + '80',
                                borderRadius: 12,
                                paddingHorizontal: 12,
                                marginHorizontal: 20,
                                marginBottom: 16,
                                borderWidth: 1,
                                borderColor: colors.border
                            }}>
                                <Ionicons name="search" size={20} color={colors.textSecondary} />
                                <TextInput
                                    style={{
                                        flex: 1,
                                        height: 44,
                                        marginLeft: 8,
                                        fontSize: 16,
                                        color: colors.text
                                    }}
                                    placeholder="Search languages..."
                                    placeholderTextColor={colors.textMuted}
                                    value={languageSearch}
                                    onChangeText={setLanguageSearch}
                                    autoCorrect={false}
                                />
                                {languageSearch.length > 0 && (
                                    <TouchableOpacity onPress={() => setLanguageSearch('')}>
                                        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                                    {OUTPUT_LANGUAGES
                                        .filter(lang =>
                                            lang.label.toLowerCase().includes(languageSearch.toLowerCase()) ||
                                            lang.id.toLowerCase().includes(languageSearch.toLowerCase())
                                        )
                                        .map((lang) => (
                                            <TouchableOpacity
                                                key={lang.id}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    paddingVertical: 16,
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: colors.border,
                                                }}
                                                onPress={() => {
                                                    setSelectedLanguage(lang.id);
                                                    setShowLanguageModal(false);
                                                    setLanguageSearch('');
                                                }}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Text style={{ fontSize: 22, marginRight: 12 }}>
                                                        {lang.label.split(' ')[0]} {/* Extract Flag */}
                                                    </Text>
                                                    <Text style={{
                                                        fontSize: 16,
                                                        color: colors.text,
                                                        fontWeight: selectedLanguage === lang.id ? '600' : '400'
                                                    }}>
                                                        {lang.id}
                                                    </Text>
                                                </View>
                                                {selectedLanguage === lang.id && (
                                                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                </View>
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Translate Language Modal */}
                <Modal
                    visible={showTranslateModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowTranslateModal(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowTranslateModal(false)}
                    >
                        <View style={[styles.modalContent, { height: '80%' }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Translate to...</Text>
                                <TouchableOpacity onPress={() => setShowTranslateModal(false)}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.languageGrid}>
                                    {OUTPUT_LANGUAGES.map((lang) => (
                                        <TouchableOpacity
                                            key={lang.id}
                                            style={[styles.languageBtn, translateToLanguage === lang.id && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
                                            onPress={() => {
                                                setTranslateToLanguage(lang.id);
                                                setShowTranslateModal(false);
                                                handleTranslateReply();
                                            }}
                                        >
                                            <Text style={styles.languageLabel}>{lang.label}</Text>
                                            <Text style={styles.languageName}>{lang.id}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Replies */}
                {
                    replies.length > 0 && (
                        <View style={styles.repliesSection}>
                            <Text style={styles.label}>Reply Options</Text>
                            {replies.map((reply, index) => (
                                <View key={index} style={styles.replyCard}>
                                    <View style={styles.replyHeader}>
                                        <View style={styles.replyBadge}>
                                            <Text style={styles.replyBadgeText}>Option {index + 1}</Text>
                                        </View>
                                        <TouchableOpacity style={styles.copyBtn} onPress={() => copyReply(reply)}>
                                            <Ionicons name="copy-outline" size={14} color={colors.primary} />
                                            <Text style={styles.copyBtnText}>Copy</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Markdown style={markdownStyles}>{reply}</Markdown>

                                    {/* Quick Actions - Expand/Shorten */}
                                    <View style={styles.quickActionsRow}>
                                        <TouchableOpacity
                                            style={styles.quickActionBtn}
                                            onPress={() => handleQuickAction('shorten', index)}
                                            disabled={quickActionLoading !== null}
                                        >
                                            {quickActionLoading === `shorten-${index}` ? (
                                                <ActivityIndicator size="small" color={colors.primary} />
                                            ) : (
                                                <>
                                                    <Ionicons name="remove-circle-outline" size={16} color={colors.primary} />
                                                    <Text style={styles.quickActionText}>Shorten</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.quickActionBtn}
                                            onPress={() => handleQuickAction('expand', index)}
                                            disabled={quickActionLoading !== null}
                                        >
                                            {quickActionLoading === `expand-${index}` ? (
                                                <ActivityIndicator size="small" color={colors.primary} />
                                            ) : (
                                                <>
                                                    <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                                                    <Text style={styles.quickActionText}>Expand</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.quickActionBtn}
                                            onPress={() => openTranslateModal(index)}
                                            disabled={isTranslating && translateReplyIndex === index}
                                        >
                                            {isTranslating && translateReplyIndex === index ? (
                                                <ActivityIndicator size="small" color={colors.primary} />
                                            ) : (
                                                <>
                                                    <Ionicons name="language-outline" size={16} color={colors.primary} />
                                                    <Text style={styles.quickActionText}>Translate</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.quickActionBtn}
                                            onPress={() => openPolishModal(index)}
                                            disabled={isPolishing && polishReplyIndex === index}
                                        >
                                            {isPolishing && polishReplyIndex === index ? (
                                                <ActivityIndicator size="small" color={colors.primary} />
                                            ) : (
                                                <>
                                                    <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                                                    <Text style={styles.quickActionText}>Polish</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.quickActionBtn}
                                            onPress={() => handleSaveTemplate(reply)}
                                        >
                                            <Ionicons name="save-outline" size={16} color={colors.primary} />
                                            <Text style={styles.quickActionText}>Save</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}

                            {/* Refine Reply Section */}
                            <View style={styles.refineSection}>
                                <Text style={styles.refineTitle}>Refine a Reply</Text>

                                {/* Reply Selector */}
                                <View style={styles.refineSelectorRow}>
                                    {replies.map((_, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.refineSelector, selectedReplyIndex === index && styles.refineSelectorActive]}
                                            onPress={() => setSelectedReplyIndex(index)}
                                        >
                                            <Text style={[styles.refineSelectorText, selectedReplyIndex === index && styles.refineSelectorTextActive]}>
                                                Option {index + 1}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Suggestion Chips */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
                                    <View style={styles.suggestionsRow}>
                                        {[
                                            'Make it shorter',
                                            'More formal',
                                            'Add urgency',
                                            'Softer tone',
                                        ].map((suggestion, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={styles.suggestionChip}
                                                onPress={() => setRefineQuestion(suggestion)}
                                            >
                                                <Text style={styles.suggestionText}>{suggestion}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>

                                <View style={styles.refineInputRow}>
                                    <TextInput
                                        style={styles.refineInput}
                                        placeholder="Or type your own refinement..."
                                        placeholderTextColor={colors.textMuted}
                                        value={refineQuestion}
                                        onChangeText={setRefineQuestion}
                                        multiline
                                    />
                                    <TouchableOpacity
                                        style={styles.refineBtn}
                                        onPress={handleRefineReply}
                                        disabled={isRefineLoading}
                                    >
                                        <LinearGradient
                                            colors={colors.gradientAccent}
                                            style={styles.refineBtnInner}
                                        >
                                            {isRefineLoading ? (
                                                <ActivityIndicator color="#fff" size="small" />
                                            ) : (
                                                <Ionicons name="color-wand" size={18} color="#fff" />
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>

                                {refinedReply ? (
                                    <View style={styles.refinedReplyCard}>
                                        <View style={styles.refinedReplyHeader}>
                                            <Ionicons name="sparkles" size={16} color={colors.accent} />
                                            <Text style={styles.refinedReplyTitle}>Refined Reply</Text>
                                            <TouchableOpacity style={styles.copyBtn} onPress={() => copyReply(refinedReply)}>
                                                <Ionicons name="copy-outline" size={14} color={colors.primary} />
                                                <Text style={styles.copyBtnText}>Copy</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <Markdown style={markdownStyles}>{refinedReply}</Markdown>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                    )
                }
                {/* Banner Ad */}
                {
                    areAdsEnabled && (
                        <View style={{ alignItems: 'center', marginTop: 20 }}>
                            <BannerAd
                                unitId={adUnitIDs.banner}
                                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                                requestOptions={{
                                    requestNonPersonalizedAdsOnly: true,
                                }}
                            />
                        </View>
                    )
                }

                {/* Recent History Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.label}>Recent Replies</Text>
                        {savedReplies.length > 0 && (
                            <TouchableOpacity onPress={handleClearAllHistory}>
                                <Text style={styles.clearAllText}>Clear All</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {savedReplies.length === 0 ? (
                        <Text style={styles.emptyHistoryText}>No recent replies</Text>
                    ) : (
                        savedReplies.slice(0, 5).map((reply) => (
                            <View key={reply.id} style={styles.historyCard}>
                                <View style={styles.historyInfo}>
                                    <Text style={styles.historyDate}>
                                        {new Date(reply.createdAt).toLocaleDateString()}
                                    </Text>
                                    <View style={styles.historyChips}>
                                        <View style={styles.historyTag}>
                                            <Text style={styles.historyTagText}>{reply.tone}</Text>
                                        </View>
                                        <View style={styles.historyTag}>
                                            <Text style={styles.historyTagText}>{reply.format}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.historyPreview} numberOfLines={2}>
                                        {reply.content}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={() => handleDeleteReply(reply.id)}
                                >
                                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>

            </ScrollView >

            {/* Translate Language Modal */}
            <Modal
                visible={showTranslateModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowTranslateModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowTranslateModal(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Translate to</Text>
                            <TouchableOpacity onPress={() => setShowTranslateModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.languageGrid}>
                            {TRANSLATE_LANGUAGES.map((lang) => (
                                <TouchableOpacity
                                    key={lang.id}
                                    style={styles.languageBtn}
                                    onPress={() => handleTranslate(lang)}
                                >
                                    <Text style={styles.languageLabel}>{lang.label}</Text>
                                    <Text style={styles.languageName}>{lang.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal >

            {/* Polish Mode Modal */}
            <Modal
                visible={showPolishModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowPolishModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowPolishModal(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Polish Text</Text>
                            <TouchableOpacity onPress={() => setShowPolishModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.polishGrid}>
                            {POLISH_MODES.map((mode) => (
                                <TouchableOpacity
                                    key={mode.id}
                                    style={styles.polishBtn}
                                    onPress={() => handlePolish(mode)}
                                >
                                    <Ionicons name={mode.icon} size={24} color={colors.primary} />
                                    <Text style={styles.polishLabel}>{mode.label}</Text>
                                    <Text style={styles.polishDesc}>{mode.desc}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal >

            {/* Templates List Modal */}
            <Modal
                visible={showTemplatesModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowTemplatesModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowTemplatesModal(false)}
                >
                    <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Saved Templates</Text>
                            <TouchableOpacity onPress={() => setShowTemplatesModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {templates.length === 0 ? (
                            <View style={styles.emptyTemplates}>
                                <Ionicons name="documents-outline" size={48} color={colors.textMuted} />
                                <Text style={styles.emptyTemplatesText}>No saved templates yet.</Text>
                                <Text style={styles.emptyTemplatesSubtext}>Save generated replies to use them later.</Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.templatesList}>
                                {templates.map((template) => (
                                    <View key={template.id} style={styles.templateCard}>
                                        <View style={styles.templateHeader}>
                                            <Text style={styles.templateTitle} numberOfLines={1}>{template.title}</Text>
                                            <TouchableOpacity onPress={() => handleDeleteTemplate(template.id)}>
                                                <Ionicons name="trash-outline" size={18} color={colors.error} />
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.templatePreview} numberOfLines={3}>{template.content}</Text>
                                        <TouchableOpacity
                                            style={styles.useTemplateBtn}
                                            onPress={() => copyTemplate(template.content)}
                                        >
                                            <Text style={styles.useTemplateText}>Copy to Clipboard</Text>
                                            <Ionicons name="copy-outline" size={16} color={colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal >
        </View >
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
    section: {
        marginBottom: 20,
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 10,
    },
    pasteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.surface,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    pasteBtnText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '500',
    },
    inputCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 14,
    },
    messageInput: {
        color: colors.text,
        fontSize: 15,
        minHeight: 90,
        textAlignVertical: 'top',
        lineHeight: 22,
    },
    // Sentiment Badge Styles
    sentimentContainer: {
        marginTop: 12,
        alignItems: 'flex-start',
    },
    sentimentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: colors.surface,
    },
    sentimentEmoji: {
        fontSize: 16,
    },
    sentimentLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
    },
    sentimentText: {
        fontSize: 12,
        color: colors.textMuted,
        marginLeft: 6,
    },
    // Quick Actions Styles
    quickActionsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.glassBorder,
    },
    quickActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: `${colors.primary}10`,
        borderRadius: 8,
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary,
    },
    // Translate Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxWidth: 360,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    languageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    languageBtn: {
        width: '47%',
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        alignItems: 'center',
    },
    languageLabel: {
        fontSize: 20,
        marginBottom: 4,
    },
    languageName: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
    },
    // Polish Modal Styles
    polishGrid: {
        gap: 12,
    },
    polishBtn: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    polishLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
    },
    polishDesc: {
        fontSize: 12,
        color: colors.textMuted,
        flex: 2,
    },
    // Templates Modal Styles
    emptyTemplates: {
        alignItems: 'center',
        padding: 40,
        gap: 12,
    },
    emptyTemplatesText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    emptyTemplatesSubtext: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
    },
    templatesList: {
        flex: 1,
    },
    templateCard: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    templateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    templateTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        flex: 1,
        marginRight: 10,
    },
    templatePreview: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 12,
        lineHeight: 20,
    },
    useTemplateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 10,
        backgroundColor: `${colors.primary}10`,
        borderRadius: 8,
    },
    useTemplateText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    horizontalScroll: {
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
    toneRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    toneBtn: {
        backgroundColor: colors.surface,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    toneBtnActive: {
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}10`,
    },
    toneEmoji: {
        fontSize: 16,
    },
    toneText: {
        color: colors.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    toneTextActive: {
        color: colors.text,
        fontWeight: '600',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        backgroundColor: colors.surface,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    chipActive: {
        backgroundColor: colors.primary,
    },
    chipText: {
        color: colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#fff',
    },
    formatRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    formatBtn: {
        backgroundColor: colors.surface,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    formatBtnActive: {
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}10`,
    },
    formatText: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '600',
    },
    formatTextActive: {
        color: colors.text,
    },
    generateBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 4,
        marginBottom: 20,
    },
    generateBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    generateBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    repliesSection: {
        marginTop: 4,
    },
    replyCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
    },
    replyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    replyBadge: {
        backgroundColor: `${colors.primary}15`,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    replyBadgeText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.surfaceLight,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    copyBtnText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    replyText: {
        color: colors.text,
        fontSize: 14,
        lineHeight: 22,
    },
    // Refine Section Styles
    refineSection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: colors.glassBorder,
    },
    refineTitle: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    refineSelectorRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    refineSelector: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: colors.surface,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    refineSelectorActive: {
        borderColor: colors.accent,
        backgroundColor: `${colors.accent}15`,
    },
    refineSelectorText: {
        color: colors.textMuted,
        fontSize: 13,
        fontWeight: '500',
    },
    refineSelectorTextActive: {
        color: colors.accent,
        fontWeight: '600',
    },
    refineInputRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-end',
    },
    refineInput: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        color: colors.text,
        fontSize: 14,
        minHeight: 50,
        maxHeight: 100,
        textAlignVertical: 'top',
    },
    refineBtn: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    refineBtnInner: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    refinedReplyCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        borderLeftWidth: 4,
        borderLeftColor: colors.accent,
    },
    refinedReplyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    refinedReplyTitle: {
        flex: 1,
        color: colors.accent,
        fontSize: 14,
        fontWeight: '600',
    },
    // Suggestion Chips Styles
    suggestionsScroll: {
        marginBottom: 12,
        marginHorizontal: -4,
    },
    suggestionsRow: {
        flexDirection: 'row',
        paddingHorizontal: 4,
        gap: 8,
    },
    suggestionChip: {
        backgroundColor: `${colors.accent}15`,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: `${colors.accent}30`,
    },
    suggestionText: {
        color: colors.accent,
        fontSize: 13,
        fontWeight: '500',
    },
    // History Section Styles
    clearAllText: {
        color: colors.error,
        fontSize: 13,
        fontWeight: '600',
    },
    emptyHistoryText: {
        color: colors.textMuted,
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 10,
    },
    historyCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    historyInfo: {
        flex: 1,
        marginRight: 10,
    },
    historyDate: {
        color: colors.textMuted,
        fontSize: 11,
        marginBottom: 4,
    },
    historyChips: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 6,
    },
    historyTag: {
        backgroundColor: `${colors.primary}15`,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    historyTagText: {
        color: colors.primary,
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    historyPreview: {
        color: colors.text,
        fontSize: 13,
    },
    deleteBtn: {
        padding: 8,
    },
    // Mode Toggle Styles
    modeToggleContainer: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        padding: 4,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 6,
        borderRadius: 8,
    },
    modeBtnActive: {
        backgroundColor: colors.primary,
    },
    modeBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMuted,
    },
    modeBtnTextActive: {
        color: '#fff',
    },
});

const GenericSelectionModal = ({ visible, onClose, title, data, onSelect, selectedId }) => {
    const { colors } = useTheme();
    const [search, setSearch] = useState('');

    const filteredData = data.filter(item =>
        item.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={{
                    backgroundColor: colors.background,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    height: '70%',
                    paddingTop: 20,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 5,
                    elevation: 5,
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.surface + '80', // slightly transparent surface
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        marginHorizontal: 20,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: colors.border || '#ccc',
                        height: 44
                    }}>
                        <Ionicons name="search" size={20} color={colors.textMuted || '#888'} />
                        <TextInput
                            style={{
                                flex: 1,
                                height: 44,
                                marginLeft: 8,
                                fontSize: 16,
                                color: colors.text
                            }}
                            placeholder="Search..."
                            placeholderTextColor={colors.textMuted || '#888'}
                            value={search}
                            onChangeText={setSearch}
                            autoCorrect={false}
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch('')}>
                                <Ionicons name="close-circle" size={18} color={colors.textMuted || '#888'} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        <View style={{ paddingHorizontal: 20 }}>
                            {filteredData.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: 16,
                                        borderBottomWidth: 1,
                                        borderBottomColor: colors.glassBorder || '#eee',
                                    }}
                                    onPress={() => {
                                        onSelect(item.id);
                                        onClose();
                                        setSearch('');
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        {item.icon && (
                                            <Ionicons name={item.icon} size={20} color={selectedId === item.id ? colors.primary : colors.textSecondary} />
                                        )}
                                        <Text style={{
                                            fontSize: 16,
                                            fontWeight: selectedId === item.id ? '600' : '400',
                                            color: selectedId === item.id ? colors.primary : colors.text
                                        }}>
                                            {item.label}
                                        </Text>
                                    </View>
                                    {selectedId === item.id && (
                                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                            {filteredData.length === 0 && (
                                <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 20 }}>
                                    No results found.
                                </Text>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};
