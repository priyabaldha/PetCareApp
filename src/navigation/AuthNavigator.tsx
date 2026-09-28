import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors } from '../constants/theme';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import type { AuthStackParamList } from '../types/navigation';

interface AuthNavigatorProps {
  onDemoLogin: () => void;
}

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator({
  onDemoLogin,
}: AuthNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="Login">
        {(props) => (
          <LoginScreen
            {...props}
            onDemoLogin={onDemoLogin}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Signup" component={SignupScreen} />

      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
    </Stack.Navigator>
  );
}