// AdService - Handles all ad types for AI Notes
import { Platform } from 'react-native';
import {
    AdEventType,
    RewardedAd,
    RewardedAdEventType,
    InterstitialAd,
    TestIds,
} from 'react-native-google-mobile-ads';

// ==========================================
// AD UNIT IDS
// ==========================================

// Set to true to use test ads during development
const USE_TEST_ADS = __DEV__;

const AD_UNIT_IDS = {
    ios: {
        appOpen: 'ca-app-pub-4715041020157000/9063098571',
        banner: 'ca-app-pub-4715041020157000/1376180246',
        interstitial: 'ca-app-pub-4715041020157000/1352113604',
        native: 'ca-app-pub-4715041020157000/7116603845',
        rewarded: 'ca-app-pub-4715041020157000/7750016901',
    },
    android: {
        // TODO: Add Android ad unit IDs when available
        appOpen: '',
        banner: '',
        interstitial: '',
        native: '',
        rewarded: '',
    },
};

// Get the correct ad unit ID based on platform and test mode
const getAdUnitId = (type) => {
    if (USE_TEST_ADS) {
        switch (type) {
            case 'rewarded':
                return TestIds.REWARDED;
            case 'interstitial':
                return TestIds.INTERSTITIAL;
            case 'banner':
                return TestIds.BANNER;
            default:
                return TestIds.BANNER;
        }
    }

    const platformIds = Platform.OS === 'ios' ? AD_UNIT_IDS.ios : AD_UNIT_IDS.android;
    return platformIds[type] || '';
};

// ==========================================
// REWARDED AD
// ==========================================

let rewardedAd = null;
let rewardedAdLoaded = false;
let rewardedAdCallbacks = {
    onRewarded: null,
    onClosed: null,
    onError: null,
};

/**
 * Load a rewarded ad
 */
export const loadRewardedAd = () => {
    const adUnitId = getAdUnitId('rewarded');

    if (!adUnitId) {
        console.warn('No rewarded ad unit ID available for this platform');
        return;
    }

    console.log('📺 Loading rewarded ad...');

    try {
        rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
            requestNonPersonalizedAdsOnly: true,
        });
    } catch (error) {
        console.error('Failed to create rewarded ad:', error);
        return;
    }

    // Handle ad loaded
    const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
        console.log('✅ Rewarded ad loaded');
        rewardedAdLoaded = true;
    });

    // Handle reward earned
    const unsubscribeEarned = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
        console.log('🎁 Reward earned:', reward);
        if (rewardedAdCallbacks.onRewarded) {
            rewardedAdCallbacks.onRewarded(reward);
        }
    });

    // Handle ad closed
    const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('📺 Rewarded ad closed');
        rewardedAdLoaded = false;
        if (rewardedAdCallbacks.onClosed) {
            rewardedAdCallbacks.onClosed();
        }
        // Preload next ad
        loadRewardedAd();
    });

    // Handle errors
    const unsubscribeError = rewardedAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error('❌ Rewarded ad error:', error);
        rewardedAdLoaded = false;
        if (rewardedAdCallbacks.onError) {
            rewardedAdCallbacks.onError(error);
        }
    });

    // Load the ad
    rewardedAd.load();

    return () => {
        unsubscribeLoaded();
        unsubscribeEarned();
        unsubscribeClosed();
        unsubscribeError();
    };
};

/**
 * Show rewarded ad
 * @param {Object} callbacks - { onRewarded, onClosed, onError }
 * @returns {Promise<boolean>} - true if ad shown, false if not available
 */
export const showRewardedAd = async (callbacks = {}) => {
    rewardedAdCallbacks = callbacks;

    if (!rewardedAdLoaded || !rewardedAd) {
        console.warn('Rewarded ad not loaded');
        if (callbacks.onError) {
            callbacks.onError(new Error('Ad not loaded'));
        }
        return false;
    }

    try {
        await rewardedAd.show();
        return true;
    } catch (error) {
        console.error('Error showing rewarded ad:', error);
        if (callbacks.onError) {
            callbacks.onError(error);
        }
        return false;
    }
};

/**
 * Check if rewarded ad is ready
 */
export const isRewardedAdReady = () => rewardedAdLoaded;

// ==========================================
// INTERSTITIAL AD
// ==========================================

let interstitialAd = null;
let interstitialAdLoaded = false;
let interstitialCallbacks = {
    onClosed: null,
    onError: null,
};

/**
 * Load an interstitial ad
 */
export const loadInterstitialAd = () => {
    const adUnitId = getAdUnitId('interstitial');

    if (!adUnitId) {
        console.warn('No interstitial ad unit ID available for this platform');
        return;
    }

    console.log('📺 Loading interstitial ad...');

    try {
        interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
            requestNonPersonalizedAdsOnly: true,
        });
    } catch (error) {
        console.error('Failed to create interstitial ad:', error);
        return;
    }

    // Handle ad loaded
    const unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('✅ Interstitial ad loaded');
        interstitialAdLoaded = true;
    });

    // Handle ad closed
    const unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('📺 Interstitial ad closed');
        interstitialAdLoaded = false;
        if (interstitialCallbacks.onClosed) {
            interstitialCallbacks.onClosed();
        }
        // Preload next ad
        loadInterstitialAd();
    });

    // Handle errors
    const unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error('❌ Interstitial ad error:', error);
        interstitialAdLoaded = false;
        if (interstitialCallbacks.onError) {
            interstitialCallbacks.onError(error);
        }
    });

    // Load the ad
    interstitialAd.load();

    return () => {
        unsubscribeLoaded();
        unsubscribeClosed();
        unsubscribeError();
    };
};

/**
 * Show interstitial ad
 * NOTE: Not currently used - will be implemented when timing is decided
 * @param {Object} callbacks - { onClosed, onError }
 * @returns {Promise<boolean>} - true if ad shown, false if not available
 */
export const showInterstitialAd = async (callbacks = {}) => {
    interstitialCallbacks = callbacks;

    if (!interstitialAdLoaded || !interstitialAd) {
        console.warn('Interstitial ad not loaded');
        if (callbacks.onError) {
            callbacks.onError(new Error('Ad not loaded'));
        }
        return false;
    }

    try {
        await interstitialAd.show();
        return true;
    } catch (error) {
        console.error('Error showing interstitial ad:', error);
        if (callbacks.onError) {
            callbacks.onError(error);
        }
        return false;
    }
};

/**
 * Check if interstitial ad is ready
 */
export const isInterstitialAdReady = () => interstitialAdLoaded;

// ==========================================
// INITIALIZATION
// ==========================================

/**
 * Initialize all ads (call on app start)
 */
export const initializeAds = () => {
    try {
        console.log('🚀 Initializing ads...');
        console.log('📱 Platform:', Platform.OS);
        console.log('🧪 Using test ads:', USE_TEST_ADS);

        // Preload rewarded ad (for daily check-in)
        loadRewardedAd();

        // Preload interstitial ad (ready but not shown yet)
        loadInterstitialAd();

        console.log('✅ Ads initialized');
    } catch (error) {
        console.error('❌ Failed to initialize ads:', error);
    }
};

export default {
    initializeAds,
    loadRewardedAd,
    showRewardedAd,
    isRewardedAdReady,
    loadInterstitialAd,
    showInterstitialAd,
    isInterstitialAdReady,
};
