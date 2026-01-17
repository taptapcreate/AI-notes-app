import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CreditSyncService from '../services/CreditSyncService';
import PurchaseService from '../services/PurchaseService';

const UserContext = createContext();

// Cache keys for offline fallback
const PURCHASED_CREDITS_CACHE_KEY = '@purchased_credits_cache';
const FREE_CREDITS_CACHE_KEY = '@free_credits_cache';
const SUBSCRIBER_DAILY_USAGE_KEY = '@subscriber_daily_usage';
const IS_PRO_USER_CACHE = '@is_pro_user_legacy_v2'; // Simple boolean cache for instant load
const WAS_PRO_USER_CACHE = '@was_pro_user_last_known'; // To track expiration
const FREE_DAILY_LIMIT = 3;
const SUBSCRIBER_DAILY_LIMIT = 100; // Max requests per day for subscribers
const ONBOARDING_SHOWN_KEY = '@onboarding_shown_v1';

export const UserProvider = ({ children }) => {
    const [purchasedCredits, setPurchasedCredits] = useState(0);
    const [freeCreditsRemaining, setFreeCreditsRemaining] = useState(null);
    const [recoveryCode, setRecoveryCode] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);
    const [needsRecovery, setNeedsRecovery] = useState(false);

    // Onboarding State
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
    const [isOnboardingLoading, setIsOnboardingLoading] = useState(true);

    // Subscription state
    const [hasProSubscription, setHasProSubscription] = useState(false);
    const [subscriptionType, setSubscriptionType] = useState(null);
    const [subscriberDailyUsage, setSubscriberDailyUsage] = useState(0);

    // App Configuration (Remote)
    const [appConfig, setAppConfig] = useState(null);

    // Initialize on mount
    useEffect(() => {
        // INSTANT LOAD: Load local boolean cache first to prevent "Free" flicker
        const loadCache = async () => {
            try {
                const cachedPro = await AsyncStorage.getItem(IS_PRO_USER_CACHE);
                if (cachedPro === 'true') {
                    console.log('⚡ Loaded cached Pro status: TRUE');
                    setHasProSubscription(true);
                }
            } catch (e) { console.log('Cache load error', e); }
        };
        loadCache();

        initializeCredits();
        initializeConfig();
        checkOnboardingStatus();

        // Listen for real-time subscription updates
        const setupListener = async () => {
            await PurchaseService.addCustomerInfoUpdateListener((customerInfo) => {
                console.log('🔔 RevenueCat Update Received in UserContext');
                handleCustomerInfoUpdate(customerInfo);
            });
        };
        setupListener();
    }, []);

    const checkOnboardingStatus = async () => {
        try {
            const result = await AsyncStorage.getItem(ONBOARDING_SHOWN_KEY);
            if (result === 'true') {
                setHasSeenOnboarding(true);
            }
        } catch (error) {
            console.log('Error checking onboarding:', error);
        } finally {
            setIsOnboardingLoading(false);
        }
    };

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_SHOWN_KEY, 'true');
            setHasSeenOnboarding(true);
        } catch (error) {
            console.error('Failed to save onboarding status:', error);
        }
    };

    const initializeConfig = async () => {
        // Dynamic import to avoid circular dependency if any (ConfigService is clean though)
        const { fetchAppConfig } = await import('../services/ConfigService');
        const config = await fetchAppConfig();
        if (config) {
            setAppConfig(config);
        }
    };

    const initializeCredits = async () => {
        try {
            setIsLoading(true);

            // Initialize with server (source of truth for BOTH free and purchased)
            const result = await CreditSyncService.initializeCreditSystem();

            if (result.success !== false) {
                setRecoveryCode(result.recoveryCode);
                setPurchasedCredits(result.credits || 0);
                setFreeCreditsRemaining(result.freeCreditsRemaining ?? 3);
                setNeedsRecovery(result.needsRecovery || false);
                setIsOnline(true);

                // Cache for offline use
                await cacheCredits(result.credits || 0, result.freeCreditsRemaining ?? 3);
            } else {
                console.log('Credit init failed, using cached values');
                setIsOnline(false);
                await loadCachedCredits();
            }
        } catch (error) {
            console.error('Failed to initialize credits:', error);
            setIsOnline(false);
            await loadCachedCredits();
        } finally {
            setIsLoading(false);
        }
    };

    // Cache both credit types for offline fallback
    const cacheCredits = async (purchased, free) => {
        try {
            await AsyncStorage.setItem(PURCHASED_CREDITS_CACHE_KEY, purchased.toString());
            await AsyncStorage.setItem(FREE_CREDITS_CACHE_KEY, free.toString());
        } catch (error) {
            console.error('Failed to cache credits:', error);
        }
    };

    // Load cached credits when offline
    const loadCachedCredits = async () => {
        try {
            const cachedPurchased = await AsyncStorage.getItem(PURCHASED_CREDITS_CACHE_KEY);
            const cachedFree = await AsyncStorage.getItem(FREE_CREDITS_CACHE_KEY);

            if (cachedPurchased) setPurchasedCredits(parseInt(cachedPurchased) || 0);
            if (cachedFree !== null) {
                const parsed = parseInt(cachedFree);
                setFreeCreditsRemaining(!isNaN(parsed) ? parsed : 3);
            } else {
                setFreeCreditsRemaining(3);
            }

            const code = await CreditSyncService.getRecoveryCode();
            if (code) setRecoveryCode(code);
        } catch (error) {
            console.error('Failed to load cached credits:', error);
        }
    };

    // Handle real-time updates from RevenueCat
    const handleCustomerInfoUpdate = (customerInfo) => {
        try {
            if (!customerInfo || !customerInfo.entitlements) return;

            const activeEntitlements = customerInfo.entitlements.active;

            // FILTER: Only count real subscriptions, not accidental credit packs
            const activeKeys = Object.keys(activeEntitlements).filter(key => {
                const pid = activeEntitlements[key]?.productIdentifier || '';
                return !pid.includes('_pack_credits');
            });

            const hasProAccess = activeKeys.length > 0;

            console.log('🔍 Listener Update - Active Keys:', activeKeys);

            setHasProSubscription(hasProAccess);
            AsyncStorage.setItem(IS_PRO_USER_CACHE, hasProAccess ? 'true' : 'false').catch(e => console.log(e));

            // EXPIRATION CHECK: If user WAS pro and now is NOT, show alert
            const checkExpiration = async () => {
                try {
                    const wasPro = await AsyncStorage.getItem(WAS_PRO_USER_CACHE);
                    if (wasPro === 'true' && !hasProAccess) {
                        console.log('📉 Subscription Expired: User downgraded from Pro to Free');
                        Alert.alert(
                            'Subscription Ended',
                            'Your Pro subscription has expired. You are now on the Free plan with daily limits.'
                        );
                    }
                    // Update cache for next time
                    await AsyncStorage.setItem(WAS_PRO_USER_CACHE, hasProAccess ? 'true' : 'false');
                } catch (e) { console.log('Expiration check error', e); }
            };
            checkExpiration();

            if (hasProAccess) {
                // CORRECTION: Use the first available filtered key, not hardcoded string
                const entitlement = activeEntitlements[activeKeys[0]];
                const productId = entitlement?.productIdentifier || '';

                console.log('🔍 Listener - Processing Subscription Product ID:', productId);

                if (productId.includes('monthly')) {
                    setSubscriptionType('monthly');
                } else if (productId.includes('weekly')) {
                    setSubscriptionType('weekly');
                } else {
                    // Fallback or Unknown
                    setSubscriptionType('monthly'); // Assume monthly if unknown/pro?
                }
            } else {
                setSubscriptionType(null);
            }

            console.log('✅ Subscription state updated via listener:', hasProAccess);
        } catch (error) {
            console.error('Error handling customer info update:', error);
        }
    };

    // Check subscription status via AdvancedSubscriptionManager
    const checkSubscriptionStatus = useCallback(async () => {
        try {
            // Use dynamic import to avoid circular dependency
            const { getSubscriptionStatus, SUBSCRIPTION_STATE } = await import('../services/AdvancedSubscriptionManager');
            const status = await getSubscriptionStatus();

            let finalHasPro = status.hasProAccess;
            let isUnknown = status.state === SUBSCRIPTION_STATE.UNKNOWN || status.state === 'unknown';

            // If status is UNKNOWN or FALSE, try the Fallback (PurchaseService)
            // This ensures we double-check Entitlements directly if the AdvancedManager is unsure or says Free
            if (isUnknown || !finalHasPro) {
                try {
                    const fallbackCheck = await PurchaseService.checkProAccess();
                    if (fallbackCheck.success && fallbackCheck.hasProAccess) {
                        console.log('⚠️ Status was ' + status.state + ', but PurchaseService found Entitlement. Overriding to PRO.');
                        finalHasPro = true;
                        isUnknown = false; // We are now certain they are Pro

                        // Update status object to reflect this override
                        status.hasProAccess = true;
                        status.subscriptionData = { planType: 'monthly' }; // Default

                        if (fallbackCheck.customerInfo) {
                            const activeEntitlements = fallbackCheck.customerInfo.entitlements.active;
                            const activeKeys = Object.keys(activeEntitlements).filter(key => {
                                return !activeEntitlements[key]?.productIdentifier?.includes('_pack_credits');
                            });

                            if (activeKeys.length > 0) {
                                const pid = activeEntitlements[activeKeys[0]]?.productIdentifier || '';
                                if (pid.includes('weekly')) status.subscriptionData.planType = 'weekly';
                            }
                        }
                    }
                } catch (e) { console.log('Double-check failed', e); }
            }

            // CRITICAL: If status is STILL unknown after fallback, abort update
            if (isUnknown) {
                console.log('⚠️ Subscription status Still UNKNOWN - keeping previous state');
                return status;
            }

            setHasProSubscription(finalHasPro);
            AsyncStorage.setItem(IS_PRO_USER_CACHE, finalHasPro ? 'true' : 'false').catch(e => console.log(e));

            // EXPIRATION CHECK: Same logic as listener
            const checkExpiration = async () => {
                try {
                    const wasPro = await AsyncStorage.getItem(WAS_PRO_USER_CACHE);
                    if (wasPro === 'true' && !finalHasPro) {
                        console.log('📉 Subscription Expired (Manual Check): User downgraded');
                        Alert.alert(
                            'Subscription Ended',
                            'Your Pro subscription has expired. You are now on the Free plan with daily limits.'
                        );
                    }
                    await AsyncStorage.setItem(WAS_PRO_USER_CACHE, finalHasPro ? 'true' : 'false');
                } catch (e) { console.log('Expiration check error', e); }
            };
            checkExpiration();

            // Get subscription type from subscription data
            if (status.hasProAccess && status.subscriptionData) {
                setSubscriptionType(status.subscriptionData.planType);
            } else {
                setSubscriptionType(null);
            }

            return status;
        } catch (error) {
            console.error('Error checking subscription status:', error);
            return null;
        }
    }, [setHasProSubscription, setSubscriptionType]);

    // Sync BOTH credit balances from server
    const syncBalance = useCallback(async () => {
        try {
            // Check subscription status
            await checkSubscriptionStatus();

            // Sync from server (source of truth for both)
            const result = await CreditSyncService.getBalance();
            if (result.success) {
                setPurchasedCredits(result.credits);
                setFreeCreditsRemaining(result.freeCreditsRemaining ?? FREE_DAILY_LIMIT);
                setIsOnline(true);
                await cacheCredits(result.credits, result.freeCreditsRemaining ?? FREE_DAILY_LIMIT);
            }
            return result;
        } catch (error) {
            console.error('Sync balance error:', error);
            setIsOnline(false);
            return { success: false, error: error.message };
        }
    }, []);

    // Use credits - SUBSCRIBERS get rate-limited unlimited, others use FREE first, then PURCHASED
    const useCredits = async (cost = 1) => {
        try {
            // Subscribers get access but with daily rate limit
            if (hasProSubscription) {
                // Check and update subscriber daily usage
                const usage = await getSubscriberDailyUsage();

                if (usage >= SUBSCRIBER_DAILY_LIMIT) {
                    console.log(`Subscriber daily limit reached: ${usage}/${SUBSCRIBER_DAILY_LIMIT}`);
                    return { success: false, rateLimited: true, remaining: 0, limit: SUBSCRIBER_DAILY_LIMIT };
                }

                // Increment usage
                await incrementSubscriberUsage();
                return true;
            }

            const totalAvailable = freeCreditsRemaining + purchasedCredits;
            if (totalAvailable < cost) {
                return false; // Not enough credits
            }

            // Let server handle the deduction (free first, then purchased)
            const result = await CreditSyncService.useCredits(cost);

            if (result.success) {
                // Update both credit types from server response
                setPurchasedCredits(result.remainingCredits);
                setFreeCreditsRemaining(result.remainingFreeCredits);

                // Cache for offline use
                await cacheCredits(result.remainingCredits, result.remainingFreeCredits);
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Use credits error:', error);
            return false;
        }
    };

    // Get subscriber daily usage (resets at midnight)
    const getSubscriberDailyUsage = async () => {
        try {
            const stored = await AsyncStorage.getItem(SUBSCRIBER_DAILY_USAGE_KEY);
            if (!stored) return 0;

            const data = JSON.parse(stored);
            const storedDate = new Date(data.date).toDateString();
            const today = new Date().toDateString();

            // Reset if new day
            if (storedDate !== today) {
                await AsyncStorage.setItem(SUBSCRIBER_DAILY_USAGE_KEY, JSON.stringify({ count: 0, date: new Date().toISOString() }));
                setSubscriberDailyUsage(0);
                return 0;
            }

            setSubscriberDailyUsage(data.count);
            return data.count;
        } catch (error) {
            console.error('Get subscriber usage error:', error);
            return 0;
        }
    };

    // Increment subscriber daily usage
    const incrementSubscriberUsage = async () => {
        try {
            const current = await getSubscriberDailyUsage();
            const newCount = current + 1;
            await AsyncStorage.setItem(SUBSCRIBER_DAILY_USAGE_KEY, JSON.stringify({ count: newCount, date: new Date().toISOString() }));
            setSubscriberDailyUsage(newCount);
        } catch (error) {
            console.error('Increment subscriber usage error:', error);
        }
    };

    // Add PURCHASED credits (server-side)
    const addCredits = async (amount, transactionId) => {
        try {
            const txId = transactionId || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const result = await CreditSyncService.addCredits(amount, txId);

            if (result.success) {
                setPurchasedCredits(result.newBalance);
                await cacheCredits(result.newBalance, freeCreditsRemaining);
                return { success: true, newBalance: result.newBalance };
            } else if (result.alreadyProcessed) {
                return { success: false, alreadyProcessed: true };
            }
            return { success: false };
        } catch (error) {
            console.error('Add credits error:', error);
            return { success: false, error: error.message };
        }
    };

    // Recover account - merges credits if different code, or switches if no current
    const recoverAccount = async (code) => {
        try {
            // Pass current recovery code for merge functionality
            const result = await CreditSyncService.recoverAccount(code, recoveryCode);

            if (result.success) {
                setRecoveryCode(result.recoveryCode);
                setPurchasedCredits(result.credits);
                setFreeCreditsRemaining(result.freeCreditsRemaining ?? 3);
                setNeedsRecovery(false);
                await cacheCredits(result.credits, result.freeCreditsRemaining ?? 3);

                // Return success for UI feedback
                return {
                    success: true,
                    message: result.message,
                    recoveryCode: result.recoveryCode // Return new code for checks
                };
            }
            return { success: false, error: result.error };
        } catch (error) {
            console.error('Recover account error:', error);
            return { success: false, error: error.message };
        }
    };

    // Check if user has enough credits (subscribers always have access)
    const checkAvailability = (cost = 1) => {
        if (hasProSubscription) return true;
        return (freeCreditsRemaining + purchasedCredits) >= cost;
    };

    // Get credit data for display
    const getCreditData = () => {
        return {
            remainingFree: freeCreditsRemaining !== null ? freeCreditsRemaining : '-',
            purchasedCredits,
            totalAvailable: hasProSubscription ? 'Unlimited' : freeCreditsRemaining + purchasedCredits,
            freeLimit: FREE_DAILY_LIMIT,
            isExhausted: !hasProSubscription && (freeCreditsRemaining + purchasedCredits) <= 0,
            recoveryCode,
            isOnline,
            needsRecovery,
            // Subscription info
            hasProSubscription,
            subscriptionType,
            // Subscriber rate limiting
            subscriberDailyUsage,
            subscriberDailyLimit: SUBSCRIBER_DAILY_LIMIT,
            // App Config
            appConfig,
        };
    };

    return (
        <UserContext.Provider value={{
            purchasedCredits,
            freeCreditsRemaining,
            recoveryCode,
            isLoading,
            isOnline,
            needsRecovery,
            useCredits,
            addCredits,
            checkAvailability,
            getCreditData,
            syncBalance,
            recoverAccount,
            initializeCredits,
            checkSubscriptionStatus,
            appConfig,
            hasSeenOnboarding,
            isOnboardingLoading,
            completeOnboarding,
            hasProSubscription,
            subscriptionType
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export default UserContext;
