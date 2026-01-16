import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Animated,
    Image,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Smart AI Notes',
        description: 'Transform text, images, PDFs, voice recordings, websites, or YouTube videos into beautifully organized notes in seconds.',
        icon: 'document-text',
    },
    {
        id: '2',
        title: 'Instant Replies',
        description: 'Generate perfectly crafted replies for emails and messages. Choose your tone — professional, casual, or creative.',
        icon: 'chatbubbles',
    },
    {
        id: '3',
        title: 'Your Data, Your Control',
        description: 'Your notes are stored locally on your device. Use your unique Recovery Code to access credits on any new device.',
        icon: 'shield-checkmark',
    },
];

export default function WalkthroughScreen({ navigation, route }) {
    const { colors, isDark } = useTheme();
    const { completeOnboarding } = useUser();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef(null);

    // Check if opened from Settings
    const isFromSettings = route.params?.fromSettings;

    const ViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
        } else {
            // Finish onboarding
            if (isFromSettings) {
                navigation.goBack();
            } else {
                if (completeOnboarding) {
                    await completeOnboarding();
                }
                // Navigate to MainTabs with Credits tab
                navigation.replace('MainTabs', { screen: 'Credits' });
            }
        }
    };

    const renderItem = ({ item }) => {
        return (
            <View style={[styles.slide, { width }]}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? '#333' : '#eee' }]}>
                    <Ionicons name={item.icon} size={80} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text>
            </View>
        );
    };

    const Paginator = ({ data, scrollX }) => {
        return (
            <View style={styles.paginatorContainer}>
                {data.map((_, i) => {
                    const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [10, 20, 10],
                        extrapolate: 'clamp',
                    });
                    const opacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            key={i.toString()}
                            style={[
                                styles.dot,
                                { width: dotWidth, opacity, backgroundColor: colors.primary },
                            ]}
                        />
                    );
                })}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={{ flex: 3 }}>
                <FlatList
                    data={SLIDES}
                    renderItem={renderItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                        useNativeDriver: false,
                    })}
                    scrollEventThrottle={32}
                    onViewableItemsChanged={ViewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    ref={slidesRef}
                />
            </View>

            <Paginator data={SLIDES} scrollX={scrollX} />

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>
                        {currentIndex === SLIDES.length - 1 ? (isFromSettings ? 'Close' : 'Get Started') : 'Next'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        width: 150,
        height: 150,
        borderRadius: 75,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    paginatorContainer: {
        flexDirection: 'row',
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        height: 10,
        borderRadius: 5,
        marginHorizontal: 8,
    },
    footer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        width: '100%',
        paddingBottom: 40,
    },
    button: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
