// Advanced Subscription Manager - Handles all edge cases for offline/online RevenueCat subscriptions
// Adapted from todo-app for AI Notes (weekly/monthly subscriptions)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState, Linking } from 'react-native';
import Purchases from 'react-native-purchases';

// ==========================================
// CONSTANTS & CONFIGURATION
// ==========================================

const CACHE_KEYS = {
    CUSTOMER_INFO: '@subscription_customer_info',
    MIN_ACCESS_UNTIL: '@subscription_min_access_until',
    LAST_ONLINE_CHECK: '@subscription_last_online_check',
    ELAPSED_REALTIME_BASELINE: '@subscription_elapsed_baseline',
    CLOCK_CHECK_TIMESTAMP: '@subscription_clock_check',
};

// Entitlement identifier in RevenueCat
const ENTITLEMENT_ID = 'AI Notes - Write and Reply Pro';

// Grace period for offline renewal verification (days)
const OFFLINE_GRACE_PERIOD_DAYS = 7;
const OFFLINE_GRACE_PERIOD_MS = OFFLINE_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

// Maximum allowed backward time jump before requiring verification (minutes)
const MAX_BACKWARD_JUMP_MINUTES = 30;
const MAX_BACKWARD_JUMP_MS = MAX_BACKWARD_JUMP_MINUTES * 60 * 1000;

// Long-term offline threshold (days since last successful online check)
const LONG_TERM_OFFLINE_DAYS = 7;
const LONG_TERM_OFFLINE_MS = LONG_TERM_OFFLINE_DAYS * 24 * 60 * 60 * 1000;

// ==========================================
// SUBSCRIPTION STATUS ENUM
// ==========================================

export const SUBSCRIPTION_STATE = {
    // Active states (Pro access granted)
    ACTIVE: 'active',
    ACTIVE_OFFLINE_GRACE: 'active_offline_grace',

    // Locked states (Pro access denied)
    EXPIRED_CANCELLED: 'expired_cancelled',
    EXPIRED_GRACE_ELAPSED: 'expired_grace_elapsed',
    EXPIRED_LONG_OFFLINE: 'expired_long_offline',
    CLOCK_TAMPERING_SUSPECTED: 'clock_tampering_suspected',

    // Other states
    NO_SUBSCRIPTION: 'no_subscription',
    UNKNOWN: 'unknown',
};

// ==========================================
// MAIN SUBSCRIPTION MANAGER CLASS
// ==========================================

class AdvancedSubscriptionManager {
    constructor() {
        this.isOnline = true;
        this.appState = AppState.currentState;
        this.listeners = [];

        // Set up app state listener for auto-refresh
        this.appStateSubscription = AppState.addEventListener('change', this._handleAppStateChange.bind(this));
    }

    // ==========================================
    // ACTIVE PERIOD CHECK
    // ==========================================

    _isInActivePeriod(expirationDate) {
        const now = Date.now();
        const expiry = new Date(expirationDate).getTime();
        return now < expiry;
    }

    // ==========================================
    // CANCELLATION CHECK
    // ==========================================

    _isCancelledAndExpired(willRenew, expirationDate) {
        if (willRenew === true) return false;

        const now = Date.now();
        const expiry = new Date(expirationDate).getTime();
        return now >= expiry;
    }

    // ==========================================
    // GRACE PERIOD CHECK
    // ==========================================

    _isInOfflineGracePeriod(willRenew, expirationDate) {
        if (willRenew !== true) return false;

        const now = Date.now();
        const expiry = new Date(expirationDate).getTime();

        if (now < expiry) return false;

        const daysSinceExpiry = (now - expiry) / (24 * 60 * 60 * 1000);
        return daysSinceExpiry <= OFFLINE_GRACE_PERIOD_DAYS;
    }

    // ==========================================
    // OFFLINE RENEWAL HANDLING
    // ==========================================

