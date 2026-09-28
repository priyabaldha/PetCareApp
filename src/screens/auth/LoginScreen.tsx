import { useState } from 'react';
import { Keyboard } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AuthLayout from '../../components/AuthLayout';
import type { AuthStackParamList } from '../../types/navigation';

type LoginScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Login'
> & {
  onDemoLogin: () => void;
};

export default function LoginScreen({
  navigation,
  onDemoLogin,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const emailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? ''
    : 'Enter a valid email address.';

  const passwordError =
    password.length > 0 ? '' : 'Enter a sample password.';

  function handleContinue() {
    setSubmitted(true);

    if (emailError || passwordError) {
      return;
    }

    Keyboard.dismiss();
    onDemoLogin();
  }

  return (
    <AuthLayout
      eyebrow="GOOD TO HAVE YOU HERE"
      title={'Welcome\nback.'}
      subtitle="A little closer to everything they need."
      formTitle="Your account"
      notice="Use sample details only. This screen does not verify your identity or send your password to a server."
    >
      <AppInput
        label="Email address"
        placeholder="priya@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={submitted ? emailError : undefined}
      />

      <AppInput
        label="Password"
        placeholder="Enter a sample password"
        value={password}
        onChangeText={setPassword}
        isPassword
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={handleContinue}
        error={submitted ? passwordError : undefined}
      />

      <AppButton
        title="Continue to demo"
        onPress={handleContinue}
      />

      <AppButton
        title="Forgot password?"
        variant="secondary"
        onPress={() => {
          Keyboard.dismiss();
          navigation.navigate('ForgotPassword');
        }}
      />

      <AppButton
        title="Create an account"
        variant="secondary"
        onPress={() => {
          Keyboard.dismiss();
          navigation.navigate('Signup');
        }}
      />
    </AuthLayout>
  );
}