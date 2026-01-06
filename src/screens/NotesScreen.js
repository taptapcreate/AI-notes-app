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
    Image,
    Dimensions,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../context/ThemeContext';
import { useHistory } from '../context/HistoryContext';
import { useFolders } from '../context/FoldersContext';
import { generateNotes, generateFollowUp } from '../services/api';

const { width } = Dimensions.get('window');

const INPUT_TYPES = [
    { id: 'text', icon: 'text', label: 'Text' },
    { id: 'image', icon: 'image', label: 'Image' },
    { id: 'voice', icon: 'mic', label: 'Voice' },
    { id: 'pdf', icon: 'document', label: 'PDF' },
    { id: 'website', icon: 'globe-outline', label: 'Web' },
    { id: 'youtube', icon: 'logo-youtube', label: 'YouTube' },
];

const NOTE_LENGTHS = [
    { id: 'brief', label: 'Brief', icon: 'flash' },
    { id: 'standard', label: 'Standard', icon: 'document-text' },
    { id: 'detailed', label: 'Detailed', icon: 'list' },
];

const FORMATS = [
    { id: 'bullet', label: 'Bullet Points', icon: 'list-outline' },
    { id: 'meeting', label: 'Meeting Minutes', icon: 'people-outline' },
    { id: 'study', label: 'Study Guide', icon: 'school-outline' },
    { id: 'todo', label: 'To-Do List', icon: 'checkbox-outline' },
    { id: 'summary', label: 'Summary', icon: 'document-text-outline' },
    { id: 'blog', label: 'Blog Post', icon: 'newspaper-outline' },
];

const TONES = [
    { id: 'professional', label: 'Professional', icon: 'briefcase-outline' },
    { id: 'academic', label: 'Academic', icon: 'library-outline' },
    { id: 'casual', label: 'Casual', icon: 'cafe-outline' },
    { id: 'creative', label: 'Creative', icon: 'color-palette-outline' },
];

const LANGUAGES = [
    { id: 'English', label: 'English' },
    { id: 'Spanish', label: 'Spanish' },
    { id: 'French', label: 'French' },
    { id: 'German', label: 'German' },
    { id: 'Italian', label: 'Italian' },
    { id: 'Hindi', label: 'Hindi' },
    { id: 'Japanese', label: 'Japanese' },
];