    async handleOfflineRenewal(customerInfo) {
        const { willRenew, expirationDate } = this._extractSubscriptionData(customerInfo);

        const now = Date.now();
        const expiry = new Date(expirationDate).getTime();
        const daysSinceExpiry = (now - expiry) / (24 * 60 * 60 * 1000);

        if (willRenew && daysSinceExpiry <= OFFLINE_GRACE_PERIOD_DAYS) {
            return {
                hasAccess: true,
                state: SUBSCRIPTION_STATE.ACTIVE_OFFLINE_GRACE,
                message: "Connect to verify your subscription renewal.",
                daysInGrace: Math.floor(daysSinceExpiry),
                daysRemaining: Math.max(0, OFFLINE_GRACE_PERIOD_DAYS - Math.floor(daysSinceExpiry)),
            };
        }

        if (daysSinceExpiry > OFFLINE_GRACE_PERIOD_DAYS) {
            return {
                hasAccess: false,
                state: SUBSCRIPTION_STATE.EXPIRED_GRACE_ELAPSED,
                message: "Pro paused. Please connect to verify your subscription.",
                requiresOnlineCheck: true,
            };
        }

        return null;
    }

    // ==========================================
    // REFRESH FROM REVENUECAT
    // ==========================================

    async refreshFromRevenueCat() {
        try {
            console.log('🔄 Refreshing subscription from RevenueCat...');

            const customerInfo = await Purchases.getCustomerInfo();

            await AsyncStorage.setItem(CACHE_KEYS.LAST_ONLINE_CHECK, Date.now().toString());
            await this._cacheCustomerInfo(customerInfo);
            await this._updateMinAccessUntil(customerInfo);

            console.log('✅ Subscription refreshed successfully');

            return customerInfo;
        } catch (error) {
            console.error('❌ Failed to refresh from RevenueCat:', error);
            throw error;
        }
    }

    // ==========================================
    // CACHE SYSTEM
    // ==========================================

    async _cacheCustomerInfo(customerInfo) {
        try {
            const cacheData = {
                customerInfo: customerInfo,
                cachedAt: Date.now(),
            };

            await AsyncStorage.setItem(
                CACHE_KEYS.CUSTOMER_INFO,
                JSON.stringify(cacheData)
            );
        } catch (error) {
            console.error('Failed to cache customer info:', error);
        }
    }

    async _getCachedCustomerInfo() {
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEYS.CUSTOMER_INFO);
            if (!cached) return null;

