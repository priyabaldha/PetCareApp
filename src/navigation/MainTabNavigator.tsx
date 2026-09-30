import React from 'react';
import {
  StyleSheet,
  View,
  Text,
} from 'react-native';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/home/HomeScreen';
import MyPetsScreen from '../screens/pets/MyPetsScreen';
import CommunityScreen from '../screens/community/CommunityScreen';
import ExploreScreen from '../screens/explore/ExploreScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

import { colors } from '../constants/theme';

import type { MainTabParamList } from '../types/navigation';

const Tab =
  createBottomTabNavigator<MainTabParamList>();

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  focused,
  icon,
  label,
}: {
  focused: boolean;
  icon: IconName;
  label: string;
}) {
  return (
    <View style={styles.tabItem}>
      <View
        style={[
          styles.iconContainer,
          focused && styles.activeIconContainer,
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
          color={
            focused
              ? '#FFFFFF'
              : '#85827B'
          }
        />
      </View>

      <Text
        style={[
          styles.tabLabel,
          focused && styles.activeTabLabel,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,

        tabBarShowLabel: false,

        tabBarStyle: styles.tabBar,

        tabBarItemStyle: styles.tabBarItem,

        tabBarHideOnKeyboard: true,

        animation: 'shift',

        sceneStyle: {
          backgroundColor: '#F9F7F2',
        },
      }}
    >

      {/* =====================================
          HOME
      ===================================== */}

      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={
                focused
                  ? 'home'
                  : 'home-outline'
              }
              label="Home"
            />
          ),
        }}
      />

      {/* =====================================
          MY PETS
      ===================================== */}

      <Tab.Screen
        name="MyPets"
        component={MyPetsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={
                focused
                  ? 'paw'
                  : 'paw-outline'
              }
              label="My Pets"
            />
          ),
        }}
      />

      {/* =====================================
          COMMUNITY
      ===================================== */}

      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={
                focused
                  ? 'people'
                  : 'people-outline'
              }
              label="Community"
            />
          ),
        }}
      />

      {/* =====================================
          EXPLORE
      ===================================== */}

      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={
                focused
                  ? 'compass'
                  : 'compass-outline'
              }
              label="Explore"
            />
          ),
        }}
      />

      {/* =====================================
          PROFILE
      ===================================== */}

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={
                focused
                  ? 'person'
                  : 'person-outline'
              }
              label="Profile"
            />
          ),
        }}
      />

    </Tab.Navigator>
  );
}

/* =========================================
   STYLES
========================================= */

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',

    left: 12,
    right: 12,
    bottom: 12,

    height: 72,

    borderRadius: 24,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#ECE8E0',

    shadowColor: '#20352F',
    shadowOpacity: 0.10,
    shadowRadius: 18,

    shadowOffset: {
      width: 0,
      height: 7,
    },

    elevation: 12,

    paddingHorizontal: 5,

    borderTopWidth: 1,
  },

  tabBarItem: {
    height: 70,
    paddingTop: 7,
  },

  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',

    minWidth: 58,
  },

  iconContainer: {
    width: 38,
    height: 34,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 2,
  },

  activeIconContainer: {
    backgroundColor: '#67539B',

    width: 40,
    height: 35,

    borderRadius: 13,
  },

  tabLabel: {
    fontSize: 9,

    color: '#85827B',

    fontWeight: '700',

    marginTop: 2,
  },

  activeTabLabel: {
    color: '#67539B',

    fontWeight: '900',
  },
});