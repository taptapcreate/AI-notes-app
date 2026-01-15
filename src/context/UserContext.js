import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CreditSyncService from '../services/CreditSyncService';
import PurchaseService from '../services/PurchaseService';

const UserContext = createContext();

// Cache keys for offline fallback
const PURCHASED_CREDITS_CACHE_KEY = '@purchased_credits_cache';
const FREE_CREDITS_CACHE_KEY = '@free_credits_cache';
const FREE_DAILY_LIMIT = 3;
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

    // App Configuration (Remote)
    const [appConfig, setAppConfig] = useState(null);

    // Initialize on mount
    useEffect(() => {
        initializeCredits();
        initializeConfig();
        checkOnboardingStatus();
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

    // Check subscription status via AdvancedSubscriptionManager
    const checkSubscriptionStatus = async () => {
        try {
            // Use dynamic import to avoid circular dependency
            const { getSubscriptionStatus } = await import('../services/AdvancedSubscriptionManager');
            const status = await getSubscriptionStatus();

            setHasProSubscription(status.hasProAccess);

            // Get subscription type from subscription data
            if (status.hasProAccess && status.subscriptionData) {
                setSubscriptionType(status.subscriptionData.planType);
            } else {
                setSubscriptionType(null);
            }

            return status;
        } catch (error) {
            console.error('Check subscription error:', error);

            // Fallback to PurchaseService if AdvancedSubscriptionManager fails
            try {
                const result = await PurchaseService.checkProAccess();
                if (result.success) {
                    setHasProSubscription(result.hasProAccess);

                    if (result.hasProAccess && result.customerInfo) {
                        const activeEntitlements = result.customerInfo.entitlements.active;
                        if (activeEntitlements) {
                            const productId = Object.values(activeEntitlements)[0]?.productIdentifier || '';
                            if (productId.includes('weekly')) {
                                setSubscriptionType('weekly');
                            } else if (productId.includes('monthly')) {
                                setSubscriptionType('monthly');
                            }
                        }
                    } else {
                        setSubscriptionType(null);
                    }
                }
                return result;
            } catch (fallbackError) {
                console.error('Fallback check also failed:', fallbackError);
                return { success: false };
            }
        }
    };

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

    // Use credits - SUBSCRIBERS get unlimited, others use FREE first, then PURCHASED
    const useCredits = async (cost = 1) => {
        try {
            // Subscribers get unlimited access - no credit deduction
            if (hasProSubscription) {
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
            initializeCredits,
            appConfig,
            hasSeenOnboarding,
            isOnboardingLoading,
            completeOnboarding
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
