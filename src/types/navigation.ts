import type { NavigatorScreenParams } from '@react-navigation/native';

/* =========================================
   AUTH NAVIGATION
========================================= */

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

/* =========================================
   BOTTOM TAB NAVIGATION
========================================= */

export type MainTabParamList = {
  Home: undefined;
  MyPets: undefined;
  Community: undefined;
  Explore: undefined;
  Profile: undefined;
};

/* =========================================
   ROOT STACK NAVIGATION
========================================= */

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;

  Settings: undefined;

  PetProfile: {
    petId: string;
  };

  AddPet: undefined;

  EditPet: {
    petId: string;
  };

  Notifications: undefined;
};