import { useState } from 'react';
import { Alert, Keyboard } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AuthLayout from '../../components/AuthLayout';
import type { AuthStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    name: name.trim() ? '' : 'Enter your name.',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? ''
      : 'Enter a valid email address.',
    password: password.length >= 8
      ? ''
      : 'Use at least 8 characters.',
    confirmPassword: !confirmPassword
      ? 'Confirm your password.'
      : confirmPassword !== password
        ? 'Passwords do not match.'
        : '',
  };

  function handleSignup() {
    setSubmitted(true);

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    Keyboard.dismiss();

    Alert.alert(
      'Signup preview complete',
      'Your details passed validation. No account has been created yet.',
      [
        {
          text: 'Back to login',
          onPress: () => navigation.popToTop(),
        },
      ],
    );
  }

  return (
    <AuthLayout
      eyebrow="A NEW CHAPTER OF CARE"
      title={'More love.\nStarts here.'}
      subtitle="A space for you and every pet you call family."
      formTitle="Pet owner signup"
      notice="Use sample details. Account creation and secure storage will be connected during backend setup."
    >
      <AppInput
        label="Full name"
        placeholder="Your name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        error={submitted ? errors.name : undefined}
      />

      <AppInput
        label="Email address"
        placeholder="priya@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={submitted ? errors.email : undefined}
      />

      <AppInput
        label="Password"
        placeholder="At least 8 characters"
        value={password}
        onChangeText={setPassword}
        isPassword
        autoCapitalize="none"
        autoCorrect={false}
        error={submitted ? errors.password : undefined}
      />

      <AppInput
        label="Confirm password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        isPassword
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={handleSignup}
        error={submitted ? errors.confirmPassword : undefined}
      />

      <AppButton
        title="Preview signup"
        onPress={handleSignup}
      />

      <AppButton
        title="Back to login"
        variant="secondary"
        onPress={() => navigation.goBack()}
      />
    </AuthLayout>
  );
}