import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { login } from '../../services/auth';
import AppInput from '../../components/AppInput';
import type { AuthStackParamList } from '../../types/navigation';

type LoginScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Login'
> & {
  onLoginSuccess: () => void;
};

const COLORS = {
  background: '#F7FBF9',
  white: '#FFFFFF',

  forest: '#123C35',
  primary: '#45B978',
  primaryDark: '#319C63',

  text: '#173C35',
  muted: '#758681',

  border: '#E2ECE8',
  inputBg: '#FBFDFC',

  softGreen: '#EAF8F0',
};

export default function LoginScreen({
  navigation,
  onLoginSuccess,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const busy = useRef(false);

  const emailError =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? ''
      : 'Enter a valid email address.';

  const passwordError =
    password.length > 0 ? '' : 'Enter your password.';

  async function handleContinue(): Promise<void> {
    if (busy.current) return;
    setSubmitted(true);
    if (emailError || passwordError) return;
    Keyboard.dismiss();
    busy.current = true;
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Unable to sign in', error instanceof Error ? error.message : 'Please try again.');
      return;
    } finally {
      busy.current = false;
      setIsLoading(false);
    }
    setPassword('');
    onLoginSuccess();
  }

  function handleGoogleLogin() {
    Keyboard.dismiss();
    Alert.alert('Google sign-in', 'Google sign-in is not connected yet. Use your email and password.');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>

          {/* JEEVA LOGO */}
          <View style={styles.topLogoContainer}>
            
          </View>

          {/* HERO */}
          <View style={styles.heroCard}>
            <View style={styles.circleOne} />
            <View style={styles.circleTwo} />

            <View style={styles.heroLogoContainer}>
              <Image
                source={require('../../../assets/jeeva.png')}
                style={styles.heroLogo}
                resizeMode="contain"
                accessibilityLabel="JEEVA logo"
              />
            </View>

            <Text style={styles.heroEyebrow}>
              WELCOME BACK
            </Text>

            <Text style={styles.heroTitle}>
              Good to see you again.
            </Text>

            <Text style={styles.heroSubtitle}>
              Everything they need, right where you need it.
            </Text>
          </View>

          {/* LOGIN CARD */}
          <View style={styles.loginCard}>

            {/* TITLE */}
            <View style={styles.headingRow}>
              <View>
                <Text style={styles.loginTitle}>
                  Sign in
                </Text>

                <Text style={styles.loginSubtitle}>
                  Continue your JEEVA journey.
                </Text>
              </View>

              <View style={styles.pawBadge}>
                <Ionicons
                  name="paw"
                  size={18}
                  color={COLORS.primary}
                />
              </View>
            </View>

            {/* EMAIL */}
            <View style={styles.inputSection}>
              <AppInput
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={
                  submitted
                    ? emailError
                    : undefined
                }
              />
            </View>

            {/* PASSWORD */}
            <View style={styles.passwordContainer}>

              <AppInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                isPassword={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                error={
                  submitted
                    ? passwordError
                    : undefined
                }
              />
            </View>

              {/* EYE BUTTON
              <Pressable
                style={styles.eyeButton}
                onPress={() => {
                  setShowPassword((current) => !current);
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                <Ionicons
                  name={
                    showPassword
                      ? 'eye-outline'
                      : 'eye-off-outline'
                  }
                  size={21}
                  color={COLORS.muted}
                />
              </Pressable> */}


            {/* FORGOT PASSWORD */}
            <Pressable
              style={styles.forgotButton}
              onPress={() => {
                Keyboard.dismiss();
                navigation.navigate('ForgotPassword');
              }}
            >
              <Text style={styles.forgotText}>
                Forgot password?
              </Text>
            </Pressable>

            {/* CONTINUE */}
            <Pressable
              style={({ pressed }) => [
                styles.continueButton,
                pressed && styles.pressed,
              ]}
              disabled={isLoading}
              accessibilityState={{ disabled: isLoading, busy: isLoading }}
              onPress={handleContinue}
              accessibilityRole="button"
            >
              <Text style={styles.continueText}>
                {isLoading ? 'Signing in...' : 'Continue'}
              </Text>

              <View style={styles.arrowCircle}>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={COLORS.forest}
                />
              </View>
            </Pressable>

            {/* DIVIDER */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />

              <Text style={styles.dividerText}>
                OR
              </Text>

              <View style={styles.divider} />
            </View>

            {/* GOOGLE */}
            <Pressable
              style={({ pressed }) => [
                styles.googleButton,
                pressed && styles.pressed,
              ]}
              disabled={isLoading}
              onPress={handleGoogleLogin}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
            >
              <View style={styles.googleIconContainer}>
                <Image
                  source={require('../../../assets/images/google-logo.png')}
                  style={styles.googleG}
                  resizeMode="contain"
                  accessibilityLabel="Google logo"
                />
              </View>

              <Text style={styles.googleText}>
                Continue with Google
              </Text>
            </Pressable>

            {/* REGISTER */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>
                Don't have an account?
              </Text>

              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  navigation.navigate('Signup');
                }}
              >
                <Text style={styles.signupLink}>
                  Register
                </Text>
              </Pressable>
            </View>
          </View>

          {/* PRIVACY */}
          <View style={styles.privacyRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={COLORS.primary}
            />

            <Text style={styles.privacyText}>
              Your information is safe and private.
            </Text>
          </View>

          {/* FOOTER */}
          <Text style={styles.footer}>
            Every life. Better care.
          </Text>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },

  /* LOGO */

  topLogoContainer: {
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },

  topLogo: {
    width: 120,
    height: 45,
  },

  /* HERO */

  heroCard: {
    height: 160,
    borderRadius: 25,
    backgroundColor: COLORS.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
    paddingHorizontal: 18,
  },

  circleOne: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#D3EADD',
    opacity: 0.32,
    top: -95,
    right: -35,
  },

  circleTwo: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8DD8B0',
    opacity: 0.13,
    bottom: -60,
    left: -30,
  },

  heroLogoContainer: {
    width: 80,
    height: 80,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    shadowColor: COLORS.forest,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },

  heroLogo: {
    width: 75,
    height: 75,
  },

  heroEyebrow: {
    color: COLORS.primaryDark,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 2,
  },

  heroTitle: {
    color: COLORS.forest,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    letterSpacing: -0.6,
    textAlign: 'center',
  },

  heroSubtitle: {
    color: COLORS.muted,
    fontSize: 10.5,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 2,
  },

  /* LOGIN CARD */

  loginCard: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.forest,
    shadowOpacity: 0.045,
    shadowRadius: 16,
    elevation: 2,
  },

  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  loginTitle: {
    color: COLORS.forest,
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  loginSubtitle: {
    color: COLORS.muted,
    fontSize: 11.5,
    marginTop: 2,
  },

  pawBadge: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: COLORS.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputSection: {
    marginBottom: 6,
  },

  /* PASSWORD */

  passwordContainer: {
    position: 'relative',
  },

  eyeButton: {
    position: 'absolute',
    right: 13,
    top: 38,
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },

  /* FORGOT */

  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 7,
    marginBottom: 11,
    marginRight: 10,
  },

  forgotText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },

  /* CONTINUE */

  continueButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.forest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 18,
    paddingRight: 6,
  },

  continueText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },

  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  /* DIVIDER */

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  dividerText: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginHorizontal: 9,
  },

  /* GOOGLE */

  googleButton: {
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  googleIconContainer: {
    position: 'absolute',
    left: 15,
    width: 27,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },

  googleG: {
    width: 26,
    height: 26,
  },

  googleText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },

  /* REGISTER */

  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },

  signupText: {
    color: COLORS.muted,
    fontSize: 14,
  },

  signupLink: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 4,
  },

  /* PRIVACY */

  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 13,
  },

  privacyText: {
    color: COLORS.muted,
    fontSize: 9.5,
    marginLeft: 5,
  },

  /* FOOTER */

  footer: {
    color: COLORS.muted,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 12,
  },
});