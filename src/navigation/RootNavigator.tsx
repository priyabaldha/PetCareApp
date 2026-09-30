import { useState } from 'react';
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
            setLaunchStage('onboarding')
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
            onDemoLogin={() =>
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
              component={MainTabNavigator}
              options={{
                headerShown: false,
              }}
            />

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