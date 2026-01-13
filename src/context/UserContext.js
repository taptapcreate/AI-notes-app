import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CreditSyncService from '../services/CreditSyncService';
import PurchaseService from '../services/PurchaseService';

const UserContext = createContext();

// Free credits are LOCAL (device-based)
const FREE_DAILY_LIMIT = 5;
const FREE_CREDITS_KEY = '@free_daily_credits';
const FREE_CREDITS_DATE_KEY = '@free_credits_date';

export const UserProvider = ({ children }) => {
    const [purchasedCredits, setPurchasedCredits] = useState(0);
    const [freeCreditsRemaining, setFreeCreditsRemaining] = useState(5);
    const [recoveryCode, setRecoveryCode] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);
    const [needsRecovery, setNeedsRecovery] = useState(false);

    // Subscription state
    const [hasProSubscription, setHasProSubscription] = useState(false);
    const [subscriptionType, setSubscriptionType] = useState(null); // 'weekly' or 'monthly'

    // Initialize on mount
    useEffect(() => {
        initializeCredits();
    }, []);

    // Load/reset LOCAL free credits (device-based)
    const loadLocalFreeCredits = async () => {
        try {
            const savedDate = await AsyncStorage.getItem(FREE_CREDITS_DATE_KEY);
            const today = new Date().toDateString();

            if (savedDate === today) {
                // Same day - load saved free credits
                const savedCredits = await AsyncStorage.getItem(FREE_CREDITS_KEY);
                setFreeCreditsRemaining(savedCredits ? parseInt(savedCredits) : FREE_DAILY_LIMIT);
            } else {
                // New day - reset to full free credits
                setFreeCreditsRemaining(FREE_DAILY_LIMIT);
                await AsyncStorage.setItem(FREE_CREDITS_KEY, FREE_DAILY_LIMIT.toString());
                await AsyncStorage.setItem(FREE_CREDITS_DATE_KEY, today);
            }
        } catch (error) {
            console.error('Error loading free credits:', error);
            setFreeCreditsRemaining(FREE_DAILY_LIMIT);
        }
    };

    // Save free credits locally
    const saveLocalFreeCredits = async (amount) => {
        try {
            await AsyncStorage.setItem(FREE_CREDITS_KEY, amount.toString());
            await AsyncStorage.setItem(FREE_CREDITS_DATE_KEY, new Date().toDateString());
        } catch (error) {
            console.error('Error saving free credits:', error);
        }
    };

    const initializeCredits = async () => {
        try {
            setIsLoading(true);

            // Load LOCAL free credits first (device-based)
            await loadLocalFreeCredits();

            // Then initialize SERVER purchased credits
            const result = await CreditSyncService.initializeCreditSystem();

            if (result.success !== false) {
                setRecoveryCode(result.recoveryCode);
                setPurchasedCredits(result.credits || 0);
                // DON'T set free credits from server - keep local value
                setNeedsRecovery(result.needsRecovery || false);
                setIsOnline(true);
            } else {
                console.log('Credit init failed, using cached values');
                setIsOnline(false);
                await loadCachedPurchasedCredits();
            }
        } catch (error) {
            console.error('Failed to initialize credits:', error);
            setIsOnline(false);
            await loadCachedPurchasedCredits();
        } finally {
            setIsLoading(false);
        }
    };

    // Load cached PURCHASED credits only
    const loadCachedPurchasedCredits = async () => {
        try {
            const cached = await AsyncStorage.getItem('@purchased_credits_cache');
            if (cached) {
                setPurchasedCredits(parseInt(cached) || 0);
            }
            const code = await CreditSyncService.getRecoveryCode();
            if (code) setRecoveryCode(code);
        } catch (error) {
            console.error('Failed to load cached credits:', error);
        }
    };

    // Cache purchased credits
    const cachePurchasedCredits = async (credits) => {
        try {
            await AsyncStorage.setItem('@purchased_credits_cache', credits.toString());
        } catch (error) {
            console.error('Failed to cache credits:', error);
        }
    };

    // Check subscription status via RevenueCat
    const checkSubscriptionStatus = async () => {
        try {
            const result = await PurchaseService.checkProAccess();
            if (result.success) {
                setHasProSubscription(result.hasProAccess);

                // Determine subscription type if active
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
        } catch (error) {
            console.error('Check subscription error:', error);
            return { success: false };
        }
    };

    // Sync PURCHASED balance from server (free credits stay local)
    const syncBalance = useCallback(async () => {
        try {
            // Refresh local free credits for the day
            await loadLocalFreeCredits();

            // Check subscription status
            await checkSubscriptionStatus();

            // Sync purchased credits from server
            const result = await CreditSyncService.getBalance();
            if (result.success) {
                setPurchasedCredits(result.credits);
                // DON'T update free credits from server
                setIsOnline(true);
                await cachePurchasedCredits(result.credits);
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

            let remaining = cost;

            // First, use FREE credits (local)
            if (freeCreditsRemaining > 0) {
                const freeToUse = Math.min(freeCreditsRemaining, remaining);
                const newFreeCredits = freeCreditsRemaining - freeToUse;
                setFreeCreditsRemaining(newFreeCredits);
                await saveLocalFreeCredits(newFreeCredits);
                remaining -= freeToUse;
            }

            // If still need more, use PURCHASED credits (server)
            if (remaining > 0) {
                if (purchasedCredits < remaining) {
                    return false; // Not enough credits
                }

                const result = await CreditSyncService.useCredits(remaining);
                if (result.success) {
                    setPurchasedCredits(result.remainingCredits);
                    await cachePurchasedCredits(result.remainingCredits);
                    return true;
                } else {
                    return false;
                }
            }

            return true;
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
                await cachePurchasedCredits(result.newBalance);
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

    // Recover account - only restores PURCHASED credits
    const recoverAccount = async (code) => {
        try {
            const result = await CreditSyncService.recoverAccount(code);

            if (result.success) {
                setRecoveryCode(result.recoveryCode);
                setPurchasedCredits(result.credits);
                // DON'T restore free credits - keep local device value
                setNeedsRecovery(false);
                await cachePurchasedCredits(result.credits);
                return { success: true, message: result.message };
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
            remainingFree: freeCreditsRemaining,
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
