// Credit Sync Service - Server-based credit management with recovery codes
import * as SecureStore from 'expo-secure-store';

// Production API URL
const API_BASE_URL = 'https://ai-notes-app-backend-h9r0.onrender.com/api';

// SecureStore keys
const RECOVERY_CODE_KEY = 'user_recovery_code';
const CREDITS_CACHE_KEY = 'credits_cache';

/**
 * Get stored recovery code from SecureStore
 */
export const getRecoveryCode = async () => {
    try {
        const code = await SecureStore.getItemAsync(RECOVERY_CODE_KEY);
        return code;
    } catch (error) {
        console.error('Error getting recovery code:', error);
        return null;
    }
};

/**
 * Store recovery code in SecureStore (survives app deletion on iOS)
 */
export const setRecoveryCode = async (code) => {
    try {
        await SecureStore.setItemAsync(RECOVERY_CODE_KEY, code);
        return true;
    } catch (error) {
        console.error('Error storing recovery code:', error);
        return false;
    }
};

/**
 * Delete recovery code (for testing/logout)
 */
export const clearRecoveryCode = async () => {
    try {
        await SecureStore.deleteItemAsync(RECOVERY_CODE_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing recovery code:', error);
        return false;
    }
};

/**
 * Register new user and get recovery code
 */
export const registerUser = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/credits/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error('Failed to register user');
        }

        const data = await response.json();

        // Store recovery code securely
        await setRecoveryCode(data.recoveryCode);

        return {
            success: true,
            recoveryCode: data.recoveryCode,
            credits: data.credits,
            freeCreditsRemaining: data.freeCreditsRemaining,
        };
    } catch (error) {
        console.error('Register error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get credit balance from server
 */
export const getBalance = async () => {
    try {
        const code = await getRecoveryCode();
        if (!code) {
            return { success: false, error: 'No recovery code found' };
        }

        const response = await fetch(`${API_BASE_URL}/credits/balance/${code}`);

        if (!response.ok) {
            if (response.status === 404) {
                return { success: false, error: 'User not found', needsRecovery: true };
            }
            throw new Error('Failed to get balance');
        }

        const data = await response.json();

        return {
            success: true,
            credits: data.credits,
            freeCreditsRemaining: data.freeCreditsRemaining,
            totalAvailable: data.totalAvailable,
        };
    } catch (error) {
        console.error('Balance error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Add credits after purchase (with transaction ID for abuse prevention)
 */
export const addCredits = async (credits, transactionId) => {
    try {
        const code = await getRecoveryCode();
        if (!code) {
            return { success: false, error: 'No recovery code found' };
        }

        const response = await fetch(`${API_BASE_URL}/credits/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, credits, transactionId }),
        });

        if (!response.ok) {
            throw new Error('Failed to add credits');
        }

        const data = await response.json();

        if (data.alreadyProcessed) {
            return {
                success: false,
                alreadyProcessed: true,
                message: 'This purchase was already processed',
                credits: data.credits,
            };
        }

        return {
            success: true,
            creditsAdded: data.creditsAdded,
            newBalance: data.newBalance,
        };
    } catch (error) {
        console.error('Add credits error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Use credits (deduct from server)
 */
export const useCredits = async (amount) => {
    try {
        const code = await getRecoveryCode();
        if (!code) {
            return { success: false, error: 'No recovery code found' };
        }

        const response = await fetch(`${API_BASE_URL}/credits/use`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, amount }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.error === 'Insufficient credits') {
                return {
                    success: false,
                    insufficientCredits: true,
                    available: errorData.available,
                    required: errorData.required,
                };
            }
            throw new Error(errorData.error || 'Failed to use credits');
        }

        const data = await response.json();

        return {
            success: true,
            creditsUsed: data.creditsUsed,
            remainingCredits: data.remainingCredits,
            remainingFreeCredits: data.remainingFreeCredits,
            totalAvailable: data.totalAvailable,
        };
    } catch (error) {
        console.error('Use credits error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Recover account with recovery code (for new device)
 */
export const recoverAccount = async (recoveryCode) => {
    try {
        const response = await fetch(`${API_BASE_URL}/credits/recover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: recoveryCode }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.message || 'Invalid recovery code',
            };
        }

        const data = await response.json();

        // Store the recovery code locally
        await setRecoveryCode(data.recoveryCode);

        return {
            success: true,
            recoveryCode: data.recoveryCode,
            credits: data.credits,
            freeCreditsRemaining: data.freeCreditsRemaining,
            totalAvailable: data.totalAvailable,
            message: data.message,
        };
    } catch (error) {
        console.error('Recover error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Initialize credit system - register if new, or sync if existing
 */
export const initializeCreditSystem = async () => {
    try {
        const existingCode = await getRecoveryCode();

        if (existingCode) {
            // User exists, get balance
            const balance = await getBalance();
            if (balance.success) {
                return {
                    isNewUser: false,
                    recoveryCode: existingCode,
                    ...balance,
                };
            } else if (balance.needsRecovery) {
                // Code exists but user not found on server - needs recovery
                return {
                    isNewUser: false,
                    needsRecovery: true,
                    recoveryCode: existingCode,
                };
            }
        }

        // New user - register
        const result = await registerUser();
        if (result.success) {
            return {
                isNewUser: true,
                recoveryCode: result.recoveryCode,
                credits: result.credits,
                freeCreditsRemaining: result.freeCreditsRemaining,
                totalAvailable: result.credits + result.freeCreditsRemaining,
            };
        }

        return { success: false, error: result.error };
    } catch (error) {
        console.error('Initialize error:', error);
        return { success: false, error: error.message };
    }
};

export default {
    getRecoveryCode,
    setRecoveryCode,
    clearRecoveryCode,
    registerUser,
    getBalance,
    addCredits,
    useCredits,
    recoverAccount,
    initializeCreditSystem,
};
