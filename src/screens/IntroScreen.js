import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function IntroScreen({ navigation }) {
    const { colors, isDark } = useTheme();

    // Animation values
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const iconRotate = useRef(new Animated.Value(0)).current;
    const pulseScale = useRef(new Animated.Value(1)).current;
    const titleSlide = useRef(new Animated.Value(50)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const brandOpacity = useRef(new Animated.Value(0)).current;
    const brandSlide = useRef(new Animated.Value(30)).current;
    const glowOpacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        // Complex staggered animation sequence
        const animationSequence = Animated.sequence([
            // Phase 1: Logo burst in with bounce
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
            // Phase 2: Title slides in
            Animated.delay(100),
            Animated.parallel([
                Animated.spring(titleSlide, {
                    toValue: 0,
                    tension: 80,
                    friction: 10,
                    useNativeDriver: true,
                }),
                Animated.timing(titleOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]),
            // Phase 3: Brand appears
            Animated.delay(200),
            Animated.parallel([
                Animated.timing(brandOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(brandSlide, {
                    toValue: 0,
                    tension: 60,
                    friction: 10,
                    useNativeDriver: true,
                }),
            ]),
        ]);

        animationSequence.start();

        // Continuous pulse animation for glow
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowOpacity, {
                    toValue: 0.8,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(glowOpacity, {
                    toValue: 0.3,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Subtle icon rotation
        Animated.loop(
            Animated.timing(iconRotate, {
                toValue: 1,
                duration: 8000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Navigate after animations
        const timer = setTimeout(() => {
            navigation.replace('Walkthrough');
        }, 2800);

        return () => clearTimeout(timer);
    }, []);

    const rotateInterpolate = iconRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={isDark ? ['#1a1a2e', '#16213e', '#0f0f1a'] : ['#f8f9ff', '#e8ecff', '#f0f4ff']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Animated glow background */}
            <Animated.View style={[styles.glowContainer, { opacity: glowOpacity }]}>
                <LinearGradient
                    colors={[`${colors.primary}40`, `${colors.secondary}20`, 'transparent']}
                    style={styles.glowGradient}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
            </Animated.View>

            <View style={styles.content}>
                {/* Icon with rotation */}
                <Animated.View
                    style={[
                        styles.iconContainer,
                        {
                            opacity: logoOpacity,
                            transform: [
                                { scale: logoScale },
                                { rotate: rotateInterpolate },
                            ],
                        },
                    ]}
                >
                    <Image
                        source={require('../../assets/adaptive-icon.png')}
                        style={styles.logoImage}
                    />
                </Animated.View>

                {/* Logo Text */}
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: titleOpacity,
                            transform: [{ translateY: titleSlide }],
                        },
                    ]}
                >
                    <Text style={[styles.logoText, { color: colors.text }]}>AI Notes</Text>
                    <Text style={[styles.tagline, { color: colors.textMuted }]}>
                        Write & Reply Smarter
                    </Text>
                </Animated.View>
            </View>

            {/* Branding at bottom */}
            <Animated.View
                style={[
                    styles.brandingContainer,
                    {
                        opacity: brandOpacity,
                        transform: [{ translateY: brandSlide }],
                    },
                ]}
            >
                <Text style={[styles.byText, { color: colors.textMuted }]}>crafted by</Text>
                <Text style={[styles.brandText, { color: colors.text }]}>TapTapCreate</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glowContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.5,
    },
    glowGradient: {
        flex: 1,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginBottom: 24,
    },
    logoImage: {
        width: 120,
        height: 120,
        borderRadius: 24,
    },
    logoContainer: {
        alignItems: 'center',
    },
    logoText: {
        fontSize: 42,
        fontWeight: '800',
        letterSpacing: -1,
        fontFamily: 'Inter_700Bold',
    },
    tagline: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 8,
        letterSpacing: 0.5,
    },
    brandingContainer: {
        position: 'absolute',
        bottom: 60,
        alignItems: 'center',
    },
    byText: {
        fontSize: 12,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    brandText: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 1,
    },
});
