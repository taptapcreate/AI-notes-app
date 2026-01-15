import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function IntroScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Animation sequence
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start();

        // Navigate after delay
        const timer = setTimeout(() => {
            navigation.replace('Walkthrough');
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    // Placeholder logo (using icon text as fallback)
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={isDark ? ['#1e1e2e', '#000000'] : ['#ffffff', '#f0f0f0']}
                style={StyleSheet.absoluteFill}
            />

            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                {/* 
                   Ideally use an Image component here for the logo.
                   For now, a styled text representation.
                */}
                <View style={styles.logoContainer}>
                    <Text style={[styles.logoText, { color: colors.primary }]}>AI Notes</Text>
                </View>

                <View style={styles.brandingContainer}>
                    <Text style={styles.byText}>by</Text>
                    <Text style={[styles.brandText, { color: isDark ? '#888' : '#666' }]}>Taptapcreate</Text>
                </View>
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
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        marginBottom: 200, // Push logo up a bit
        alignItems: 'center',
    },
    logoText: {
        fontSize: 48,
        fontWeight: '800',
        letterSpacing: 1,
    },
    brandingContainer: {
        position: 'absolute',
        bottom: -250, // Position towards bottom relative to center
        alignItems: 'center',
    },
    byText: {
        fontSize: 14,
        color: '#888',
        marginBottom: 4,
    },
    brandText: {
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});
