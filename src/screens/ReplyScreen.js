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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../context/ThemeContext';
import { useHistory } from '../context/HistoryContext';
import { generateReply } from '../services/api';

const TONES = [
    { id: 'friendly', label: 'Friendly', icon: 'happy-outline' },
    { id: 'professional', label: 'Professional', icon: 'briefcase-outline' },
    { id: 'casual', label: 'Casual', icon: 'cafe-outline' },
    { id: 'firm', label: 'Firm', icon: 'shield-outline' },
    { id: 'humorous', label: 'Humorous', icon: 'happy' },
    { id: 'empathetic', label: 'Empathetic', icon: 'heart-outline' },
    { id: 'enthusiastic', label: 'Enthusiastic', icon: 'flash-outline' },
    { id: 'apologetic', label: 'Apologetic', icon: 'hand-left-outline' },
    { id: 'grateful', label: 'Grateful', icon: 'gift-outline' },
    { id: 'confident', label: 'Confident', icon: 'trophy-outline' },
];

const STYLES = [
    { id: 'short', label: 'Short' },
    { id: 'detailed', label: 'Detailed' },
    { id: 'polite', label: 'Polite' },
    { id: 'direct', label: 'Direct' },
    { id: 'persuasive', label: 'Persuasive' },
    { id: 'diplomatic', label: 'Diplomatic' },
    { id: 'storytelling', label: 'Story' },
    { id: 'numbered', label: 'Numbered' },
];

const FORMATS = [
    { id: 'email', label: 'Email', icon: 'mail' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
    { id: 'sms', label: 'SMS', icon: 'chatbox' },
    { id: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin' },
    { id: 'twitter', label: 'Twitter', icon: 'logo-twitter' },
    { id: 'slack', label: 'Slack', icon: 'chatbubbles' },
    { id: 'letter', label: 'Letter', icon: 'document-text' },
];

export default function ReplyScreen() {
    const { colors } = useTheme();
    const { addReply } = useHistory();
    const [message, setMessage] = useState('');
    const [selectedTone, setSelectedTone] = useState('professional');
    const [selectedStyle, setSelectedStyle] = useState('short');
    const [selectedFormat, setSelectedFormat] = useState('email');
    const [replies, setReplies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!message.trim()) {
            Alert.alert('Error', 'Please paste a message to reply to');
            return;
        }

        setIsLoading(true);
        setReplies([]);

        try {
            const result = await generateReply(message, {
                tone: selectedTone,
                style: selectedStyle,
                format: selectedFormat,
            });
            setReplies(result);

            // Save first reply to history
            if (result && result.length > 0) {
                addReply(result[0], { tone: selectedTone, style: selectedStyle, format: selectedFormat });
            }
        } catch (error) {
            console.error('Error generating reply:', error);
            Alert.alert('Error', 'Failed to generate replies. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyReply = async (reply) => {
        await Clipboard.setStringAsync(reply);
        Alert.alert('Copied!', 'Reply copied to clipboard');
    };

    const pasteFromClipboard = async () => {
        const text = await Clipboard.getStringAsync();
        if (text) {
            setMessage(text);
        }
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
                        <Text style={styles.label}>Message to Reply</Text>
                        <TouchableOpacity style={styles.pasteBtn} onPress={pasteFromClipboard}>
                            <Ionicons name="clipboard" size={14} color={colors.primary} />
                            <Text style={styles.pasteBtnText}>Paste</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.inputCard}>
                        <TextInput
                            style={styles.messageInput}
                            placeholder="Paste the message you want to reply to..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            value={message}
                            onChangeText={setMessage}
                        />
                    </View>
                </View>

                {/* Tone */}
                <View style={styles.section}>
                    <Text style={styles.label}>Tone</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        <View style={styles.toneRow}>
                            {TONES.map((tone) => (
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
                        </View>
                    </ScrollView>
                </View>

                {/* Style */}
                <View style={styles.section}>
                    <Text style={styles.label}>Style</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        <View style={styles.chipRow}>
                            {STYLES.map((style) => (
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
                        </View>
                    </ScrollView>
                </View>

                {/* Format */}
                <View style={styles.section}>
                    <Text style={styles.label}>Format</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        <View style={styles.formatRow}>
                            {FORMATS.map((format) => (
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
                        </View>
                    </ScrollView>
                </View>

                {/* Generate Button */}
                <TouchableOpacity
                    style={styles.generateBtn}
                    onPress={handleGenerate}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={isLoading ? [colors.surfaceLight, colors.surface] : colors.gradientPrimary}
                        style={styles.generateBtnInner}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={colors.textMuted} />
                        ) : (
                            <>
                                <Ionicons name="sparkles" size={20} color="#fff" />
                                <Text style={styles.generateBtnText}>Generate Replies</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* Replies */}
                {replies.length > 0 && (
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
                            </View>
                        ))}
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
    content: {
        padding: 16,
        paddingBottom: 32,
    },
    section: {
        marginBottom: 20,
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
    horizontalScroll: {
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
    toneRow: {
        flexDirection: 'row',
        gap: 10,
        paddingRight: 16,
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
        gap: 8,
        paddingRight: 16,
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
        gap: 10,
        paddingRight: 16,
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
});