export default function NotesScreen() {
    const { colors } = useTheme();
    const { addNote } = useHistory();
    const { folders } = useFolders();
    const [inputType, setInputType] = useState('text');
    const [textInput, setTextInput] = useState('');
    const [linkInput, setLinkInput] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioUri, setAudioUri] = useState(null);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [generatedNotes, setGeneratedNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [noteLength, setNoteLength] = useState('standard');
    const [format, setFormat] = useState('bullet');
    const [tone, setTone] = useState('professional');
    const [language, setLanguage] = useState('English');
    const [lastContent, setLastContent] = useState(null);

    // Follow-up state
    const [followUpQuestion, setFollowUpQuestion] = useState('');
    const [followUpResponse, setFollowUpResponse] = useState('');
    const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

    // Folder state
    const [selectedFolder, setSelectedFolder] = useState('general');

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });
        if (!result.canceled) {
            setSelectedImage(result.assets[0]);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera permission is required');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });
        if (!result.canceled) {
            setSelectedImage(result.assets[0]);
        }
    };

    const startRecording = async () => {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Error', 'Failed to start recording');
        }
    };

    const stopRecording = async () => {
        try {
            setIsRecording(false);
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setAudioUri(uri);
            setRecording(null);
        } catch (err) {
            console.error('Failed to stop recording', err);
        }
    };

    const pickPdf = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });
            if (!result.canceled) {
                setSelectedPdf(result.assets[0]);
            }
        } catch (err) {
            console.error('Failed to pick PDF', err);
        }
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setGeneratedNotes('');

        try {
            let content = '';

            switch (inputType) {
                case 'text':
                    if (!textInput.trim()) {
                        Alert.alert('Error', 'Please enter some text');
                        setIsLoading(false);
                        return;
                    }
                    content = textInput;
                    break;
                case 'image':
                    if (!selectedImage) {
                        Alert.alert('Error', 'Please select an image');
                        setIsLoading(false);
                        return;
                    }
                    content = selectedImage.base64;
                    break;
                case 'voice':
                    if (!audioUri) {
                        Alert.alert('Error', 'Please record audio first');
                        setIsLoading(false);
                        return;
                    }
                    // Use 'base64' string instead of FileSystem.EncodingType.Base64
                    const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
                        encoding: 'base64',
                    });
                    content = audioBase64;
                    break;
                case 'pdf':
                    if (!selectedPdf) {
                        Alert.alert('Error', 'Please select a PDF');
                        setIsLoading(false);
                        return;
                    }
                    content = selectedPdf.name;
                    break;
                case 'website':
                case 'youtube':
                    if (!linkInput.trim()) {
                        Alert.alert('Error', 'Please enter a valid URL');
                        setIsLoading(false);
                        return;
                    }
                    content = linkInput;
                    break;
            }

            // Save content for regeneration
            setLastContent({ type: inputType, content });

            console.log(`[DEBUG] Generating notes for Type: ${inputType}, Content: ${content}`);
            const result = await generateNotes(inputType, content, { noteLength, format, tone, language });
            setGeneratedNotes(result);

            // Save to history with folder
            addNote(result, selectedFolder);
        } catch (error) {
            console.error('Error generating notes:', error);

            if (error.message.includes('YOUTUBE_BLOCK')) {
                Alert.alert(
                    'YouTube Access Blocked',
                    'YouTube is blocking automated transcript fetching on this network.\n\nPlease:\n1. Open the video\n2. Copy the transcript manually\n3. Switch to "Text" mode here and paste it.'
                );
            } else if (error.message.includes('WEB_ACCESS_BLOCKED')) {
                Alert.alert(
                    'Website Access Blocked',
                    'This website has strict bot protection that prevents automated reading.\n\nPlease:\n1. Copy the article text manually\n2. Switch to "Text" mode here and paste it.'
                );
            } else {
                Alert.alert('Error', error.message || 'Failed to generate notes. Please check your connection.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const regenerateNotes = async () => {
        if (!lastContent) {
            Alert.alert('Error', 'No content to regenerate. Generate notes first.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await generateNotes(lastContent.type, lastContent.content, { noteLength, format, tone, language });
            setGeneratedNotes(result);
            addNote(result, selectedFolder);
        } catch (error) {
            console.error('Error regenerating notes:', error);
            Alert.alert('Error', error.message || 'Failed to regenerate notes.');
        } finally {
            setIsLoading(false);
        }
    };

    const shareNotes = async () => {
        if (!generatedNotes) return;

        try {
            await Share.share({
                message: generatedNotes,
                title: 'My Notes',
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const copyNotes = async () => {
        await Clipboard.setStringAsync(generatedNotes);
        Alert.alert('Copied!', 'Notes copied to clipboard');
    };

    const handleFollowUp = async () => {
        if (!followUpQuestion.trim()) {
            Alert.alert('Error', 'Please enter a follow-up question');
            return;
        }
        if (!generatedNotes) {
            Alert.alert('Error', 'Generate notes first before asking follow-up questions');
            return;
        }

        setIsFollowUpLoading(true);
        try {
            const response = await generateFollowUp(generatedNotes, followUpQuestion, 'note');
            setFollowUpResponse(response);
            setFollowUpQuestion('');
        } catch (error) {
            console.error('Error generating follow-up:', error);
            Alert.alert('Error', error.message || 'Failed to generate follow-up response.');
        } finally {
            setIsFollowUpLoading(false);
        }
    };

    const clearInput = () => {
        setTextInput('');
        setLinkInput('');
        setSelectedImage(null);
        setAudioUri(null);
        setSelectedPdf(null);
        setGeneratedNotes('');
        setFollowUpQuestion('');
        setFollowUpResponse('');
    };

    const styles = createStyles(colors);

    const renderInputArea = () => {
        switch (inputType) {
            case 'text':
                return (
                    <View style={styles.inputCard}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Type or paste your content here..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            value={textInput}
                            onChangeText={setTextInput}
                        />
                    </View>
                );
            case 'image':
                return (
                    <View style={styles.inputCard}>
                        {selectedImage ? (
                            <View style={styles.previewContainer}>
                                <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
                                <TouchableOpacity style={styles.removeBtn} onPress={() => setSelectedImage(null)}>
                                    <View style={styles.removeBtnInner}>
                                        <Ionicons name="close" size={18} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.mediaButtons}>
                                <TouchableOpacity style={styles.mediaBtn} onPress={pickImage}>
                                    <LinearGradient colors={colors.gradientPrimary} style={styles.mediaBtnIcon}>
                                        <Ionicons name="images" size={26} color="#fff" />
                                    </LinearGradient>
                                    <Text style={styles.mediaBtnText}>Gallery</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.mediaBtn} onPress={takePhoto}>
                                    <LinearGradient colors={colors.gradientAccent} style={styles.mediaBtnIcon}>
                                        <Ionicons name="camera" size={26} color="#fff" />
                                    </LinearGradient>
                                    <Text style={styles.mediaBtnText}>Camera</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                );
            case 'voice':
                return (
                    <View style={styles.inputCard}>
                        <View style={styles.recordContainer}>
                            <TouchableOpacity onPress={isRecording ? stopRecording : startRecording}>
                                <LinearGradient
                                    colors={isRecording ? ['#EF4444', '#DC2626'] : colors.gradientPrimary}
                                    style={styles.recordBtn}
                                >
                                    <Ionicons name={isRecording ? 'stop' : 'mic'} size={36} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                            <Text style={styles.recordText}>
                                {isRecording ? 'Recording... Tap to stop' : audioUri ? 'Recording saved! Tap to re-record' : 'Tap to start recording'}
                            </Text>
                            {audioUri && !isRecording && (
                                <View style={styles.audioReady}>
                                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                                    <Text style={styles.audioReadyText}>Ready to process</Text>
                                </View>
                            )}
                        </View>
                    </View>
                );
            case 'pdf':
                return (
                    <View style={styles.inputCard}>
                        {selectedPdf ? (
                            <View style={styles.pdfPreview}>
                                <LinearGradient colors={colors.gradientSecondary} style={styles.pdfIcon}>
                                    <Ionicons name="document" size={28} color="#fff" />
                                </LinearGradient>
                                <Text style={styles.pdfName} numberOfLines={2}>{selectedPdf.name}</Text>
                                <TouchableOpacity onPress={() => setSelectedPdf(null)}>
                                    <Text style={styles.pdfRemoveText}>Remove</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.uploadArea} onPress={pickPdf}>
                                <LinearGradient colors={colors.gradientSecondary} style={styles.uploadIcon}>
                                    <Ionicons name="cloud-upload" size={28} color="#fff" />
                                </LinearGradient>
                                <Text style={styles.uploadText}>Upload PDF</Text>
                                <Text style={styles.uploadSubtext}>Tap to select file</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                );
            case 'website':
            case 'youtube':
                return (
                    <View style={styles.inputCard}>
                        <View style={styles.linkContainer}>
                            <LinearGradient
                                colors={inputType === 'youtube' ? ['#FF0000', '#CC0000'] : colors.gradientPrimary}
                                style={styles.linkIcon}
                            >
                                <Ionicons
                                    name={inputType === 'youtube' ? 'logo-youtube' : 'globe-outline'}
                                    size={24}
                                    color="#fff"
                                />
                            </LinearGradient>
                            <TextInput
                                style={styles.linkInput}
                                placeholder={inputType === 'youtube' ? "Paste YouTube video URL..." : "Paste article URL..."}
                                placeholderTextColor={colors.textMuted}
                                value={linkInput}
                                onChangeText={setLinkInput}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {linkInput.length > 0 && (
                                <TouchableOpacity onPress={() => setLinkInput('')}>
                                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={styles.linkHint}>
                            {inputType === 'youtube'
                                ? "We'll watch the video and summarize it for you!"
                                : "We'll read the website and create organized notes."}
                        </Text>
                    </View>
                );
        }
    };


    // Markdown styles for the output
    const markdownStyles = {
        body: {
            color: colors.text,
            fontSize: 15,
            lineHeight: 24,
        },
        heading1: {
            color: colors.primary,
            fontSize: 22,
            fontWeight: '800',
            marginBottom: 12,
            marginTop: 16,
        },
        heading2: {
            color: colors.text,
            fontSize: 18,
            fontWeight: '700',
            marginBottom: 10,
            marginTop: 14,
        },
        heading3: {
            color: colors.textSecondary,
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 8,
            marginTop: 12,
        },
        paragraph: {
            color: colors.text,
            marginBottom: 12,
            lineHeight: 24,
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
            marginBottom: 8,
        },
        ordered_list: {
            marginLeft: 8,
            marginBottom: 8,
        },
        bullet_list_icon: {
            color: colors.primary,
            fontSize: 8,
            marginRight: 8,
        },
        list_item: {
            marginBottom: 8,
            flexDirection: 'row',
        },
        code_inline: {
            backgroundColor: colors.surfaceLight,
            color: colors.accent,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 6,
            fontFamily: 'monospace',
        },
        code_block: {
            backgroundColor: colors.surfaceLight,
            padding: 12,
            borderRadius: 12,
            marginVertical: 10,
        },
        fence: {
            backgroundColor: colors.surfaceLight,
            padding: 12,
            borderRadius: 12,
            marginVertical: 10,
        },
        blockquote: {
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
            paddingLeft: 12,
            marginLeft: 0,
            marginVertical: 10,
            backgroundColor: `${colors.primary}10`,
            borderRadius: 8,
            paddingVertical: 8,
        },
        hr: {
            backgroundColor: colors.glassBorder,
            height: 1,
            marginVertical: 16,
        },
        link: {
            color: colors.primary,
            textDecorationLine: 'underline',
        },
        table: {
            borderColor: colors.glassBorder,
            marginVertical: 10,
        },
        th: {
            backgroundColor: colors.surfaceLight,
            padding: 8,
        },
        td: {
            padding: 8,
            borderColor: colors.glassBorder,
        },
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Input Type Tabs */}
                <View style={styles.tabContainer}>
                    {INPUT_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            style={[styles.tab, inputType === type.id && styles.tabActive]}
                            onPress={() => { setInputType(type.id); clearInput(); }}
                        >
                            <Ionicons
                                name={type.icon}
                                size={20}
                                color={inputType === type.id ? '#fff' : colors.textMuted}
                            />
                            <Text style={[styles.tabText, inputType === type.id && styles.tabTextActive]}>
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Input Area */}
                {renderInputArea()}

                {/* Note Length Selector */}
                <View style={styles.lengthSection}>
                    <Text style={styles.lengthLabel}>Note Length</Text>
                    <View style={styles.lengthRow}>
                        {NOTE_LENGTHS.map((length) => (
                            <TouchableOpacity
                                key={length.id}
                                style={[styles.lengthBtn, noteLength === length.id && styles.lengthBtnActive]}
                                onPress={() => setNoteLength(length.id)}
                            >
                                <Ionicons
                                    name={length.icon}
                                    size={16}
                                    color={noteLength === length.id ? '#fff' : colors.textMuted}
                                />
                                <Text style={[styles.lengthText, noteLength === length.id && styles.lengthTextActive]}>
                                    {length.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>


                {/* Format Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Format</Text>
                    <View style={styles.wrapRow}>
                        {FORMATS.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.optionBtn, format === item.id && styles.optionBtnActive]}
                                onPress={() => setFormat(item.id)}
                            >
                                <Ionicons
                                    name={item.icon}
                                    size={16}
                                    color={format === item.id ? colors.primary : colors.textSecondary}
                                />
                                <Text style={[styles.optionText, format === item.id && styles.optionTextActive]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Tone Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tone</Text>
                    <View style={styles.wrapRow}>
                        {TONES.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.optionBtn, tone === item.id && styles.optionBtnActive]}
                                onPress={() => setTone(item.id)}
                            >
                                <Ionicons
                                    name={item.icon}
                                    size={16}
                                    color={tone === item.id ? colors.primary : colors.textSecondary}
                                />
                                <Text style={[styles.optionText, tone === item.id && styles.optionTextActive]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Language Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Language</Text>
                    <View style={styles.wrapRow}>
                        {LANGUAGES.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.optionBtn, language === item.id && styles.optionBtnActive]}
                                onPress={() => setLanguage(item.id)}
                            >
                                <Text style={[styles.optionText, language === item.id && styles.optionTextActive]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Folder Selector */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Save to Folder</Text>
                    <View style={styles.wrapRow}>
                        {folders.map((folder) => (
                            <TouchableOpacity
                                key={folder.id}
                                style={[styles.folderBtn, selectedFolder === folder.id && styles.folderBtnActive]}
                                onPress={() => setSelectedFolder(folder.id)}
                            >
                                <Ionicons
                                    name={folder.icon}
                                    size={16}
                                    color={selectedFolder === folder.id ? '#fff' : folder.color}
                                />
                                <Text style={[styles.folderText, selectedFolder === folder.id && styles.folderTextActive]}>
                                    {folder.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
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
                                <Text style={styles.generateBtnText}>Generate Notes</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* Output */}
                {
                    generatedNotes ? (
                        <View style={styles.outputSection}>
                            <View style={styles.outputHeader}>
                                <Text style={styles.outputTitle}>Generated Notes</Text>
                            </View>

                            {/* Action Buttons Row */}
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={styles.actionBtn} onPress={regenerateNotes} disabled={isLoading}>
                                    <Ionicons name="refresh" size={18} color={colors.primary} />
                                    <Text style={styles.actionBtnText}>Regenerate</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn} onPress={shareNotes}>
                                    <Ionicons name="share-outline" size={18} color={colors.secondary} />
                                    <Text style={[styles.actionBtnText, { color: colors.secondary }]}>Share</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn} onPress={copyNotes}>
                                    <Ionicons name="copy-outline" size={18} color={colors.accent} />
                                    <Text style={[styles.actionBtnText, { color: colors.accent }]}>Copy</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.outputCard}>
                                <Markdown style={markdownStyles}>{generatedNotes}</Markdown>
                            </View>

                            {/* Follow-up Section */}
                            <View style={styles.followUpSection}>
                                <Text style={styles.followUpTitle}>Ask a Follow-up Question</Text>

                                {/* Suggestion Chips */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
                                    <View style={styles.suggestionsRow}>
                                        {[
                                            'Explain this in simpler terms',
                                            'Give me more details',
                                            'Summarize the key points',
                                            'Create action items from this',
                                        ].map((suggestion, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={styles.suggestionChip}
                                                onPress={() => setFollowUpQuestion(suggestion)}
                                            >
                                                <Text style={styles.suggestionText}>{suggestion}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>

                                <View style={styles.followUpInputRow}>
                                    <TextInput
                                        style={styles.followUpInput}
                                        placeholder="Or type your own question..."
                                        placeholderTextColor={colors.textMuted}
                                        value={followUpQuestion}
                                        onChangeText={setFollowUpQuestion}
                                        multiline
                                    />
                                    <TouchableOpacity
                                        style={styles.followUpBtn}
                                        onPress={handleFollowUp}
                                        disabled={isFollowUpLoading}
                                    >
                                        <LinearGradient
                                            colors={colors.gradientSecondary}
                                            style={styles.followUpBtnInner}
                                        >
                                            {isFollowUpLoading ? (
                                                <ActivityIndicator color="#fff" size="small" />
                                            ) : (
                                                <Ionicons name="send" size={18} color="#fff" />
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>

                                {followUpResponse ? (
                                    <View style={styles.followUpResponseCard}>
                                        <View style={styles.followUpResponseHeader}>
                                            <Ionicons name="chatbubble-ellipses" size={16} color={colors.secondary} />
                                            <Text style={styles.followUpResponseTitle}>AI Response</Text>
                                        </View>
                                        <Markdown style={markdownStyles}>{followUpResponse}</Markdown>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                    ) : null
                }
            </ScrollView >
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
    tabContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 4,
        marginBottom: 20,
    },
    tab: {
        width: '31%', // Fits 3 per row with gap
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
        marginBottom: 4,
    },
    tabActive: {
        backgroundColor: colors.primary,
    },
    tabText: {
        color: colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#fff',
    },
    inputCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        minHeight: 160,
        justifyContent: 'center',
    },
    textInput: {
        color: colors.text,
        fontSize: 16,
        minHeight: 130,
        textAlignVertical: 'top',
        lineHeight: 24,
    },
    mediaButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 32,
    },
    mediaBtn: {
        alignItems: 'center',
    },
    mediaBtnIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    mediaBtnText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    previewContainer: {
        alignItems: 'center',
    },
    imagePreview: {
        width: width - 64,
        height: 180,
        borderRadius: 12,
    },
    removeBtn: {
        position: 'absolute',
        top: -8,
        right: 0,
    },
    removeBtnInner: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.error,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordContainer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    recordBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    recordText: {
        color: colors.textSecondary,
        fontSize: 14,
        textAlign: 'center',
    },
    audioReady: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        backgroundColor: `${colors.success}15`,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    audioReadyText: {
        color: colors.success,
        fontSize: 13,
        fontWeight: '500',
    },
    pdfPreview: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    pdfIcon: {
        width: 60,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    pdfName: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 8,
        maxWidth: 200,
    },
    pdfRemoveText: {
        color: colors.error,
        fontSize: 14,
        fontWeight: '500',
    },
    uploadArea: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    uploadIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    uploadText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    uploadSubtext: {
        color: colors.textMuted,
        fontSize: 13,
    },
    linkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.background,
        padding: 4,
        paddingRight: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    linkIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    linkInput: {
        flex: 1,
        fontSize: 15,
        color: colors.text,
        height: 44,
    },
    linkHint: {
        color: colors.textMuted,
        fontSize: 13,
        textAlign: 'center',
    },
    generateBtn: {
        borderRadius: 16,
        overflow: 'hidden',
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
    outputSection: {
        marginTop: 4,
    },
    outputHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    outputTitle: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '700',
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.surface,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    copyBtnText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    outputCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
    },
    outputText: {
        color: colors.text,
        fontSize: 15,
        lineHeight: 24,
    },
    lengthSection: {
        marginBottom: 16,
    },
    lengthLabel: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    lengthRow: {
        flexDirection: 'row',
        flexDirection: 'row',
        gap: 10,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 10,
    },
    wrapRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.surface,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    optionBtnActive: {
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}10`,
    },
    optionText: {
        color: colors.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    optionTextActive: {
        color: colors.text,
        fontWeight: '600',
    },
    lengthBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: colors.surface,
        paddingVertical: 12,
        borderRadius: 12,
    },
    lengthBtnActive: {
        backgroundColor: colors.primary,
    },
    lengthText: {
        color: colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },
    lengthTextActive: {
        color: '#fff',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: colors.surface,
        paddingVertical: 12,
        borderRadius: 12,
    },
    actionBtnText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    // Folder Selector Styles
    folderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.surface,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    folderBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    folderText: {
        color: colors.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    folderTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    // Follow-up Section Styles
    followUpSection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: colors.glassBorder,
    },
    followUpTitle: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    followUpInputRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-end',
    },
    followUpInput: {
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
    followUpBtn: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    followUpBtnInner: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    followUpResponseCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        borderLeftWidth: 4,
        borderLeftColor: colors.secondary,
    },
    followUpResponseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    followUpResponseTitle: {
        color: colors.secondary,
        fontSize: 14,
        fontWeight: '600',
    },
});
