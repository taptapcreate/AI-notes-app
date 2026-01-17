/**
 * App Content Wrapper
 * Handles recovery modal display and app-level functionality
 */

import React, { useState, useEffect } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { showAppOpenAd, areAdsEnabled } from '../services/AdService';
import RecoveryModal from './RecoveryModal';
import LoadingScreen from '../screens/LoadingScreen';
import UpdateModal from './UpdateModal';

const RECOVERY_SHOWN_KEY = '@recovery_modal_shown';

const AppContent = ({ children }) => {
    const [showRecoveryModal, setShowRecoveryModal] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const { recoverAccount, recoveryCode, isLoading, purchasedCredits, hasSeenOnboarding, hasProSubscription, checkSubscriptionStatus } = useUser();
    const { colors } = useTheme();

    // Use ref to access latest pro status inside listener without re-binding
    const hasProRef = React.useRef(hasProSubscription);

    useEffect(() => {
        hasProRef.current = hasProSubscription;
    }, [hasProSubscription]);

    useEffect(() => {
        checkFirstLaunch();
    }, [isLoading]);

    // App Open Ad & Subscription Check Logic
    useEffect(() => {
        let lastBackground = 0;

        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (nextAppState === 'background') {
                lastBackground = Date.now();
            } else if (nextAppState === 'active') {
                // Ensure UserContext is fully loaded
                if (isLoading) {
                    console.log('⏳ App Resumed: Waiting for UserContext to load...');
                    return;
                }

                // 1. RE-VERIFY SUBSCRIPTION (Important for Expiration Alert)
                // We await this to ensure we don't show an ad if the user is PRO, 
                // and to avoid conflicting native UI calls (Alert vs Ad).
                console.log('🔄 App Resumed: Checking subscription status...');

                let isPro = hasProRef.current; // Default to current known state

                if (checkSubscriptionStatus) {
                    try {
                        // EDGE CASE: Race with timeout (3s) to prevent blocking on slow networks
                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Subscription check timed out')), 3000)
                        );

                        // Wait for check or timeout
                        const status = await Promise.race([checkSubscriptionStatus(), timeoutPromise]);

                        // Check logic returns null on internal error/unknown state
                        if (status && typeof status.hasProAccess === 'boolean') {
                            isPro = status.hasProAccess;
                        }
                    } catch (e) {
                        console.log('⚠️ Resume check skipped/failed:', e.message);
                        // Fallback: Proceed with last known valid state (isPro = hasProRef.current)
                    }
                }

                // 2. CHECK PRO STATUS: Don't show ads if user is pro (using fresh result)
                if (isPro) {
                    console.log('👑 User is PRO - Skipping App Open Ad');
                    return;
                }

                if (!areAdsEnabled) return;

                // Only show app open ad if user was away for more than 30 seconds
                const timeSinceBackground = Date.now() - lastBackground;
                if (lastBackground > 0 && timeSinceBackground > 30000) {
                    console.log('🚀 Showing app open ad after returning from background');
                    showAppOpenAd();
                }
            }
        });

        return () => {
            subscription.remove();
        };
    }, []); // Run once on mount! (checkSubscriptionStatus should be stable or ignored as prop dependency if we want true run-once, but putting it in dep array is also fine if it's stable)

    const checkFirstLaunch = () => {
        // Wait for user context to load
        if (isLoading) return;

        // Defer check to allow app to render and animations to finish
        // This prevents the modal from blocking startup or appearing before the UI is ready
        setTimeout(async () => {
            try {
                // DON'T show if onboarding is not finished yet
                // We want to show this only on the main screen (MainTabs)
                if (!hasSeenOnboarding) return;

                const hasShown = await AsyncStorage.getItem(RECOVERY_SHOWN_KEY);

                // Show modal if never shown before (Fresh Install)
                if (!hasShown) {
                    setShowRecoveryModal(true);
                }
            } catch (error) {
                console.log('Error checking first launch:', error);
            }
        }, 2500);
    };

    const handleClose = async () => {
        setShowRecoveryModal(false);
        // Mark as shown so it doesn't appear again
        await AsyncStorage.setItem(RECOVERY_SHOWN_KEY, 'true');
    };

    const handleRestorePurchases = async () => {
        setIsRestoring(true);
        try {
            // Dynamic import to avoid circular deps
            const { restorePurchases } = await import('../services/AdvancedSubscriptionManager');
            const result = await restorePurchases();
            return result;
        } catch (error) {
            console.error('Restore purchases error:', error);
            throw error;
        } finally {
            setIsRestoring(false);
        }
    };

    const handleRecoverCode = async (code) => {
        return await recoverAccount(code);
    };

    // Show Loading Screen while initializing
    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <>
            {children}
            <RecoveryModal
                visible={showRecoveryModal}
                onClose={handleClose}
                onRestorePurchases={handleRestorePurchases}
                onRecoverCode={handleRecoverCode}
                colors={colors}
                isRestoring={isRestoring}
                currentCredits={purchasedCredits || 0}
                currentRecoveryCode={recoveryCode}
            />
            <UpdateModal />
        </>
    );
};

export default AppContent;
