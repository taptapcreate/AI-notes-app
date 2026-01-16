import React, { useRef, useEffect } from 'react';
import { Animated, View } from 'react-native';

/**
 * Custom hook for stagger animations
 * @param {number} itemCount - Number of items to animate
 * @param {number} delay - Delay between each item (ms)
 * @param {number} duration - Animation duration (ms)
 */
export const useStaggerAnimation = (itemCount = 5, delay = 80, duration = 350) => {
    const fadeAnims = useRef(
        Array(itemCount).fill(null).map(() => new Animated.Value(0))
    ).current;

    const slideAnims = useRef(
        Array(itemCount).fill(null).map(() => new Animated.Value(25))
    ).current;

    useEffect(() => {
        // Reset values
        fadeAnims.forEach(anim => anim.setValue(0));
        slideAnims.forEach(anim => anim.setValue(25));

        // Run stagger animation
        const animations = fadeAnims.map((fadeAnim, index) =>
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: duration,
                    delay: index * delay,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnims[index], {
                    toValue: 0,
                    duration: duration,
                    delay: index * delay,
                    useNativeDriver: true,
                }),
            ])
        );

        Animated.stagger(delay, animations).start();
    }, []);

    return { fadeAnims, slideAnims };
};

/**
 * Animated section component for stagger effect
 */
export const AnimatedSection = ({ fadeAnim, slideAnim, children, style }) => (
    <Animated.View
        style={[
            style,
            {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            }
        ]}
    >
        {children}
    </Animated.View>
);

export default useStaggerAnimation;
