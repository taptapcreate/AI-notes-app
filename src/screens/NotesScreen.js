import React, { useState, useEffect } from 'react';
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
    Modal,
    Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import * as Calendar from 'expo-calendar';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../context/ThemeContext';
import { useHistory } from '../context/HistoryContext';
import { useFolders } from '../context/FoldersContext';
import { useUser } from '../context/UserContext';
import { generateNotes, generateFollowUp, streamNotes } from '../services/api';
import { BannerAd, BannerAdSize, InterstitialAd, AdEventType, adUnitIDs, areAdsEnabled } from '../services/AdService';
import { useStaggerAnimation, AnimatedSection } from '../hooks/useStaggerAnimation';

const { width } = Dimensions.get('window');

const INPUT_TYPES = [
    { id: 'text', icon: 'text', label: 'Text' },
    { id: 'image', icon: 'image', label: 'Image' },
    { id: 'voice', icon: 'mic', label: 'Voice' },
    { id: 'pdf', icon: 'document', label: 'PDF' },
    { id: 'website', icon: 'globe-outline', label: 'Web' },
    { id: 'youtube', icon: 'logo-youtube', label: 'YouTube' },
    { id: 'calendar', icon: 'calendar', label: 'Calendar' },
    { id: 'location', icon: 'location-outline', label: 'Travel' },
    { id: 'import', icon: 'folder-open-outline', label: 'Import' },
];

const NOTE_LENGTHS = [
    { id: 'brief', label: 'Brief', icon: 'flash' },
    { id: 'standard', label: 'Standard', icon: 'document-text' },
    { id: 'detailed', label: 'Detailed', icon: 'list' },
];



const FORMATS = [
    { id: 'bullet', label: 'Bullet Points', icon: 'list-outline', desc: 'Clean, hierarchical list' },
    { id: 'meeting', label: 'Meeting Minutes', icon: 'people-outline', desc: 'Attendees, decisions, actions' },
    { id: 'study', label: 'Study Guide', icon: 'school-outline', desc: 'Concepts, definitions, review' },
    { id: 'todo', label: 'To-Do List', icon: 'checkbox-outline', desc: 'Prioritized tasks & checkboxes' },
    { id: 'summary', label: 'Summary', icon: 'document-text-outline', desc: 'Executive overview & findings' },
    { id: 'blog', label: 'Blog Post', icon: 'newspaper-outline', desc: 'Title, intro, body, conclusion' },
    { id: 'eli5', label: 'ELI5', icon: 'happy-outline', desc: 'Explain Like I\'m 5 (Simple)' },
    { id: 'quiz', label: 'Quiz Gen', icon: 'help-circle-outline', desc: 'Generate 5 study questions' },
    { id: 'recipe', label: 'Recipe', icon: 'restaurant-outline', desc: 'Extract ingredients & steps' },
    { id: 'code', label: 'Code Explainer', icon: 'code-slash-outline', desc: 'Break down code snippets' },
    { id: 'email', label: 'Email Draft', icon: 'mail-outline', desc: 'Turn notes into an email' },
];

const TONES = [
    { id: 'professional', label: 'Professional', icon: 'briefcase-outline' },
    { id: 'academic', label: 'Academic', icon: 'library-outline' },
    { id: 'casual', label: 'Casual', icon: 'cafe-outline' },
    { id: 'creative', label: 'Creative', icon: 'color-palette-outline' },
];

