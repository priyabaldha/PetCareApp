import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, Text, View } from 'react-native';
import { restoreSession, subscribeToSessionExpired } from '../services/auth';
import { StatusBar } from 'expo-status-bar';
import {
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors } from '../constants/theme';

import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import SplashScreen from '../screens/onboarding/SplashScreen';

import AddPetScreen from '../screens/pets/AddPetScreen';
import EditPetScreen from '../screens/pets/EditPetScreen';
import PetProfileScreen from '../screens/pets/PetProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

import type { RootStackParamList } from '../types/navigation';

import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';

const Stack =
  createNativeStackNavigator<RootStackParamList>();

type LaunchStage =
  | 'splash'
  | 'onboarding'
  | 'auth'
  | 'main';

const navigationTheme: Theme = {
  ...DefaultTheme,

  colors: {
    ...DefaultTheme.colors,

    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

export default function RootNavigator() {
  const [launchStage, setLaunchStage] =
    useState<LaunchStage>('splash');
  const [splashDone, setSplashDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [retry, setRetry] = useState(0);
  const handleLoggedOut = useCallback(() => setLaunchStage('auth'), []);
  useEffect(() => subscribeToSessionExpired(handleLoggedOut), [handleLoggedOut]);

  useEffect(() => {
    let active = true;
    setSessionReady(false);
    setSessionError('');
    restoreSession().then((valid) => {
      if (!active) return;
      setHasSession(valid);
      setSessionReady(true);
    }).catch((error: unknown) => {
      if (active) setSessionError(error instanceof Error ? error.message : 'Could not check your session.');
    });
    return () => { active = false; };
  }, [retry]);

  useEffect(() => {
    if (splashDone && sessionReady) {
      setLaunchStage((current) => current === 'splash'
        ? (hasSession ? 'main' : 'onboarding') : current);
    }
  }, [splashDone, sessionReady, hasSession]);

  if (launchStage === 'splash' && splashDone) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, backgroundColor: colors.background }}>
        <StatusBar style="dark" />
        {sessionError ? (
          <>
            <Text style={{ color: colors.text, textAlign: 'center', marginBottom: 16 }}>{sessionError}</Text>
            <Button title="Retry connection" onPress={() => setRetry((value) => value + 1)} />
            <Button title="Go to sign in" onPress={() => setLaunchStage('auth')} />
          </>
        ) : <ActivityIndicator color={colors.primary} size="large" />}
      </View>
    );
  }


  /* ==========================================
     SPLASH SCREEN
     
     SplashScreen itself controls the animation.
     
     When the animation + 5 second final hold
     are completed, it calls onComplete().
     
     Then we move to onboarding.
  ========================================== */

  if (launchStage === 'splash') {
    return (
      <>
        <StatusBar style="dark" />

        <SplashScreen
          onComplete={() =>
            setSplashDone(true)
          }
        />
      </>
    );
  }

  /* ==========================================
     ONBOARDING
  ========================================== */

  if (launchStage === 'onboarding') {
    return (
      <>
        <StatusBar style="dark" />

        <OnboardingScreen
          onComplete={() =>
            setLaunchStage('auth')
          }
        />
      </>
    );
  }

  /* ==========================================
     AUTH / MAIN
  ========================================== */

  return (
    <>
      <StatusBar style="dark" />

      <NavigationContainer
        theme={navigationTheme}
      >
        {launchStage === 'auth' ? (
          <AuthNavigator
            onLoginSuccess={() =>
              setLaunchStage('main')
            }
          />
        ) : (
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor:
                  colors.background,
              },

              headerTintColor:
                colors.forest,

              headerShadowVisible: false,

              contentStyle: {
                backgroundColor:
                  colors.background,
              },
            }}
          >
            <Stack.Screen
              name="MainTabs"
              options={{
                headerShown: false,
              }}
            >
              {() => <MainTabNavigator onLoggedOut={handleLoggedOut} />}
            </Stack.Screen>

            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                title: 'Settings',
              }}
            />

            <Stack.Screen
              name="PetProfile"
              component={PetProfileScreen}
              options={{
                title: 'Pet profile',
              }}
            />

            <Stack.Screen
              name="AddPet"
              component={AddPetScreen}
              options={{
                title: 'Add a pet',
              }}
            />

            <Stack.Screen
              name="EditPet"
              component={EditPetScreen}
              options={{
                title: 'Edit pet',
              }}
            />

            <Stack.Screen
  name="Notifications"
  component={NotificationsScreen}
  options={{ headerShown: false }}
/>

          </Stack.Navigator>
        )}
      </NavigationContainer>
    </>
  );
}