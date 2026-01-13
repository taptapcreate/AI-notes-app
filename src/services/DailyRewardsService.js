import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_REWARDS_KEY = '@daily_rewards_data';

// 5-day streak rewards configuration
export const STREAK_REWARDS = [
    { day: 1, credits: 1 },
    { day: 2, credits: 1 },
    { day: 3, credits: 2 },
    { day: 4, credits: 2 },
    { day: 5, credits: 4 }, // Bonus day
];

// Get the date string for comparison (YYYY-MM-DD format)
const getDateString = (date = new Date()) => {
    return date.toISOString().split('T')[0];
};

// Get yesterday's date string
const getYesterdayString = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getDateString(yesterday);
};

// Default rewards data structure
const getDefaultData = () => ({
    lastCheckInDate: null,
    currentStreak: 0,
    todayCheckedIn: false,
    totalCreditsEarned: 0,
    adsWatchedToday: 0,
});

// Load rewards data from storage
export const loadDailyRewardsData = async () => {
    try {
        const data = await AsyncStorage.getItem(DAILY_REWARDS_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            const today = getDateString();

            // Reset todayCheckedIn and adsWatchedToday if it's a new day
            if (parsed.lastCheckInDate !== today) {
                parsed.todayCheckedIn = false;
                parsed.adsWatchedToday = 0;
            }

            return parsed;
        }
        return getDefaultData();
    } catch (error) {
        console.error('Error loading daily rewards data:', error);
        return getDefaultData();
    }
};

// Save rewards data to storage
export const saveDailyRewardsData = async (data) => {
    try {
        await AsyncStorage.setItem(DAILY_REWARDS_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving daily rewards data:', error);
    }
};

// Check in and get credits for today
export const performDailyCheckIn = async () => {
    const data = await loadDailyRewardsData();
    const today = getDateString();
    const yesterday = getYesterdayString();

    // Already checked in today
    if (data.lastCheckInDate === today && data.todayCheckedIn) {
        return {
            success: false,
            message: 'Already claimed today!',
            credits: 0,
            newStreak: data.currentStreak,
            data,
        };
    }

    let newStreak;

    // Check if streak continues (last check-in was yesterday)
    if (data.lastCheckInDate === yesterday) {
        // Continue streak, cycle back after day 5
        newStreak = (data.currentStreak % 5) + 1;
    } else if (data.lastCheckInDate === today) {
        // Same day, keep current streak
        newStreak = data.currentStreak;
    } else {
        // Missed a day or first time, reset to day 1
        newStreak = 1;
    }

    // Get credits for current streak day
    const reward = STREAK_REWARDS.find(r => r.day === newStreak);
    const creditsEarned = reward ? reward.credits : 1;

    // Update data
    const updatedData = {
        ...data,
        lastCheckInDate: today,
        currentStreak: newStreak,
        todayCheckedIn: true,
        totalCreditsEarned: data.totalCreditsEarned + creditsEarned,
        adsWatchedToday: data.adsWatchedToday + 1,
    };

    await saveDailyRewardsData(updatedData);

    return {
        success: true,
        message: `You earned ${creditsEarned} credit${creditsEarned > 1 ? 's' : ''}!`,
        credits: creditsEarned,
        newStreak,
        isStreakBonus: newStreak === 5,
        data: updatedData,
    };
};

// Get streak status for UI display
export const getStreakStatus = async () => {
    const data = await loadDailyRewardsData();
    const today = getDateString();
    const yesterday = getYesterdayString();

    let displayStreak = data.currentStreak;
    let canClaimToday = !data.todayCheckedIn || data.lastCheckInDate !== today;

    // If last check-in wasn't today or yesterday, streak would reset
    if (data.lastCheckInDate !== today && data.lastCheckInDate !== yesterday) {
        displayStreak = 0; // Will start at 1 when they check in
    }

    // Calculate next streak day (what they'll get if they check in)
    let nextStreakDay;
    if (data.lastCheckInDate === yesterday) {
        nextStreakDay = (displayStreak % 5) + 1;
    } else if (data.lastCheckInDate === today) {
        nextStreakDay = displayStreak;
    } else {
        nextStreakDay = 1;
    }

    return {
        currentStreak: displayStreak,
        nextStreakDay,
        canClaimToday,
        todayCheckedIn: data.todayCheckedIn && data.lastCheckInDate === today,
        rewards: STREAK_REWARDS,
        adsWatchedToday: data.adsWatchedToday,
    };
};
