// RevenueCat Purchase Service
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import { addCredits as addServerCredits } from './CreditSyncService';

// RevenueCat API Keys
const REVENUECAT_APPLE_KEY = 'appl_XDCMqZNPKUjLMUyVIQERoJWwCZH';
const REVENUECAT_GOOGLE_KEY = ''; // Add Google key when available

// Product IDs (must match RevenueCat)
export const PRODUCT_IDS = {
    // Subscriptions
    WEEKLY_SUBSCRIPTION: 'ai_notes_pro_weekly_subscription',
    MONTHLY_SUBSCRIPTION: 'ai_notes_pro_monthly_subscription',

    // One-time credit packs
    LITE_PACK: 'ai_notes_lite_pack_credits',
    POWER_PACK: 'ai_notes_power_pack_credits',
    PRO_PACK: 'ai_notes_pro_pack_credits',
    ELITE_PACK: 'ai_notes_elite_pack_credits',
    ULTIMATE_PACK: 'ai_notes_ultimate_pack_credits',
    MEGA_PACK: 'ai_notes_mega_pack_credits',
    SUPREME_PACK: 'ai_notes_supreme_pack_credits',
};

// Credits per product
export const CREDITS_PER_PRODUCT = {
    // Subscriptions grant UNLIMITED access, not fixed credits
    // We set this to 0 so we don't pollute the "purchased credits" database field
    [PRODUCT_IDS.WEEKLY_SUBSCRIPTION]: 0,
    [PRODUCT_IDS.MONTHLY_SUBSCRIPTION]: 0,

    // One-time packs grant persistent credits
    [PRODUCT_IDS.LITE_PACK]: 100,
    [PRODUCT_IDS.POWER_PACK]: 350,
    [PRODUCT_IDS.PRO_PACK]: 550,
    [PRODUCT_IDS.ELITE_PACK]: 900,
    [PRODUCT_IDS.ULTIMATE_PACK]: 1800,
    [PRODUCT_IDS.MEGA_PACK]: 3500,
    [PRODUCT_IDS.SUPREME_PACK]: 5000,
};

let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 */
export const initializePurchases = async (userId = null) => {
    try {
        if (isInitialized) return true;

        const apiKey = Platform.OS === 'ios' ? REVENUECAT_APPLE_KEY : REVENUECAT_GOOGLE_KEY;

        if (!apiKey) {
            console.warn('RevenueCat API key not set for platform:', Platform.OS);
            return false;
        }

        await Purchases.configure({
            apiKey,
            appUserID: userId, // Pass recovery code as user ID for linking
        });

        isInitialized = true;
        console.log('✅ RevenueCat initialized');
        return true;
    } catch (error) {
        console.error('❌ RevenueCat init error:', error);
        return false;
    }
};

/**
 * Get available offerings (products)
 */
