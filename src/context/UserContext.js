import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CreditSyncService from '../services/CreditSyncService';

const UserContext = createContext();

// Gemini API based suggested limits
const FREE_DAILY_LIMIT = 5; // Server manages this now, but keep for reference
const CREDIT_COSTS = {
    GENERATE_NOTES: 1,
    GENERATE_REPLY: 1,
    FOLLOW_UP: 1,
};

export const UserProvider = ({ children }) => {
    const [purchasedCredits, setPurchasedCredits] = useState(0);
    const [freeCreditsRemaining, setFreeCreditsRemaining] = useState(5);
    const [recoveryCode, setRecoveryCode] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);
    const [needsRecovery, setNeedsRecovery] = useState(false);

    // Initialize credit system on mount
    useEffect(() => {
        initializeCredits();
    }, []);

    const initializeCredits = async () => {
        try {
            setIsLoading(true);
            const result = await CreditSyncService.initializeCreditSystem();

            if (result.success !== false) {
                setRecoveryCode(result.recoveryCode);
                setPurchasedCredits(result.credits || 0);
                setFreeCreditsRemaining(result.freeCreditsRemaining || 5);
                setNeedsRecovery(result.needsRecovery || false);
                setIsOnline(true);
            } else {
                // Offline or server error - try to use cached values
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

    // Load cached credits for offline mode
    const loadCachedCredits = async () => {
        try {
            const cached = await AsyncStorage.getItem('@credits_cache');
            if (cached) {
                const data = JSON.parse(cached);
                setPurchasedCredits(data.credits || 0);
                setFreeCreditsRemaining(data.freeCreditsRemaining || 5);
            }
            const code = await CreditSyncService.getRecoveryCode();
            if (code) setRecoveryCode(code);
        } catch (error) {
            console.error('Failed to load cached credits:', error);
        }
    };

    // Cache credits locally for offline support
    const cacheCredits = async (credits, freeCredits) => {
        try {
            await AsyncStorage.setItem('@credits_cache', JSON.stringify({
                credits,
                freeCreditsRemaining: freeCredits,
                cachedAt: new Date().toISOString(),
            }));
        } catch (error) {
            console.error('Failed to cache credits:', error);
        }
    };

    // Sync balance from server
    const syncBalance = useCallback(async () => {
        try {
            const result = await CreditSyncService.getBalance();
            if (result.success) {
                setPurchasedCredits(result.credits);
                setFreeCreditsRemaining(result.freeCreditsRemaining);
                setIsOnline(true);
                await cacheCredits(result.credits, result.freeCreditsRemaining);
            }
            return result;
        } catch (error) {
            console.error('Sync balance error:', error);
            setIsOnline(false);
            return { success: false, error: error.message };
        }
    }, []);

    // Use credits - syncs with server
    const useCredits = async (cost = 1) => {
        try {
            const result = await CreditSyncService.useCredits(cost);

            if (result.success) {
                setPurchasedCredits(result.remainingCredits);
                setFreeCreditsRemaining(result.remainingFreeCredits);
                await cacheCredits(result.remainingCredits, result.remainingFreeCredits);
                return true;
            } else if (result.insufficientCredits) {
                return false;
            }
            return false;
        } catch (error) {
            console.error('Use credits error:', error);
            return false;
        }
    };

    // Add credits after purchase - with transaction ID for abuse prevention
    const addCredits = async (amount, transactionId) => {
        try {
            // Generate a transaction ID if not provided (for testing)
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

    // Recover account with recovery code
    const recoverAccount = async (code) => {
        try {
            const result = await CreditSyncService.recoverAccount(code);

            if (result.success) {
                setRecoveryCode(result.recoveryCode);
                setPurchasedCredits(result.credits);
                setFreeCreditsRemaining(result.freeCreditsRemaining);
                setNeedsRecovery(false);
                await cacheCredits(result.credits, result.freeCreditsRemaining);
                return { success: true, message: result.message };
            }
            return { success: false, error: result.error };
        } catch (error) {
            console.error('Recover account error:', error);
            return { success: false, error: error.message };
        }
    };

    // Check if user has enough credits
    const checkAvailability = (cost = 1) => {
        return (freeCreditsRemaining + purchasedCredits) >= cost;
    };

    // Get credit data for display
    const getCreditData = () => {
        return {
            remainingFree: freeCreditsRemaining,
            purchasedCredits,
            totalAvailable: freeCreditsRemaining + purchasedCredits,
            freeLimit: FREE_DAILY_LIMIT,
            isExhausted: (freeCreditsRemaining + purchasedCredits) <= 0,
            recoveryCode,
            isOnline,
            needsRecovery,
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
