import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext();

const CREDITS_STORAGE_KEY = '@user_credits';
const DAILY_LIMIT_KEY = '@daily_usage';

// Gemini API based suggested limits
const FREE_DAILY_LIMIT = 15;
const CREDIT_COSTS = {
    GENERATE_NOTES: 1,
    GENERATE_REPLY: 1,
    FOLLOW_UP: 1,
};

export const UserProvider = ({ children }) => {
    const [purchasedCredits, setPurchasedCredits] = useState(0);
    const [dailyUsage, setDailyUsage] = useState({ date: new Date().toDateString(), count: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const [savedCredits, savedUsage] = await Promise.all([
                AsyncStorage.getItem(CREDITS_STORAGE_KEY),
                AsyncStorage.getItem(DAILY_LIMIT_KEY),
            ]);

            if (savedCredits) setPurchasedCredits(parseInt(savedCredits));

            if (savedUsage) {
                const usage = JSON.parse(savedUsage);
                const today = new Date().toDateString();
                if (usage.date === today) {
                    setDailyUsage(usage);
                } else {
                    // Reset daily usage for a new day
                    const newUsage = { date: today, count: 0 };
                    setDailyUsage(newUsage);
                    await AsyncStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(newUsage));
                }
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const useCredits = async (cost = 1) => {
        const today = new Date().toDateString();
        let currentUsage = dailyUsage;

        // Reset if it's a new day
        if (currentUsage.date !== today) {
            currentUsage = { date: today, count: 0 };
        }

        const remainingFree = Math.max(0, FREE_DAILY_LIMIT - currentUsage.count);

        if (remainingFree >= cost) {
            // Use free daily limit
            const newUsage = { ...currentUsage, count: currentUsage.count + cost };
            setDailyUsage(newUsage);
            await AsyncStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(newUsage));
            return true;
        } else {
            // Use purchased credits
            const neededFromPurchased = cost - remainingFree; // Use whatever is left of free first (optional, but let's keep it simple: if free is exhausted, use purchased)

            // If free is exhausted
            if (purchasedCredits >= cost) {
                const newPurchased = purchasedCredits - cost;
                setPurchasedCredits(newPurchased);
                await AsyncStorage.setItem(CREDITS_STORAGE_KEY, newPurchased.toString());
                return true;
            }
        }
        return false; // Not enough credits
    };

    const addCredits = async (amount) => {
        const newTotal = purchasedCredits + amount;
        setPurchasedCredits(newTotal);
        await AsyncStorage.setItem(CREDITS_STORAGE_KEY, newTotal.toString());
    };

    const checkAvailability = (cost = 1) => {
        const today = new Date().toDateString();
        const usageCount = dailyUsage.date === today ? dailyUsage.count : 0;
        const remainingFree = Math.max(0, FREE_DAILY_LIMIT - usageCount);
        return (remainingFree + purchasedCredits) >= cost;
    };

    const getCreditData = () => {
        const today = new Date().toDateString();
        const usageCount = dailyUsage.date === today ? dailyUsage.count : 0;
        const remainingFree = Math.max(0, FREE_DAILY_LIMIT - usageCount);

        return {
            remainingFree,
            purchasedCredits,
            totalAvailable: remainingFree + purchasedCredits,
            freeLimit: FREE_DAILY_LIMIT,
            isExhausted: (remainingFree + purchasedCredits) <= 0
        };
    };

    return (
        <UserContext.Provider value={{
            purchasedCredits,
            dailyUsage,
            isLoading,
            useCredits,
            addCredits,
            checkAvailability,
            getCreditData,
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
