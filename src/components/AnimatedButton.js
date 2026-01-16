import React, { useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { lightTap } from '../utils/haptics';

/**
 * AnimatedButton - A button with press animation and haptic feedback
 * 
 * Props:
 * - onPress: Function to call on press
 * - style: Additional styles for the button
 * - children: Button content
 * - disabled: Whether button is disabled
 * - haptic: Whether to trigger haptic feedback (default: true)
 * - scaleValue: How much to scale down on press (default: 0.96)
 */
export default function AnimatedButton({
    onPress,
    style,
    children,
    disabled = false,
    haptic = true,
    scaleValue = 0.96,
    activeOpacity = 0.9,
    ...props
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: scaleValue,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 8,
        }).start();
    };

    const handlePress = () => {
        if (haptic) {
            lightTap();
        }
        if (onPress) {
            onPress();
        }
    };

    return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={activeOpacity}
                disabled={disabled}
                style={style}
                {...props}
            >
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
}
