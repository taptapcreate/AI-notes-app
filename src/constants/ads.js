import { Platform } from 'react-native';

// Google Test IDs (for development/testing only)
// See: https://developers.google.com/admob/android/test-ads#sample_ad_units
// See: https://developers.google.com/admob/ios/test-ads#demo_ad_units
const TestIds = {
    ios: {
        appId: 'ca-app-pub-3940256099942544~1458002511',
        banner: 'ca-app-pub-3940256099942544/2934735716',
        interstitial: 'ca-app-pub-3940256099942544/4411468910',
        rewarded: 'ca-app-pub-3940256099942544/1712485313',
        appOpen: 'ca-app-pub-3940256099942544/5662855259',
    },
    android: {
        appId: 'ca-app-pub-3940256099942544~3347511713',
        banner: 'ca-app-pub-3940256099942544/6300978111',
        interstitial: 'ca-app-pub-3940256099942544/1033173712',
        rewarded: 'ca-app-pub-3940256099942544/5224354917',
        appOpen: 'ca-app-pub-3940256099942544/9257395921',
    }
};

// ⚠️ PRODUCTION AD UNIT IDS
// Replace these with your actual AdMob IDs from https://apps.admob.google.com/
const productionIds = {
    ios: {
        appId: 'ca-app-pub-3940256099942544~1458002511', // Replace with production App ID
        banner: 'ca-app-pub-3940256099942544/2934735716', // Replace with production Banner ID
        interstitial: 'ca-app-pub-3940256099942544/4411468910', // Replace with production Interstitial ID
        rewarded: 'ca-app-pub-3940256099942544/1712485313', // Replace with production Rewarded ID
        appOpen: 'ca-app-pub-3940256099942544/5662855259',
    },
    android: {
        appId: 'ca-app-pub-3940256099942544~3347511713', // Replace with production App ID
        banner: 'ca-app-pub-3940256099942544/6300978111', // Replace with production Banner ID
        interstitial: 'ca-app-pub-3940256099942544/1033173712', // Replace with production Interstitial ID
        rewarded: 'ca-app-pub-3940256099942544/5224354917', // Replace with production Rewarded ID
        appOpen: 'ca-app-pub-3940256099942544/9257395921',
    }
};

// Use test IDs in development, production IDs in release
// For now, using TestIds by default to ensure it works during development
export const adUnitIDs = Platform.select({
    ios: __DEV__ ? TestIds.ios : productionIds.ios,
    android: __DEV__ ? TestIds.android : productionIds.android,
    default: TestIds.android,
});

export const APP_ID = Platform.select({
    ios: __DEV__ ? TestIds.ios.appId : productionIds.ios.appId,
    android: __DEV__ ? TestIds.android.appId : productionIds.android.appId,
});