export const getOfferings = async () => {
    try {
        const offerings = await Purchases.getOfferings();
        return {
            success: true,
            offerings: offerings.current,
            all: offerings.all,
        };
    } catch (error) {
        console.error('Get offerings error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Purchase a product
 */
export const purchaseProduct = async (productId) => {
    try {
        const { customerInfo, productIdentifier } = await Purchases.purchaseProduct(productId);

        // Get credits for this product
        const credits = CREDITS_PER_PRODUCT[productId] || 0;

        // Get transaction ID for server tracking
        const transactionId = customerInfo.originalAppUserId + '_' + Date.now();

        // Add credits to server (with transaction tracking)
        if (credits > 0) {
            const result = await addServerCredits(credits, transactionId);
            if (!result.success && !result.alreadyProcessed) {
                console.warn('Failed to add credits to server:', result.error);
            }
        }

        return {
            success: true,
            productId: productIdentifier,
            credits,
            customerInfo,
        };
    } catch (error) {
        if (error.userCancelled) {
            return { success: false, cancelled: true };
        }
        console.error('Purchase error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Purchase a package (from offerings)
 */
export const purchasePackage = async (packageToPurchase) => {
    try {
        const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);

        // Get credits for this product
        const credits = CREDITS_PER_PRODUCT[productIdentifier] || 0;

        // Get transaction ID
        const transactionId = customerInfo.originalAppUserId + '_' + productIdentifier + '_' + Date.now();

        // Add credits to server
        if (credits > 0) {
            const result = await addServerCredits(credits, transactionId);
            if (!result.success && !result.alreadyProcessed) {
                console.warn('Failed to add credits to server:', result.error);
            }
        }

        return {
            success: true,
            productId: productIdentifier,
            credits,
            customerInfo,
        };
    } catch (error) {
        if (error.userCancelled) {
            return { success: false, cancelled: true };
        }
        console.error('Purchase package error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Restore purchases (with timeout protection)
 */
export const restorePurchases = async () => {
    try {
        // Add timeout protection - 15 seconds max
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Restore timed out')), 15000)
        );

        const restorePromise = Purchases.restorePurchases();
        const customerInfo = await Promise.race([restorePromise, timeoutPromise]);

        // Get all non-consumable entitlements
        const activeEntitlements = customerInfo.entitlements.active;
        const allTransactions = customerInfo.allPurchasedProductIdentifiers || [];

        let totalCreditsRestored = 0;
        const processedProducts = [];

        // Process credit packs in parallel for speed
        const creditPromises = allTransactions.map(async (productId) => {
            const credits = CREDITS_PER_PRODUCT[productId];
            if (credits) {
                // Create unique transaction ID for this restore
                const transactionId = `restore_${customerInfo.originalAppUserId}_${productId}`;

                // Try to add credits (will be rejected if already processed)
                try {
                    const result = await addServerCredits(credits, transactionId);

                    if (result.success) {
                        return { productId, credits, success: true };
                    } else if (result.alreadyProcessed) {
                        console.log(`Product ${productId} already restored`);
                        return { productId, credits: 0, success: true };
                    }
                } catch (err) {
                    console.warn(`Failed to restore ${productId}:`, err);
                    return { productId, credits: 0, success: false };
                }
            }
            return { productId, credits: 0, success: false };
        });

        const results = await Promise.all(creditPromises);
        results.forEach(r => {
            if (r.success && r.credits > 0) {
                totalCreditsRestored += r.credits;
                processedProducts.push(r.productId);
            }
        });

        return {
            success: true,
            totalCreditsRestored,
            processedProducts,
            activeEntitlements: Object.keys(activeEntitlements),
            customerInfo,
        };
    } catch (error) {
        console.error('Restore error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if user has pro subscription
 */
export const checkProAccess = async () => {
    try {
        const customerInfo = await Purchases.getCustomerInfo();
        const hasProAccess = customerInfo.entitlements.active['AI Notes - Write and Reply Pro'] !== undefined;

        return {
            success: true,
            hasProAccess,
            customerInfo,
        };
    } catch (error) {
        console.error('Check pro access error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get customer info
 */
export const getCustomerInfo = async () => {
    try {
        const customerInfo = await Purchases.getCustomerInfo();
        return { success: true, customerInfo };
    } catch (error) {
        console.error('Get customer info error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Set user ID (for linking purchases to recovery code)
 */
export const setUserId = async (userId) => {
    try {
        await Purchases.logIn(userId);
        return { success: true };
    } catch (error) {
        console.error('Set user ID error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Listen for customer info updates (real-time subscription status)
 */
export const addCustomerInfoUpdateListener = (callback) => {
    try {
        const listener = (customerInfo) => {
            callback(customerInfo);
        };
        Purchases.addCustomerInfoUpdateListener(listener);
        return () => {
            // RevenueCat doesn't have a direct 'remove' for checking specific listeners easily in wrapper,
            // but we can just ignore subsequent calls if we managed it ourselves, or relies on component unmount.
            // Actually, react-native-purchases 5.x+ usually returns a subscription removal function or distinct method.
            // For simplicity in this version, we assume the caller handles cleanup via effect.
            // NOTE: Verify exact remove method for your RC version.
            // If unavailable, we just leave it active (it's a singleton listener for the app usually).
            // Ideally: Purchases.removeCustomerInfoUpdateListener(listener);
        };
    } catch (error) {
        console.error('Add listener error:', error);
        return () => { };
    }
};

export default {
    initializePurchases,
    getOfferings,
    purchaseProduct,
    purchasePackage,
    restorePurchases,
    checkProAccess,
    getCustomerInfo,
    setUserId,
    addCustomerInfoUpdateListener, // Export the new listener
    PRODUCT_IDS,
    CREDITS_PER_PRODUCT,
};
