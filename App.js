import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

import HomeScreen from './src/screens/HomeScreen';
import NotesScreen from './src/screens/NotesScreen';
import ReplyScreen from './src/screens/ReplyScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import CreditsScreen from './src/screens/CreditsScreen';
import IntroScreen from './src/screens/IntroScreen';
import WalkthroughScreen from './src/screens/WalkthroughScreen';
import FAQScreen from './src/screens/FAQScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { HistoryProvider } from './src/context/HistoryContext';
import { FoldersProvider } from './src/context/FoldersContext';
import { UserProvider, useUser } from './src/context/UserContext';
import AdService, { initializeAds as initAds } from './src/services/AdService';
import NotificationService from './src/services/NotificationService';
import AppContent from './src/components/AppContent';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { colors, isDark } = useTheme();

  React.useEffect(() => {
    initAds();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.glassBorder,
          paddingBottom: 30,
          paddingTop: 10,
          height: 90,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Notes') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Reply') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return (
            <View style={[
              styles.tabIconWrapper,
              focused && { backgroundColor: `${colors.primary}15` }
            ]}>
              <Ionicons name={iconName} size={24} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: 'Home',
        }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          headerTitle: 'Smart Notes',
        }}
      />
      <Tab.Screen
        name="Reply"
        component={ReplyScreen}
        options={{
          headerTitle: 'Smart Reply',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

function MainApp() {
  const { colors, isDark } = useTheme();
  const { hasSeenOnboarding, isOnboardingLoading } = useUser();

  const navTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.glassBorder,
      notification: colors.primary,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500',
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700',
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '800',
      },
    },
  };

  if (isOnboardingLoading) {
    return null; // or a Splash Screen component if needed
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={colors.statusBar} />
      <Stack.Navigator
        initialRouteName={hasSeenOnboarding ? "MainTabs" : "Intro"}
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 20,
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="Intro"
          component={IntroScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Walkthrough"
          component={WalkthroughScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FAQ"
          component={FAQScreen}
          options={{
            headerTitle: 'Help Center',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
          options={{
            headerTitle: 'Go Pro',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="Credits"
          component={CreditsScreen}
          options={({ navigation }) => ({
            headerTitle: 'Buy Credits & Subscriptions',
            presentation: 'modal',
            headerBackTitleVisible: false,
            headerLeft: () => (
              <TouchableOpacity
                style={{ paddingRight: 16 }}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="close-circle" size={28} color={colors.primary} />
              </TouchableOpacity>
            ),
          })}
        />
      </Stack.Navigator>
    </NavigationContainer >
  );
}

export default function App() {
  React.useEffect(() => {
    const setupApp = async () => {
      // Request ATT permission on iOS 14+ before showing ads
      if (Platform.OS === 'ios') {
        try {
          const { status } = await requestTrackingPermissionsAsync();
          console.log('ATT permission status:', status);
        } catch (e) {
          console.log('ATT request error:', e);
        }
      }

      // Initialize Ads after ATT prompt
      AdService.initializeAds();

      // Register for push notifications
      try {
        const pushToken = await NotificationService.registerForPushNotificationsAsync();
        if (pushToken) {
          await NotificationService.registerTokenWithServer(pushToken);
          console.log('✅ Push notifications registered');
        }
      } catch (e) {
        console.log('Push notification setup error:', e);
      }
    };

    setupApp();

    // Set up notification listeners
    const cleanup = NotificationService.addNotificationListeners(
      (notification) => {
        // Handle notification received while app is open
        console.log('Notification received:', notification);
      },
      (response) => {
        // Handle notification tap - can navigate to specific screen
        console.log('Notification tapped:', response);
      }
    );

    return cleanup;
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UserProvider>
          <FoldersProvider>
            <HistoryProvider>
              <AppContent>
                <MainApp />
              </AppContent>
            </HistoryProvider>
          </FoldersProvider>
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    width: 48,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
