import { useState } from 'react';
import { Alert, Keyboard } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AuthLayout from '../../components/AuthLayout';
import type { AuthStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  'ForgotPassword'
>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const emailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? ''
    : 'Enter a valid email address.';

  function handleReset() {
    setSubmitted(true);

    if (emailError) {
      return;
    }

    Keyboard.dismiss();

    Alert.alert(
      'Reset preview complete',
      'The email format is valid. No reset email was sent; this feature will be connected to the backend later.',
    );
  }

  return (
    <AuthLayout
      eyebrow="LET’S HELP YOU BACK IN"
      title={'Forgot your\npassword?'}
      subtitle="Start with the email address associated with your account."
      formTitle="Password recovery"
      notice="This preview validates the email field only. Email delivery is not connected yet."
    >
      <AppInput
        label="Email address"
        placeholder="priya@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={handleReset}
        error={submitted ? emailError : undefined}
      />

      <AppButton
        title="Preview password reset"
        onPress={handleReset}
      />

      <AppButton
        title="Back to login"
        variant="secondary"
        onPress={() => navigation.goBack()}
      />
    </AuthLayout>
  );
}