            const { customerInfo, cachedAt } = JSON.parse(cached);
            return { customerInfo, cachedAt };
        } catch (error) {
            console.error('Failed to get cached customer info:', error);
            return null;
        }
    }

    async _updateMinAccessUntil(customerInfo) {
        try {
            const { expirationDate } = this._extractSubscriptionData(customerInfo);
            if (!expirationDate) return;

            const newExpiry = new Date(expirationDate).getTime();

            const currentMinStr = await AsyncStorage.getItem(CACHE_KEYS.MIN_ACCESS_UNTIL);
            const currentMin = currentMinStr ? parseInt(currentMinStr, 10) : 0;

            if (newExpiry > currentMin) {
                await AsyncStorage.setItem(CACHE_KEYS.MIN_ACCESS_UNTIL, newExpiry.toString());
                console.log('✅ Updated minAccessUntil to:', new Date(newExpiry).toISOString());
            }
        } catch (error) {
            console.error('Failed to update minAccessUntil:', error);
        }
    }

    async _getMinAccessUntil() {
        try {
            const minStr = await AsyncStorage.getItem(CACHE_KEYS.MIN_ACCESS_UNTIL);
            return minStr ? parseInt(minStr, 10) : 0;
        } catch (error) {
            return 0;
        }
    }

    // ==========================================
    // CLOCK TAMPERING DETECTION
    // ==========================================

    async detectClockTampering() {
        try {
            const now = Date.now();

            const lastCheckStr = await AsyncStorage.getItem(CACHE_KEYS.CLOCK_CHECK_TIMESTAMP);
            const lastElapsedStr = await AsyncStorage.getItem(CACHE_KEYS.ELAPSED_REALTIME_BASELINE);

            if (!lastCheckStr || !lastElapsedStr) {
                await this._recordClockBaseline();
                return { tampered: false, reason: 'baseline_established' };
            }

            const lastCheck = parseInt(lastCheckStr, 10);
            const lastElapsed = parseInt(lastElapsedStr, 10);

            const currentElapsed = await this._getElapsedRealtime();

            const elapsedDiff = currentElapsed - lastElapsed;
            const expectedNow = lastCheck + elapsedDiff;
            const actualDiff = now - expectedNow;

            if (actualDiff < -MAX_BACKWARD_JUMP_MS) {
                console.warn('⚠️ Clock tampering suspected! Backward jump:', actualDiff / 1000, 'seconds');
                return {
                    tampered: true,
                    reason: 'backward_jump',
                    jumpAmount: actualDiff,
                    requiresOnlineVerification: true,
                };
            }

            await this._recordClockBaseline();
            return { tampered: false, reason: 'normal' };
        } catch (error) {
            console.error('Error detecting clock tampering:', error);
            return { tampered: false, reason: 'error' };
        }
    }

    async _recordClockBaseline() {
        const now = Date.now();
        const elapsed = await this._getElapsedRealtime();

        await AsyncStorage.setItem(CACHE_KEYS.CLOCK_CHECK_TIMESTAMP, now.toString());
        await AsyncStorage.setItem(CACHE_KEYS.ELAPSED_REALTIME_BASELINE, elapsed.toString());
    }

    async _getElapsedRealtime() {
        const offset = await this._getOrCreateElapsedOffset();
        return Date.now() + offset;
    }

    async _getOrCreateElapsedOffset() {
        const key = '@elapsed_offset_simulation';
        let offset = await AsyncStorage.getItem(key);

        if (!offset) {
            offset = Math.floor(Math.random() * 1000000).toString();
            await AsyncStorage.setItem(key, offset);
        }

        return parseInt(offset, 10);
    }

    // ==========================================
    // LONG-TERM OFFLINE CHECK
    // ==========================================

    async checkLongTermOffline() {
        try {
            const lastOnlineStr = await AsyncStorage.getItem(CACHE_KEYS.LAST_ONLINE_CHECK);

            if (!lastOnlineStr) {
                return { isLongOffline: false, daysSinceCheck: null };
            }

            const lastOnline = parseInt(lastOnlineStr, 10);
            const now = Date.now();
            const timeSinceCheck = now - lastOnline;
            const daysSinceCheck = timeSinceCheck / (24 * 60 * 60 * 1000);

            if (timeSinceCheck > LONG_TERM_OFFLINE_MS) {
                return {
                    isLongOffline: true,
                    daysSinceCheck: Math.floor(daysSinceCheck),
                    message: 'Please go online to verify your subscription.',
                    requiresOnlineCheck: true,
                };
            }

            return {
                isLongOffline: false,
                daysSinceCheck: Math.floor(daysSinceCheck),
            };
        } catch (error) {
            console.error('Error checking long-term offline:', error);
            return { isLongOffline: false, daysSinceCheck: null };
        }
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    async initialize() {
        console.log('🚀 Initializing Advanced Subscription Manager...');

        try {
            const clockCheck = await this.detectClockTampering();

            if (clockCheck.tampered) {
                console.warn('⚠️ Clock tampering detected - requires online verification');
            }

            try {
                await this.refreshFromRevenueCat();
                this.isOnline = true;
            } catch (error) {
                console.log('📴 Starting in offline mode');
                this.isOnline = false;
            }

            const status = await this.getSubscriptionStatus();
            console.log('✅ Subscription manager initialized:', status.state);

            return status;
        } catch (error) {
            console.error('❌ Failed to initialize subscription manager:', error);
            throw error;
        }
    }

    // ==========================================
    // APP STATE HANDLING
    // ==========================================

    async _handleAppStateChange(nextAppState) {
        if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
            console.log('📱 App came to foreground - refreshing subscription...');

            try {
                await this.refreshFromRevenueCat();
                this.isOnline = true;
                await this._notifyListeners();
            } catch (error) {
                console.log('📴 Still offline');
                this.isOnline = false;
            }
        }

        this.appState = nextAppState;
    }

    async refreshAfterPurchase() {
        console.log('💳 Purchase completed - refreshing subscription...');

        try {
            await this.refreshFromRevenueCat();
            this.isOnline = true;

            const status = await this.getSubscriptionStatus();
            await this._notifyListeners();

            return status;
        } catch (error) {
            console.error('❌ Failed to refresh after purchase:', error);
            throw error;
        }
    }

    // ==========================================
    // MAIN STATUS CHECK
    // ==========================================

    async getSubscriptionStatus() {
        try {
            let customerInfo = null;
            let isFromCache = false;

            if (this.isOnline) {
                try {
                    customerInfo = await Purchases.getCustomerInfo();
                    await this._cacheCustomerInfo(customerInfo);
                    await this._updateMinAccessUntil(customerInfo);
                    await AsyncStorage.setItem(CACHE_KEYS.LAST_ONLINE_CHECK, Date.now().toString());
                } catch (error) {
                    console.log('📴 Failed to fetch online, using cache');
                    this.isOnline = false;
                }
            }

            if (!customerInfo) {
                const cached = await this._getCachedCustomerInfo();
                if (cached) {
                    customerInfo = cached.customerInfo;
                    isFromCache = true;
                }
            }

            if (!customerInfo) {
                return {
                    hasProAccess: false,
                    state: SUBSCRIPTION_STATE.UNKNOWN,
                    message: 'Connect to check subscription status.',
                    requiresOnlineCheck: true,
                };
            }

            const subscriptionData = this._extractSubscriptionData(customerInfo);

            if (!subscriptionData.hasActiveEntitlement) {
                return {
                    hasProAccess: false,
                    state: SUBSCRIPTION_STATE.NO_SUBSCRIPTION,
                    message: null,
                    subscriptionData,
                };
            }

            const { expirationDate, willRenew } = subscriptionData;
            const now = Date.now();
            const expiry = new Date(expirationDate).getTime();

            // Check clock tampering
            const clockCheck = await this.detectClockTampering();
            if (clockCheck.tampered) {
                return {
                    hasProAccess: false,
                    state: SUBSCRIPTION_STATE.CLOCK_TAMPERING_SUSPECTED,
                    message: 'Please connect to verify your subscription.',
                    requiresOnlineCheck: true,
                    clockCheck,
                };
            }

            // Check long-term offline
            const offlineCheck = await this.checkLongTermOffline();
            if (offlineCheck.isLongOffline && now >= expiry) {
                return {
                    hasProAccess: false,
                    state: SUBSCRIPTION_STATE.EXPIRED_LONG_OFFLINE,
                    message: 'Please go online to verify your subscription.',
                    requiresOnlineCheck: true,
                    daysSinceCheck: offlineCheck.daysSinceCheck,
                    subscriptionData,
                };
            }

            // Normal active period
            if (this._isInActivePeriod(expirationDate)) {
                return {
                    hasProAccess: true,
                    state: SUBSCRIPTION_STATE.ACTIVE,
                    message: null,
                    subscriptionData,
                    isFromCache,
                };
            }

            // Cancelled and expired
            if (this._isCancelledAndExpired(willRenew, expirationDate)) {
                return {
                    hasProAccess: false,
                    state: SUBSCRIPTION_STATE.EXPIRED_CANCELLED,
                    message: 'Subscription ended. Renew to continue using Pro features.',
                    subscriptionData,
                    isFromCache,
                };
            }

            // Grace period
            if (this._isInOfflineGracePeriod(willRenew, expirationDate)) {
                const daysSinceExpiry = (now - expiry) / (24 * 60 * 60 * 1000);
                const daysRemaining = Math.max(0, OFFLINE_GRACE_PERIOD_DAYS - Math.floor(daysSinceExpiry));

                return {
                    hasProAccess: true,
                    state: SUBSCRIPTION_STATE.ACTIVE_OFFLINE_GRACE,
                    message: "Connect to verify renewal.",
                    daysInGrace: Math.floor(daysSinceExpiry),
                    daysRemaining,
                    subscriptionData,
                    isFromCache,
                };
            }

            // Grace period elapsed
            if (willRenew && now >= expiry) {
                return {
                    hasProAccess: false,
                    state: SUBSCRIPTION_STATE.EXPIRED_GRACE_ELAPSED,
                    message: 'Pro paused. Please connect to verify.',
                    requiresOnlineCheck: true,
                    subscriptionData,
                    isFromCache,
                };
            }

            return {
                hasProAccess: false,
                state: SUBSCRIPTION_STATE.UNKNOWN,
                message: 'Unable to determine subscription status.',
                subscriptionData,
                isFromCache,
            };

        } catch (error) {
            console.error('❌ Error getting subscription status:', error);
            return {
                hasProAccess: false,
                state: SUBSCRIPTION_STATE.UNKNOWN,
                message: 'Error checking subscription.',
                error: error.message,
            };
        }
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    _extractSubscriptionData(customerInfo) {
        const entitlements = customerInfo?.entitlements?.active || {};

        // RELAXED CHECK: Use first available active entitlement (Filtered)
        const activeKeys = Object.keys(entitlements).filter(key => {
            const pid = entitlements[key]?.productIdentifier || '';
            return !pid.includes('_pack_credits');
        });

        const proEntitlement = activeKeys.length > 0 ? entitlements[activeKeys[0]] : null;

        if (!proEntitlement) {
            return {
                hasActiveEntitlement: false,
                expirationDate: null,
                willRenew: false,
                planType: null,
            };
        }

        // Determine plan type from product identifier
        const productId = proEntitlement.productIdentifier || '';
        let planType = null;
        if (productId.includes('weekly')) {
            planType = 'weekly';
        } else if (productId.includes('monthly')) {
            planType = 'monthly';
        }

        return {
            hasActiveEntitlement: true,
            expirationDate: proEntitlement.expiresDate,
            willRenew: proEntitlement.willRenew,
            productIdentifier: productId,
            periodType: proEntitlement.periodType,
            store: proEntitlement.store,
            planType,
        };
    }

    // ==========================================
    // PLAN MANAGEMENT
    // ==========================================

    openManageSubscriptions() {
        const storeUrl = Platform.select({
            ios: 'https://apps.apple.com/account/subscriptions',
            android: 'https://play.google.com/store/account/subscriptions',
        });

        Linking.openURL(storeUrl).catch(err => {
            console.error('Failed to open store subscriptions:', err);
        });
    }

    // ==========================================
    // LISTENERS
    // ==========================================

    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    async _notifyListeners() {
        const status = await this.getSubscriptionStatus();
        this.listeners.forEach(callback => callback(status));
    }

    destroy() {
        if (this.appStateSubscription) {
            this.appStateSubscription.remove();
        }
    }
}

// ==========================================
// SINGLETON INSTANCE
// ==========================================

const subscriptionManager = new AdvancedSubscriptionManager();

export default subscriptionManager;

// Convenience exports
export const initializeSubscription = () => subscriptionManager.initialize();
export const getSubscriptionStatus = () => subscriptionManager.getSubscriptionStatus();
export const refreshSubscription = () => subscriptionManager.refreshFromRevenueCat();
export const refreshAfterPurchase = () => subscriptionManager.refreshAfterPurchase();
export const addSubscriptionListener = (callback) => subscriptionManager.addListener(callback);
export const openManageSubscriptions = () => subscriptionManager.openManageSubscriptions();
