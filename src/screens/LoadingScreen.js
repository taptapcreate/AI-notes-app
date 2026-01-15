import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Animated } from 'react-native';

const LoadingScreen = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Image
                    source={require('../../assets/icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
                    <ActivityIndicator size="large" color="#60A5FA" />
                    <Text style={styles.loadingText}>Initializing...</Text>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A', // App Theme Background
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 40,
    },
    loadingContainer: {
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: '#94A3B8', // Slate-400
        fontSize: 14,
        fontWeight: '500',
        marginTop: 10,
        letterSpacing: 0.5,
    }
});

export default LoadingScreen;