const LANGUAGES = [
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

export default function NotesScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const { addNote, deleteNote, clearAllNotes, notes = [] } = useHistory();
    const { folders } = useFolders();
    const { useCredits, checkAvailability, getCreditData, hasProSubscription } = useUser();

    // Stagger animation for sections
    const { fadeAnims, slideAnims } = useStaggerAnimation(5);

    // Interstitial Ad State
    const [interstitial, setInterstitial] = useState(null);
    const [interstitialLoaded, setInterstitialLoaded] = useState(false);

    // Folder state
    const [selectedFolder, setSelectedFolder] = useState('general');

    // Input state
    const [inputType, setInputType] = useState('text');
    const [textInput, setTextInput] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [audioUri, setAudioUri] = useState(null);
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [linkInput, setLinkInput] = useState('');

    // Output state
    const [generatedNotes, setGeneratedNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastContent, setLastContent] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [detectedLocation, setDetectedLocation] = useState(null); // For Travel mode

    // Settings state
    const [noteLength, setNoteLength] = useState('standard');
    const [format, setFormat] = useState('bullet');
    const [tone, setTone] = useState('professional');
    const [language, setLanguage] = useState('English');
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [showTemplates, setShowTemplates] = useState(true);
    const [showLength, setShowLength] = useState(true);

    // Template Modal State
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);
    const [templateSearch, setTemplateSearch] = useState('');



    // Follow-up State
    const [followUpQuestion, setFollowUpQuestion] = useState('');
    const [followUpResponse, setFollowUpResponse] = useState('');
    const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

    // Calendar State
    const [events, setEvents] = useState([]);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Visuals State
    const [showVisualsModal, setShowVisualsModal] = useState(false);
    const [mermaidCode, setMermaidCode] = useState('');
    const [isVisualizing, setIsVisualizing] = useState(false);

    const handleCalendarImport = async () => {
        try {
            console.log("Requesting calendar permissions...");
            const { status } = await Calendar.requestCalendarPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'We need calendar access to find your meetings.');
                return;
            }

            console.log("Fetching calendars...");
            const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
            console.log("Calendars fetched:", calendars ? calendars.length : "null");

            if (!calendars || !Array.isArray(calendars) || calendars.length === 0) {
                console.log("No valid calendars found");
                Alert.alert('No Calendars', 'No calendars found on this device.');
                return;
            }

            const calendarIds = calendars.map(c => c.id);

            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + 7); // Next 7 days

            console.log("Fetching events for IDs:", calendarIds);
            const upcomingEvents = await Calendar.getEventsAsync(calendarIds, startDate, endDate);

            if (!upcomingEvents || !Array.isArray(upcomingEvents)) {
                console.log("No valid events found");
                Alert.alert('No Events', 'No upcoming events found.');
                return;
            }

            // Filter and sort
            const sortedEvents = upcomingEvents
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .map(e => ({
                    id: e.id,
                    title: e.title,
                    startDate: e.startDate,
                    endDate: e.endDate,
                    location: e.location,
                    notes: e.notes
                }));

            if (sortedEvents.length === 0) {
                Alert.alert('No Events', 'No upcoming events found in the next 7 days.');
                return;
            }

            setEvents(sortedEvents);
            setShowEventModal(true);
        } catch (error) {
            console.error('Calendar Error:', error);
            Alert.alert('Error', 'Failed to fetch calendar events.');
        }
    };



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

    const handleLocationGuide = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                return;
            }

            setIsLoading(true);
            let location = await Location.getCurrentPositionAsync({});
            let address = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            if (address && address.length > 0) {
                const place = address[0];
                const locationString = `${place.city || place.subregion || place.region}, ${place.country}`;
                setDetectedLocation(locationString);
                // Store the prompt in textInput behind the scenes for handleGenerate to use
                setTextInput(`Create a comprehensive travel guide for ${locationString}. Include top attractions, local food recommendations, and cultural tips.`);
            }
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            setIsLoading(false);
            Alert.alert("Error", "Could not fetch location");
        }
    };

    const handleFileImport = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/plain', 'text/markdown'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                const fileContent = await FileSystem.readAsStringAsync(file.uri);
                setInputType('text');
                setTextInput(fileContent);
                Alert.alert("File Imported!", "Content loaded into text area.");
            }
        } catch (err) {
            console.error('Failed to read file', err);
            Alert.alert("Error", "Could not read file");
        }
    };

    const handleEventSelect = (event) => {
        const details = `Meeting: ${event.title}\nTime: ${new Date(event.startDate).toLocaleString()}\nLocation: ${event.location || 'Online'}\nNotes: ${event.notes || 'None'}`;
        setTextInput(details);
        setSelectedEvent(event);
        setShowEventModal(false);
    };

    const handleGenerate = async () => {
        // Prevent duplicate calls if already loading
        if (isLoading) {
            console.log('[DEBUG] Already loading, ignoring duplicate call');
            return;
        }

        if (!checkAvailability(1)) {
            Alert.alert(
                'Credits Exhausted',
                'You have reached your daily AI limit. Buy credits or wait until tomorrow for more free credits.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Buy Credits', onPress: () => navigation.navigate('Credits') }
                ]
            );
            return;
        }

        setIsLoading(true);
        setGeneratedNotes('');

        try {
            let content = '';

            let apiType = inputType;
            // Map custom types to 'text' for backend compatibility if needed, 
            // or ensure backend supports them. Assuming backend treats 'text' generically.
            if (['calendar', 'location', 'import'].includes(inputType)) {
                apiType = 'text';
            }

            switch (inputType) {
                case 'text':
                case 'calendar':
                case 'location':
                case 'import':
                    if (!textInput.trim()) {
                        Alert.alert('Error', 'Please enter some text or select an item');
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

            console.log(`[DEBUG] Streaming notes for Type: ${apiType}`);

            // Use streaming for real-time typing effect
            await streamNotes(
                apiType,
                content,
                { noteLength, format, tone, language },
                // onChunk - receives the accumulated text, just set it directly
                (accumulatedText) => {
                    setGeneratedNotes(accumulatedText);
                },
                // onComplete - save to history (receives the final complete text)
                async (finalText) => {
                    // Deduct credit only on success
                    await useCredits(1);

                    // Show interstitial ad after generation for non-pro users
                    if (areAdsEnabled && !hasProSubscription && interstitialLoaded && interstitial) {
                        setTimeout(() => {
                            interstitial.show().catch(err => console.error('Error showing interstitial:', err));
                        }, 800);
                    }

                    // Save to history with folder
                    addNote(finalText, selectedFolder);
                    setIsLoading(false);
                },
                // onError - handle errors
                (error) => {
                    console.error('Streaming error:', error);
                    Alert.alert('Error', error.message || 'Failed to generate notes');
                    setIsLoading(false);
                }
            );
            return; // Exit early since streaming handles completion
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

    const exportAsText = async () => {
        if (!generatedNotes) return;

        try {
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `AI_Notes_${timestamp}.txt`;
            const fileUri = `${FileSystem.documentDirectory}${filename}`;

            await FileSystem.writeAsStringAsync(fileUri, generatedNotes);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'text/plain',
                    dialogTitle: 'Export Notes as Text'
                });
            }
        } catch (error) {
            console.error('Export error:', error);
            Alert.alert('Error', 'Failed to export file');
        }
    };

    const exportAsMarkdown = async () => {
        if (!generatedNotes) return;

        try {
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `AI_Notes_${timestamp}.md`;
            const fileUri = `${FileSystem.documentDirectory}${filename}`;

            await FileSystem.writeAsStringAsync(fileUri, generatedNotes);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'text/markdown',
                    dialogTitle: 'Export Notes as Markdown'
                });
            }
        } catch (error) {
            console.error('Export error:', error);
            Alert.alert('Error', 'Failed to export file');
        }
    };

    const handleFollowUp = async () => {
        if (!checkAvailability(1)) {
            Alert.alert('Credits Exhausted', 'Please buy more credits to ask follow-up questions.');
            return;
        }
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
            await useCredits(1);
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

    const handleClearAllHistory = () => {
        Alert.alert(
            'Clear History',
            'Are you sure you want to delete all note history?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete All', style: 'destructive', onPress: clearAllNotes }
            ]
        );
    };

    const handleDeleteNote = (id) => {
        Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteNote(id) }
            ]
        );
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
                            maxLength={5000}
                        />
                        <View style={styles.charCounter}>
                            <Text style={[styles.charCountText, textInput.length > 4500 && { color: colors.warning }]}>
                                {textInput.length.toLocaleString()} / 5,000
                            </Text>
                        </View>
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
            case 'calendar':
                return (
                    <View style={styles.inputCard}>
                        {selectedEvent ? (
                            <View style={styles.pdfPreview}>
                                <LinearGradient colors={colors.gradientFormatted} style={styles.pdfIcon}>
                                    <Ionicons name="calendar" size={28} color="#fff" />
                                </LinearGradient>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.pdfName} numberOfLines={1}>{selectedEvent.title}</Text>
                                    <Text style={styles.uploadSubtext}>
                                        {new Date(selectedEvent.startDate).toLocaleDateString()}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => { setSelectedEvent(null); setTextInput(''); }}>
                                    <Text style={styles.pdfRemoveText}>Change</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.uploadArea} onPress={handleCalendarImport}>
                                <LinearGradient colors={colors.gradientFormatted} style={styles.uploadIcon}>
                                    <Ionicons name="calendar-outline" size={28} color="#fff" />
                                </LinearGradient>
                                <Text style={styles.uploadText}>Select Meeting</Text>
                                <Text style={styles.uploadSubtext}>Import from Calendar</Text>
                            </TouchableOpacity>
                        )}
                        <Text style={styles.linkHint}>
                            We'll analyze the event details and create a prep brief.
                        </Text>
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

            case 'location':
                return (
                    <View style={styles.inputCard}>
                        {detectedLocation ? (
                            // Show detected location
                            <View style={styles.locationCard}>
                                <LinearGradient colors={['#4F46E5', '#4338CA']} style={styles.locationIconLarge}>
                                    <Ionicons name="location" size={32} color="#fff" />
                                </LinearGradient>
                                <View style={styles.locationInfo}>
                                    <Text style={styles.locationLabel}>Your Current Location</Text>
                                    <Text style={styles.locationName}>{detectedLocation}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.locationRefresh}
                                    onPress={() => {
                                        setDetectedLocation(null);
                                        setTextInput('');
                                        handleLocationGuide();
                                    }}
                                >
                                    <Ionicons name="refresh" size={20} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            // Show detect button
                            <TouchableOpacity style={styles.uploadArea} onPress={handleLocationGuide}>
                                <LinearGradient colors={['#4F46E5', '#4338CA']} style={styles.uploadIcon}>
                                    <Ionicons name="location" size={28} color="#fff" />
                                </LinearGradient>
                                <Text style={styles.uploadText}>Detect My Location</Text>
                                <Text style={styles.uploadSubtext}>Tap to get a travel guide for your city</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                );
            case 'import':
                return (
                    <View style={styles.inputCard}>
                        <TouchableOpacity style={styles.uploadArea} onPress={handleFileImport}>
                            <LinearGradient colors={['#059669', '#047857']} style={styles.uploadIcon}>
                                <Ionicons name="document-text" size={28} color="#fff" />
                            </LinearGradient>
                            <Text style={styles.uploadText}>Import Text File</Text>
                            <Text style={styles.uploadSubtext}>Pick a .txt or .md file to summarize</Text>
                        </TouchableOpacity>
                    </View>
                );
        }
    };


    // Markdown styles for the output
    const handleVisualize = async () => {
        if (!generatedNotes) return;

        setIsVisualizing(true);
        try {
            const prompt = `Create a mermaid.js diagram (graph TD or mindmap) to visualize the following notes. Return ONLY the raw mermaid code, no markdown backticks or explanations:\n\n${generatedNotes}`;
            const result = await generateNotes('text', prompt, { noteLength: 'brief' });

            // Clean up result just in case
            const cleanCode = result.replace(/```mermaid/g, '').replace(/```/g, '').trim();
            setMermaidCode(cleanCode);
            setShowVisualsModal(true);
        } catch (error) {
            Alert.alert('Error', 'Failed to generate diagram');
        } finally {
            setIsVisualizing(false);
        }
    };

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
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabScrollContainer}
                    style={styles.tabScroll}
                >
                    {INPUT_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            style={[styles.tab, inputType === type.id && styles.tabActive]}
                            onPress={() => { setInputType(type.id); clearInput(); }}
                        >
                            <Ionicons
                                name={type.icon}
                                size={16}
                                color={inputType === type.id ? '#fff' : colors.textMuted}
                            />
                            <Text style={[styles.tabText, inputType === type.id && styles.tabTextActive]}>
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Input Area */}
                {renderInputArea()}

                {/* Template Carousel (Format) */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: showTemplates ? 10 : 0 }}
                        onPress={() => setShowTemplates(!showTemplates)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.sectionTitle}>Chose Template</Text>
                            <Ionicons name={showTemplates ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
                        </View>
                        {showTemplates && (
                            <TouchableOpacity onPress={() => setShowTemplatesModal(true)}>
                                <Text style={{ color: colors.primary, fontWeight: '600' }}>See All</Text>
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>

                    {showTemplates && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={{ marginHorizontal: -20 }}
                            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
                        >
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                {FORMATS.slice(0, 5).map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[
                                            styles.templateCard,
                                            format === item.id && styles.templateCardActive
                                        ]}
                                        onPress={() => setFormat(item.id)}
                                        activeOpacity={0.9}
                                    >
                                        <LinearGradient
                                            colors={format === item.id ? colors.gradientPrimary : [colors.surface, colors.surface]}
                                            style={styles.templateIconContainer}
                                        >
                                            <Ionicons
                                                name={item.icon}
                                                size={24}
                                                color={format === item.id ? '#fff' : colors.primary}
                                            />
                                        </LinearGradient>
                                        <Text style={[styles.templateTitle, format === item.id && styles.templateTitleActive]}>
                                            {item.label}
                                        </Text>
                                        <Text style={[styles.templateDesc, format === item.id && styles.templateDescActive]} numberOfLines={2}>
                                            {item.desc}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                {/* More Button */}
                                <TouchableOpacity
                                    style={[styles.templateCard, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceLight }]}
                                    onPress={() => setShowTemplatesModal(true)}
                                    activeOpacity={0.9}
                                >
                                    <View style={{
                                        width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background,
                                        justifyContent: 'center', alignItems: 'center', marginBottom: 8
                                    }}>
                                        <Ionicons name="apps" size={24} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.templateTitle, { color: colors.primary }]}>More...</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    )}
                </View>

                {/* Templates Selection Modal */}
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
                        <View style={[styles.modalContent, { height: '80%' }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Template</Text>
                                <TouchableOpacity onPress={() => setShowTemplatesModal(false)}>
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
                                    placeholder="Search templates..."
                                    placeholderTextColor={colors.textMuted}
                                    value={templateSearch}
                                    onChangeText={setTemplateSearch}
                                    autoCorrect={false}
                                />
                                {templateSearch.length > 0 && (
                                    <TouchableOpacity onPress={() => setTemplateSearch('')}>
                                        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                    {FORMATS
                                        .filter(item =>
                                            item.label.toLowerCase().includes(templateSearch.toLowerCase()) ||
                                            item.desc.toLowerCase().includes(templateSearch.toLowerCase())
                                        )
                                        .map((item) => (
                                            <TouchableOpacity
                                                key={item.id}
                                                style={[
                                                    styles.templateCard,
                                                    { width: '48%', marginBottom: 16, marginRight: 0 },
                                                    format === item.id && styles.templateCardActive
                                                ]}
                                                onPress={() => {
                                                    setFormat(item.id);
                                                    setShowTemplatesModal(false);
                                                    setTemplateSearch('');
                                                }}
                                                activeOpacity={0.9}
                                            >
                                                <LinearGradient
                                                    colors={format === item.id ? colors.gradientPrimary : [colors.surface, colors.surface]}
                                                    style={styles.templateIconContainer}
                                                >
                                                    <Ionicons
                                                        name={item.icon}
                                                        size={24}
                                                        color={format === item.id ? '#fff' : colors.primary}
                                                    />
                                                </LinearGradient>
                                                <Text style={[styles.templateTitle, format === item.id && styles.templateTitleActive]}>
                                                    {item.label}
                                                </Text>
                                                <Text style={[styles.templateDesc, format === item.id && styles.templateDescActive]} numberOfLines={2}>
                                                    {item.desc}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                </View>
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Event Selection Modal */}
                <Modal
                    visible={showEventModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowEventModal(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowEventModal(false)}
                    >
                        <View style={[styles.modalContent, { maxHeight: '70%' }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Meeting</Text>
                                <TouchableOpacity onPress={() => setShowEventModal(false)}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView contentContainerStyle={{ padding: 20 }}>
                                {events?.map((event) => (
                                    <TouchableOpacity
                                        key={event.id}
                                        style={{
                                            padding: 16,
                                            borderBottomWidth: 1,
                                            borderBottomColor: colors.border,
                                            backgroundColor: colors.surface,
                                            marginBottom: 8,
                                            borderRadius: 12
                                        }}
                                        onPress={() => handleEventSelect(event)}
                                    >
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 }}>{event.title}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                            <Ionicons name="time-outline" size={14} color={colors.primary} />
                                            <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                                                {new Date(event.startDate).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                        {event.location && (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                                                <Text style={{ color: colors.textMuted, fontSize: 13 }} numberOfLines={1}>{event.location}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Visuals Modal */}
                <Modal
                    visible={showVisualsModal}
                    animationType="slide"
                    onRequestClose={() => setShowVisualsModal(false)}
                >
                    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 50 }}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Visual Summary</Text>
                            <TouchableOpacity onPress={() => setShowVisualsModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <WebView
                            originWhitelist={['*']}
                            source={{
                                html: `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                                <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
                                <script>
                                    mermaid.initialize({ startOnLoad: true, theme: 'default' });
                                </script>
                                <style>
                                    body { font-family: sans-serif; padding: 20px; background: ${colors.background === '#1A1A1A' ? '#1A1A1A' : '#ffffff'}; }
                                    .mermaid { display: flex; justify-content: center; }
                                </style>
                            </head>
                            <body>
                                <div class="mermaid">
                                    ${mermaidCode}
                                </div>
                            </body>
                            </html>
                        `}}
                            style={{ flex: 1, backgroundColor: 'transparent' }}
                        />
                    </View>
                </Modal>

                {/* Detail Level (Note Length) - Segmented Control */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: showLength ? 10 : 0 }}
                        onPress={() => setShowLength(!showLength)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.sectionTitle}>Detail Level</Text>
                            <Ionicons name={showLength ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
                        </View>
                        {!showLength && (
                            <Text style={{ fontSize: 13, color: colors.primary }}>{NOTE_LENGTHS.find(l => l.id === noteLength)?.label}</Text>
                        )}
                    </TouchableOpacity>

                    {showLength && (
                        <View style={styles.segmentedControl}>
                            {NOTE_LENGTHS.map((length) => (
                                <TouchableOpacity
                                    key={length.id}
                                    style={[styles.segmentBtn, noteLength === length.id && styles.segmentBtnActive]}
                                    onPress={() => setNoteLength(length.id)}
                                >
                                    <Text style={[styles.segmentText, noteLength === length.id && styles.segmentTextActive]}>
                                        {length.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Advanced Settings (Tone & Language) */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.advancedHeader}
                        onPress={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    >
                        <Text style={styles.sectionTitle}>Advanced Settings</Text>
                        <Ionicons
                            name={showAdvancedSettings ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={colors.textMuted}
                        />
                    </TouchableOpacity>

                    {showAdvancedSettings && (
                        <View style={styles.advancedContent}>
                            {/* Tone */}
                            <Text style={styles.subLabel}>Tone</Text>
                            <View style={styles.wrapRow}>
                                {TONES.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[styles.optionBtn, tone === item.id && styles.optionBtnActive]}
                                        onPress={() => setTone(item.id)}
                                    >
                                        <Text style={[styles.optionText, tone === item.id && styles.optionTextActive]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Language */}
                            <Text style={[styles.subLabel, { marginTop: 16 }]}>Language</Text>
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
                    )}
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

                            {/* Action Buttons - Row 1 */}
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

                            {/* Action Buttons - Row 2 */}
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={styles.actionBtn} onPress={handleVisualize} disabled={isVisualizing}>
                                    {isVisualizing ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <Ionicons name="git-network-outline" size={18} color={colors.primary} />
                                    )}
                                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>Visualize</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn} onPress={exportAsText}>
                                    <Ionicons name="document-text-outline" size={18} color={colors.secondary} />
                                    <Text style={[styles.actionBtnText, { color: colors.secondary }]}>Export .txt</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn} onPress={exportAsMarkdown}>
                                    <Ionicons name="logo-markdown" size={18} color={colors.accent} />
                                    <Text style={[styles.actionBtnText, { color: colors.accent }]}>Export .md</Text>
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

                {/* Banner Ad */}
                {areAdsEnabled && (
                    <View style={{ alignItems: 'center', marginTop: 20 }}>
                        <BannerAd
                            unitId={adUnitIDs.banner}
                            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                            requestOptions={{
                                requestNonPersonalizedAdsOnly: true,
                            }}
                        />
                    </View>
                )}
                {/* Recent History Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Notes</Text>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            {notes.length > 0 && (
                                <TouchableOpacity onPress={() => navigation.navigate('History')}>
                                    <Text style={[styles.clearAllText, { color: colors.primary }]}>See All</Text>
                                </TouchableOpacity>
                            )}
                            {notes.length > 0 && (
                                <TouchableOpacity onPress={handleClearAllHistory}>
                                    <Text style={styles.clearAllText}>Clear All</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {notes.length === 0 ? (
                        <Text style={styles.emptyHistoryText}>No recent notes</Text>
                    ) : (
                        notes.slice(0, 5).map((note) => (
                            <View key={note.id} style={styles.historyCard}>
                                <View style={styles.historyInfo}>
                                    <Text style={styles.historyDate}>
                                        {new Date(note.createdAt).toLocaleDateString()}
                                    </Text>
                                    <Text style={styles.historyPreview} numberOfLines={2}>
                                        {note.content}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={() => handleDeleteNote(note.id)}
                                >
                                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>

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
    tabScroll: {
        marginHorizontal: -16,
        marginBottom: 16,
    },
    tabScrollContainer: {
        paddingHorizontal: 16,
        gap: 8,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        gap: 6,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    tabActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
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
        justifyContent: 'flex-start',
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    textInput: {
        color: colors.text,
        fontSize: 16,
        minHeight: 110,
        textAlignVertical: 'top',
        lineHeight: 26,
        fontFamily: 'Inter_400Regular',
    },
    charCounter: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    charCountText: {
        fontSize: 12,
        color: colors.textMuted,
        fontFamily: 'Inter_400Regular',
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
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 14,
    },
    locationIconLarge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationInfo: {
        flex: 1,
    },
    locationLabel: {
        color: colors.textMuted,
        fontSize: 12,
        marginBottom: 4,
    },
    locationName: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '700',
    },
    locationRefresh: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
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
        backgroundColor: `${colors.secondary}15`,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: `${colors.secondary}30`,
    },
    suggestionText: {
        color: colors.secondary,
        fontSize: 13,
        fontWeight: '500',
    },
    // History Section Styles
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
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
    historyPreview: {
        color: colors.text,
        fontSize: 13,
    },
    deleteBtn: {
        padding: 8,
    },
    // NEW STYLES for Document Generator UI
    templateCard: {
        width: 140,
        height: 160,
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 12,
        marginVertical: 4, // Added margin to prevent clipping
        marginRight: 8,
        borderWidth: 1.5, // Increased base border width
        borderColor: colors.border,
        justifyContent: 'space-between',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    templateCardActive: {
        borderColor: colors.primary,
        borderWidth: 2, // Thicker border
        // backgroundColor: removed to fix Android shadow artifacts
        transform: [{ scale: 1.02 }],
    },
    templateIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    templateTitle: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    templateTitleActive: {
        color: colors.primary,
    },
    templateDesc: {
        color: colors.textSecondary,
        fontSize: 12,
        lineHeight: 16,
    },
    templateDescActive: {
        color: colors.text,
    },
    // Segmented Control
    segmentedControl: {
        flexDirection: 'row',
        width: '100%', // Ensure it fits within parent padding
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentBtnActive: {
        backgroundColor: colors.primary,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    segmentText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    segmentTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    // Advanced Settings
    advancedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginBottom: 12,
    },
    advancedContent: {
        paddingTop: 8,
    },
    subLabel: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        marginLeft: 4,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    modalTitle: {
        color: colors.text,
        fontSize: 20,
        fontWeight: '700',
    },
});
