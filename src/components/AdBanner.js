// AdBanner Component - Shows banner ad at bottom of screen
// Automatically hides for Pro subscribers

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { BannerAd, BannerAdSize, adUnitIDs, areAdsEnabled } from '../services/AdService';

/**
 * AdBanner - Displays a banner ad at the bottom of the screen
 * Automatically hides for Pro subscribers
 * @param {object} style - Additional styles to apply
 */
export default function AdBanner({ style }) {
    const insets = useSafeAreaInsets();
    const { getCreditData } = useUser();
    const credits = getCreditData();

    // Don't show ads for Pro subscribers
    if (credits.hasProSubscription) {
        return null;
    }

    // Don't show if ads are disabled (e.g., in Expo Go)
    if (!areAdsEnabled) {
        return null;
    }

    // Don't show if no ad unit ID
    if (!adUnitIDs.banner) {
        return null;
    }

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }, style]}>
            <BannerAd
                unitId={adUnitIDs.banner}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onAdLoaded={() => {
                    console.log('✅ Banner ad loaded');
                }}
                onAdFailedToLoad={(error) => {
                    console.error('❌ Banner ad failed to load:', error);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
});
