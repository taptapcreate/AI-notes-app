import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Share,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import Markdown from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';

const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
};

export default function NoteDetailScreen({ route, navigation }) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { item, type } = route.params;
    const styles = createStyles(colors, insets);

    const isNote = type === 'note';

    const markdownStyles = {
        body: { color: colors.text, fontSize: 16, lineHeight: 26 },
        paragraph: { marginBottom: 12 },
        strong: { color: colors.primary, fontWeight: '700' },
        heading1: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 12, marginTop: 16 },
        heading2: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 10, marginTop: 14 },
        heading3: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8, marginTop: 12 },
        bullet_list: { marginBottom: 8 },
        list_item: { marginBottom: 6 },
        link: { color: colors.primary },
        code_inline: { backgroundColor: colors.surface, color: colors.primary, paddingHorizontal: 6, borderRadius: 4 },
        fence: { backgroundColor: colors.surface, padding: 12, borderRadius: 8, marginVertical: 8 },
    };

    const handleCopy = async () => {
        await Clipboard.setStringAsync(item.content);
        Alert.alert('Copied!', 'Content copied to clipboard');
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: item.content,
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={[styles.typeBadge, { backgroundColor: isNote ? `${colors.primary}20` : `${colors.secondary}20` }]}>
                    <Ionicons
                        name={isNote ? 'document-text' : 'chatbubble'}
                        size={16}
                        color={isNote ? colors.primary : colors.secondary}
                    />
                    <Text style={[styles.typeText, { color: isNote ? colors.primary : colors.secondary }]}>
                        {isNote ? 'Note' : 'Reply'}
                    </Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Date */}
            <View style={styles.dateContainer}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            </View>

            {/* Content */}
            <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
                <Markdown style={markdownStyles}>
                    {item.content}
                </Markdown>
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Action Bar */}
            <LinearGradient
                colors={[`${colors.background}00`, colors.background, colors.background]}
                style={styles.actionBarGradient}
            >
                <View style={styles.actionBar}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
                        <Ionicons name="copy-outline" size={22} color={colors.primary} />
                        <Text style={styles.actionText}>Copy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                        <Ionicons name="share-outline" size={22} color={colors.primary} />
                        <Text style={styles.actionText}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButtonPrimary}
                        onPress={() => navigation.navigate(isNote ? 'Notes' : 'Reply')}
                    >
                        <Ionicons name="add" size={22} color="#fff" />
                        <Text style={styles.actionTextPrimary}>New {isNote ? 'Note' : 'Reply'}</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
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
        paddingTop: 60,
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
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    typeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    dateText: {
        color: colors.textMuted,
        fontSize: 13,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    actionBarGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 40,
        paddingBottom: Math.max(insets?.bottom || 0, 20) + 16,
        paddingHorizontal: 16,
    },
    actionBar: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: colors.surface,
        paddingVertical: 14,
        borderRadius: 14,
    },
    actionText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    actionButtonPrimary: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 14,
    },
    actionTextPrimary: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
