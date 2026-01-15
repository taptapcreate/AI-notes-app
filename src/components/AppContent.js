/**
 * App Content Wrapper
 * Handles recovery modal display and app-level functionality
 */

import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import RecoveryModal from './RecoveryModal';
import LoadingScreen from '../screens/LoadingScreen';
import UpdateModal from './UpdateModal';

const RECOVERY_SHOWN_KEY = '@recovery_modal_shown';

const AppContent = ({ children }) => {
    const [showRecoveryModal, setShowRecoveryModal] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const { recoverAccount, recoveryCode, isLoading, purchasedCredits } = useUser();
    const { colors } = useTheme();

    useEffect(() => {
        checkFirstLaunch();
    }, [isLoading]);

    const checkFirstLaunch = async () => {
        // Wait for user context to load
        if (isLoading) return;

        try {
            const hasShown = await AsyncStorage.getItem(RECOVERY_SHOWN_KEY);

            // Show modal if never shown before (Fresh Install)
            if (!hasShown) {
                setShowRecoveryModal(true);
            }
        } catch (error) {
            console.log('Error checking first launch:', error);
        }
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
