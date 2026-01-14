import Constants, { ExecutionEnvironment } from 'expo-constants';
import { adUnitIDs } from '../constants/ads';

// Determine if we are running in Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Ads are only enabled in native builds, not in Expo Go (standard practice for development)
export const areAdsEnabled = !isExpoGo;

let mobileAds = {
    initialize: () => Promise.resolve(),
};

let AppOpenAd = {
    createForAdRequest: () => ({
        load: () => { },
        show: () => { },
        addAdEventListener: () => () => { },
    }),
};

let InterstitialAd = {
    createForAdRequest: () => ({
        load: () => { },
        show: () => { },
        addAdEventListener: () => () => { },
    }),
};

let RewardedAd = {
    createForAdRequest: () => ({
        load: () => { },
        show: () => { },
        addAdEventListener: () => () => { },
    }),
};

let BannerAd = () => null;
let BannerAdSize = {
    ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
    BANNER: 'BANNER',
    LARGE_BANNER: 'LARGE_BANNER',
    MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
    FULL_BANNER: 'FULL_BANNER',
    LEADERBOARD: 'LEADERBOARD',
    ADAPTIVE_BANNER: 'ADAPTIVE_BANNER',
};

let AdEventType = {
    LOADED: 'loaded',
    CLOSED: 'closed',
    ERROR: 'error',
    OPENED: 'opened',
    CLICKED: 'clicked',
    LEFT_APPLICATION: 'left_application',
};

let RewardedAdEventType = {
    LOADED: 'loaded',
    EARNED_REWARD: 'earned_reward',
    CLOSED: 'closed',
    ERROR: 'error',
};

let TestIds = {
    BANNER: 'ca-app-pub-3940256099942544/6300978111',
    INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
    REWARDED: 'ca-app-pub-3940256099942544/5224354917',
};

// Only import the real library if we are NOT in Expo Go
if (areAdsEnabled) {
    try {
        const RNGoogleMobileAds = require('react-native-google-mobile-ads');
        const adsFactory = RNGoogleMobileAds.default || RNGoogleMobileAds;

        if (typeof adsFactory === 'function') {
            mobileAds = adsFactory();
        } else {
            mobileAds = RNGoogleMobileAds.mobileAds || RNGoogleMobileAds;
        }

        AppOpenAd = RNGoogleMobileAds.AppOpenAd;
        InterstitialAd = RNGoogleMobileAds.InterstitialAd;
        RewardedAd = RNGoogleMobileAds.RewardedAd;
        BannerAd = RNGoogleMobileAds.BannerAd;
        BannerAdSize = RNGoogleMobileAds.BannerAdSize;
        TestIds = RNGoogleMobileAds.TestIds;
        AdEventType = RNGoogleMobileAds.AdEventType;
        RewardedAdEventType = RNGoogleMobileAds.RewardedAdEventType;

        console.log('AdService: Successfully initialized native ads module');
    } catch (error) {
        console.warn('Failed to load react-native-google-mobile-ads, falling back to mocks', error);
    }
}

/**
 * Initialize AdMob
 */
export const initAds = async () => {
    if (areAdsEnabled) {
        try {
            await mobileAds.initialize();
            console.log('✅ AdMob Initialized');
        } catch (error) {
            console.error('❌ AdMob Init Error:', error);
        }
    }
};

export {
    mobileAds,
    AppOpenAd,
    InterstitialAd,
    RewardedAd,
    BannerAd,
    BannerAdSize,
    TestIds,
    AdEventType,
    RewardedAdEventType,
    adUnitIDs
};

export default {
    initAds,
    areAdsEnabled,
    mobileAds,
    AppOpenAd,
    InterstitialAd,
    RewardedAd,
    BannerAd,
    BannerAdSize,
    TestIds,
    AdEventType,
    RewardedAdEventType,
    adUnitIDs
};
